const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { generateEntityId } = require("../shared/id");
const { buildReceivablePayload } = require("../shared/payloads");

const db = admin.firestore();


// Helper to get receivables collection
const getReceivablesColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("receivables");

/**
 * Função interna para criar recebível.
 * Suporta batch opcional.
 */
const createReceivableInternal = async (
  {
    idTenant,
    idBranch,
    payload,
    uid,
    userToken,
    batch,
  },
) => {
  const receivableCode = await generateEntityId(
    idTenant,
    idBranch,
    "receivable",
    { sequential: true },
  );

  const rawPayload = buildReceivablePayload(payload);

  const finalPayload = {
    ...rawPayload,
    receivableCode,
    // Add missing fields not in builder but required by backend
    amountPaid: Number(payload.amountPaid || 0),
    paymentType: payload.paymentType || null,
    cardAcquirer: payload.cardAcquirer || null,
    cardFlag: payload.cardFlag || null,
    authorization: payload.authorization || null,
    currentInstallment: payload.currentInstallment || 1,
    totalInstallments: payload.totalInstallments || 1,
    competenceDate: payload.competenceDate || payload.dueDate || new Date().toISOString().split("T")[0],

    // System Metadata
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    createdByName: userToken?.name || userToken?.email || "System",
    idTenant,
    idBranch,
  };

  const ref = getReceivablesColl(idTenant, idBranch);

  if (batch) {
    const docRef = ref.doc();
    batch.set(docRef, finalPayload);
    return { id: docRef.id, ...finalPayload };
  } else {
    const docRef = await ref.add(finalPayload);
    return { id: docRef.id, ...finalPayload };
  }
};

/**
 * Adiciona um novo recebível (Conta a Receber).
 */
exports.addReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  const amount = Number(data.amount);
  if (!amount || amount < 0) {
    throw new functions.https.HttpsError("invalid-argument", "O valor deve ser positivo.");
  }

  try {
    return await createReceivableInternal({
      idTenant,
      idBranch,
      payload: data,
      uid,
      userToken: token,
    });
  } catch (error) {
    console.error("Erro ao criar recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao salvar conta a receber.");
  }
});

exports.createReceivableInternal = createReceivableInternal;

/**
 * Atualiza um recebível.
 */
exports.updateReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idReceivable, ...updates } = data;

  if (!idReceivable) throw new functions.https.HttpsError("invalid-argument", "ID do recebível é obrigatório.");

  const ref = getReceivablesColl(idTenant, idBranch).doc(idReceivable);

  const payload = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  // Remover campos protegidos
  delete payload.idTenant;
  delete payload.idBranch;
  delete payload.idReceivable;
  delete payload.receivableCode;
  delete payload.createdAt;

  try {
    await ref.update(payload);
    return { id: idReceivable, ...payload };
  } catch (error) {
    console.error("Erro ao atualizar recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao atualizar recebível.");
  }
});

/**
 * Remove um recebível.
 */
exports.deleteReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idReceivable } = data;

  if (!idReceivable) throw new functions.https.HttpsError("invalid-argument", "ID do recebível é obrigatório.");

  const ref = getReceivablesColl(idTenant, idBranch).doc(idReceivable);

  try {
    await ref.delete();
    return { success: true, id: idReceivable };
  } catch (error) {
    console.error("Erro ao remover recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao remover recebível.");
  }
});

/**
 * Helper: Distribui um valor de pagamento entre recebíveis em aberto
 * Usa estratégia FIFO (mais antigos primeiro)
 */
const distributePaymentToReceivables = (receivables, totalPayment) => {
  // Ordenar por dueDate (mais antigo primeiro)
  const sorted = [...receivables].sort((a, b) => {
    const dateA = new Date(a.dueDate || "9999-12-31");
    const dateB = new Date(b.dueDate || "9999-12-31");
    return dateA.getTime() - dateB.getTime();
  });

  let remaining = Number(totalPayment);
  const distribution = [];

  for (const receivable of sorted) {
    if (remaining <= 0) break;

    // Compatibilidade: balance (novo) ou pending (legado)
    const pending = Number(receivable.balance || receivable.pending || 0);
    if (pending <= 0) continue;

    const amountToPay = Math.min(remaining, pending);

    distribution.push({
      idReceivable: receivable.id,
      originalPending: pending,
      amountToPay,
      newPending: pending - amountToPay,
      willBeFullyPaid: (pending - amountToPay) === 0,
    });

    remaining -= amountToPay;
  }

  return {
    distribution,
    remainingAmount: remaining,
    totalDistributed: Number(totalPayment) - remaining,
  };
};

/**
 * Paga recebíveis em aberto (saldo devedor).
 * Cria uma transação financeira e atualiza os receivables.
 * Se for pagamento parcial, cria um novo receivable para o saldo restante.
 */
exports.payReceivables = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const {
    idClient,
    amount,
    paymentMethod,
    paymentDate,
    receivableIds,
    // Card payment fields
    authorization,
    acquirer,
    brand,
    installments,
    // Partial payment
    nextDueDate
  } = data;

  if (!idClient) {
    throw new functions.https.HttpsError("invalid-argument", "ID do cliente é obrigatório.");
  }

  const paymentAmount = Number(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Valor do pagamento deve ser positivo.");
  }

  if (!paymentMethod) {
    throw new functions.https.HttpsError("invalid-argument", "Forma de pagamento é obrigatória.");
  }

  // Gerar IDs estruturados antes da transação para evitar nested transactions
  const transactionCode = await generateEntityId(idTenant, idBranch, "transaction", { sequential: true });
  // Gerar código de receivable preventivamente (caso precise para pagamento parcial)
  const newReceivableCode = await generateEntityId(idTenant, idBranch, "receivable", { sequential: true });

  try {
    return await db.runTransaction(async (t) => {
      const receivablesRef = getReceivablesColl(idTenant, idBranch);

      // 1. Buscar receivables em aberto
      // Buscar por balance > 0 (campo usado nas vendas) ou pending > 0
      let query = receivablesRef
        .where("idClient", "==", idClient)
        .where("status", "==", "open");

      if (receivableIds && receivableIds.length > 0) {
        // Se IDs específicos foram fornecidos, buscar apenas esses
        query = receivablesRef.where(admin.firestore.FieldPath.documentId(), "in", receivableIds);
      }

      const receivablesSnap = await t.get(query);

      console.log(`[payReceivables] Found ${receivablesSnap.size} receivables for client ${idClient}`);

      if (receivablesSnap.empty) {
        console.error(`[payReceivables] No receivables found for client ${idClient}`);
        throw new functions.https.HttpsError("not-found", "Nenhum recebível em aberto encontrado.");
      }

      const receivables = receivablesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[payReceivables] Receivables:`, receivables.map(r => ({
        id: r.id,
        balance: r.balance,
        pending: r.pending,
        status: r.status
      })));

      // Calcular total em aberto (compatibilidade balance/pending)
      const totalPending = receivables.reduce((sum, rec) =>
        sum + Number(rec.balance || rec.pending || 0), 0
      );

      console.log(`[payReceivables] Total pending: ${totalPending}, Payment amount: ${paymentAmount}`);

      // 2. Distribuir pagamento
      const { distribution, remainingAmount, totalDistributed } = distributePaymentToReceivables(
        receivables,
        paymentAmount,
      );

      console.log(`[payReceivables] Distribution result:`, {
        totalDistributed,
        remainingAmount,
        distributionCount: distribution.length
      });

      if (totalDistributed === 0) {
        console.error(`[payReceivables] totalDistributed is 0. Receivables:`, receivables.map(r => ({
          id: r.id,
          pending: r.pending,
          paid: r.paid,
          amount: r.amount
        })));
        throw new functions.https.HttpsError("failed-precondition", "Nenhum valor foi distribuído. Verifique os receivables.");
      }

      // 3. Criar transação financeira
      const transactionsRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("financialTransactions");

      const transactionPayload = {
        type: "receivablePayment",
        description: `Pagamento de saldo devedor - ${distribution.length} recebível(is)`,
        idClient,
        idTenant,
        idBranch,
        transactionCode, // ID Estruturado
        method: paymentMethod,
        amount: -totalDistributed, // Negativo pois é pagamento (saída do cliente)
        date: paymentDate || new Date().toISOString().split("T")[0],
        status: "completed",
        receivableIds: distribution.map(d => d.idReceivable),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        createdByName: token?.name || token?.email || "System",
      };

      // Adicionar campos de cartão se fornecidos
      if (paymentMethod === "credito" || paymentMethod === "debito") {
        if (authorization) transactionPayload.cardAuthorization = authorization;
        if (acquirer) transactionPayload.cardAcquirer = acquirer;
        if (brand) transactionPayload.cardBrand = brand;
        if (paymentMethod === "credito" && installments) {
          transactionPayload.cardInstallments = Number(installments);
        }
      }

      const transactionRef = transactionsRef.doc();
      t.set(transactionRef, transactionPayload);

      // 4. Atualizar cada receivable
      const updatedReceivables = [];
      for (const item of distribution) {
        const recRef = receivablesRef.doc(item.idReceivable);
        const currentRec = receivables.find(r => r.id === item.idReceivable);

        const newPaid = Number(currentRec.paid || currentRec.amountPaid || 0) + item.amountToPay;
        const newPending = item.newPending;
        const newStatus = item.willBeFullyPaid ? "paid" : "open";

        const updatePayload = {
          paid: newPaid,
          amountPaid: newPaid, // Keeping both for compatibility
          pending: newPending,
          balance: newPending, // Balance = pending (usado nas vendas)
          status: newStatus,
          lastPaymentAt: FieldValue.serverTimestamp(),
          lastPaymentMethod: paymentMethod,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        };

        t.update(recRef, updatePayload);

        updatedReceivables.push({
          id: item.idReceivable,
          ...updatePayload,
          amountPaid: item.amountToPay,
        });
      }

      // 5. Se for pagamento parcial (totalPaid < totalPending), criar novo receivable
      let newReceivableId = null;
      const stillPending = totalPending - totalDistributed;

      if (stillPending > 0 && nextDueDate) {
        const newReceivableRef = receivablesRef.doc();

        const newReceivablePayload = {
          idClient,
          idTenant,
          idBranch,
          receivableCode: newReceivableCode, // ID Estruturado
          description: "Saldo devedor remanescente - Pagamento parcial",
          amount: stillPending,
          paid: 0,
          amountPaid: 0,
          pending: stillPending,
          balance: stillPending, // Compatibilidade com vendas
          status: "open",
          dueDate: nextDueDate,
          competenceDate: nextDueDate,
          paymentType: null,
          currentInstallment: 1,
          totalInstallments: 1,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: uid,
          createdByName: token?.name || token?.email || "System",
          notes: `Criado automaticamente após pagamento parcial de R$ ${totalDistributed.toFixed(2)} em ${paymentDate || new Date().toISOString().split("T")[0]}`,
        };

        t.set(newReceivableRef, newReceivablePayload);
        newReceivableId = newReceivableRef.id;
      }

      return {
        success: true,
        transactionId: transactionRef.id,
        totalPaid: totalDistributed,
        totalPending,
        stillPending,
        isPartialPayment: stillPending > 0,
        newReceivableId,
        receivablesUpdated: updatedReceivables.length,
        receivables: updatedReceivables,
      };
    });
  } catch (error) {
    console.error("ERRO [payReceivables]:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao processar pagamento de receivables.");
  }
});
