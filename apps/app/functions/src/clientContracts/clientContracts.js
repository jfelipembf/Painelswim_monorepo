const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAuthContext } = require("../shared/context");
const { generateEntityId } = require("../shared/id");
const { createTransactionInternal } = require("../financial/transactions");
const { buildClientContractPayload } = require("../shared/payloads");

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const getContractsColl = (idTenant, idBranch) =>
  db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientsContracts");

const getEnrollmentsColl = (idTenant, idBranch) =>
  db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");

const parseDate = (str) => {
  if (!str) return null;
  // Assumes YYYY-MM-DD
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getToday = () => {
  // Simple "today" based on server time (usually UTC).
  // If timezone support is needed, it should be handled with offset.
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Cria um novo contrato de cliente.
 */

/**
 * Internal function to create a client contract.
 */
const createClientContractInternal = async ({ idTenant, idBranch, uid, data, batch, token }) => {
  // 1. Validar Datas (Lógica centralizada no backend)
  const todayStr = new Date().toISOString().split("T")[0];
  if (data.startDate && data.startDate < todayStr) {
    // console.warn("Contrato iniciando no passado, mas permitido via backend (auditoria)");
  }
  if (data.endDate && data.startDate && data.endDate <= data.startDate) {
    throw new Error("Data de fim deve ser posterior à data de início.");
  }

  // 2. Gerar código do contrato
  const contractCode = await generateEntityId(idTenant, idBranch, "contract", { sequential: true });

  const rawPayload = buildClientContractPayload({
    ...data,
    contractCode, // Pass generated code
    contractTitle: data.contractTitle || data.title || null, // Ensure title availability
  });

  const payload = {
    ...rawPayload,
    idTenant,
    idBranch,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  };

  const contractsRef = getContractsColl(idTenant, idBranch);
  const contractDocRef = contractsRef.doc(); // Auto ID

  // Use provided batch or create a new one (if not provided)
  // Check if batch is valid firebase batch
  const internalBatch = batch || db.batch();

  internalBatch.set(contractDocRef, payload);

  // Se houver valor e NÃO for via Venda (idSale presente), registrar receita automaticamente ???
  // Se vier via saveSale, a receita já é tratada lá.
  // Vamos manter a lógica original: se tiver value > 0 E NÃO for parte de uma venda maior (que trataria o financeiro), cria.
  // Mas espera, se idSale for passado, assumimos que o financeiro foi tratado pela Venda?
  // O código original criava transaction se data.value > 0.
  // Vamos manter, mas cuidado com duplicação.
  // Se chamado pelo saveSale, data.value pode vir zerado ou tratamos lá.

  if (!data.idSale && Number(data.value) > 0) {
    try {
      await createTransactionInternal({
        idTenant,
        idBranch,
        batch: internalBatch,
        payload: {
          type: "sale",
          saleType: "contract",
          source: "contract",
          amount: Number(data.value),
          date: new Date().toISOString().split("T")[0],
          category: "Venda",
          description: `Contrato ${contractCode} - ${data.contractTitle || "Sem título"}`,
          idContract: contractDocRef.id,
          idClient: data.idClient,
          method: data.paymentMethod || "Outros",
          metadata: {
            contractType: data.contractTitle || "generic",
            startDate: data.startDate,
            endDate: data.endDate,
            idSale: data.idSale || null,
            registeredBy: token?.name || token?.email || "user",
            uid,
          },
        },
      });
    } catch (err) {
      console.error("Falha ao preparar receita do contrato (ignorado):", err);
    }
  }

  // Atualizar status do cliente para "active"
  const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);
  internalBatch.update(clientRef, {
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (!batch) {
    await internalBatch.commit();
  }

  return {
    id: contractDocRef.id,
    ...payload,
  };
};

// Export internal for use in SALES
exports.createClientContractInternal = createClientContractInternal;


/**
 * Cria um novo contrato de cliente.
 */
exports.createClientContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  if (!data.idClient) {
    throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório.");
  }

  try {
    return await createClientContractInternal({
      idTenant, idBranch, uid, token, data
    });
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    throw new functions.https.HttpsError("internal", "Erro ao criar contrato.");
  }
});

/**
 * Agendar ou ativar suspensão de contrato.
 */
exports.scheduleContractSuspension = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idClientContract, startDate, endDate, reason } = data;

  if (!idClientContract) throw new functions.https.HttpsError("invalid-argument", "ID do contrato é obrigatório.");
  if (!startDate || !endDate) throw new functions.https.HttpsError("invalid-argument", "Datas são obrigatórias.");

  const parsedStart = parseDate(startDate);
  const parsedEnd = parseDate(endDate);

  if (!parsedStart || !parsedEnd) throw new functions.https.HttpsError("invalid-argument", "Datas inválidas.");
  if (parsedEnd < parsedStart) throw new functions.https.HttpsError("invalid-argument", "Data final deve ser posterior à inicial.");

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRequested = Math.floor((parsedEnd.getTime() - parsedStart.getTime()) / msPerDay) + 1;

  const contractsRef = getContractsColl(idTenant, idBranch);
  const contractRef = contractsRef.doc(idClientContract);
  const suspRef = contractRef.collection("suspensions").doc();

  const today = getToday();
  const shouldActivateNow = parsedStart.getTime() <= today.getTime();
  let newEndDateStr = null;

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(contractRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");

      const contract = snap.data();
      if (!contract.allowSuspension) throw new functions.https.HttpsError("failed-precondition", "Contrato não permite suspensão.");

      const maxDays = Number(contract.suspensionMaxDays || 0);
      const totalSuspendedDays = Number(contract.totalSuspendedDays || 0);
      const pendingSuspensionDays = Number(contract.pendingSuspensionDays || 0);

      if (maxDays > 0 && totalSuspendedDays + pendingSuspensionDays + daysRequested > maxDays) {
        throw new functions.https.HttpsError("failed-precondition", "Limite de dias de suspensão excedido.");
      }

      if (shouldActivateNow) {
        const currentEndDate = parseDate(contract.endDate || contract.endAt);
        if (!currentEndDate) throw new functions.https.HttpsError("failed-precondition", "Contrato sem data de término.");

        const updatedEnd = new Date(currentEndDate);
        updatedEnd.setDate(updatedEnd.getDate() + daysRequested);
        newEndDateStr = formatDateString(updatedEnd);
      }

      const payload = {
        idClientContract,
        startDate,
        endDate,
        reason: reason || null,
        status: shouldActivateNow ? "active" : "scheduled",
        daysUsed: daysRequested,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        processedAt: shouldActivateNow ? FieldValue.serverTimestamp() : null,
        previousEndDate: contract.endDate || null,
        newEndDate: newEndDateStr,
      };

      t.set(suspRef, payload);

      const updates = shouldActivateNow ?
        {
          endDate: newEndDateStr,
          totalSuspendedDays: totalSuspendedDays + daysRequested,
          status: "suspended",
          updatedAt: FieldValue.serverTimestamp(),
        } :
        {
          pendingSuspensionDays: pendingSuspensionDays + daysRequested,
          updatedAt: FieldValue.serverTimestamp(),
        };

      t.update(contractRef, updates);
    });

    return {
      success: true,
      id: suspRef.id,
      startDate,
      endDate,
      reason,
      status: shouldActivateNow ? "active" : "scheduled",
      daysUsed: daysRequested,
      newEndDate: newEndDateStr,
    };
  } catch (error) {
    console.error("Erro ao agendar suspensão:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao processar suspensão.");
  }
});

/**
 * Cancelar contrato.
 */
exports.cancelClientContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idClientContract, reason, refundRevenue, schedule, cancelDate } = data;

  if (!idClientContract) throw new functions.https.HttpsError("invalid-argument", "ID do contrato é obrigatório.");

  const contractRef = getContractsColl(idTenant, idBranch).doc(idClientContract);
  const today = getToday();

  let result = null;

  try {
    result = await db.runTransaction(async (t) => {
      const snap = await t.get(contractRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");

      const contract = snap.data();
      if (contract.status === "canceled") return { status: "canceled" };

      if (schedule) {
        const target = parseDate(cancelDate);
        if (!target || target < today) throw new functions.https.HttpsError("invalid-argument", "Data inválida para cancelamento agendado.");

        t.update(contractRef, {
          status: "scheduled_cancellation",
          cancelDate,
          cancelReason: reason || null,
          canceledBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { status: "scheduled_cancellation" };
      }

      // Cancelamento imediato
      t.update(contractRef, {
        status: "canceled",
        canceledAt: FieldValue.serverTimestamp(),
        canceledBy: uid,
        cancelReason: reason || null,
        updatedAt: FieldValue.serverTimestamp(),
        refunded: Boolean(refundRevenue),
      });

      return {
        status: "canceled",
        idClient: contract.idClient,
        idSale: contract.idSale,
        contract, // Return full contract to be safe if needed
      };
    });
  } catch (error) {
    console.error("Erro ao cancelar contrato:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao cancelar contrato.");
  }

  // Limpeza de matrículas e financeiro (fora da transação)
  if (!schedule && result?.status === "canceled") {
    try {
      // 1. Matrículas
      const todayStr = formatDateString(today);
      const enrollmentsRef = getEnrollmentsColl(idTenant, idBranch);
      const snapshot = await enrollmentsRef.where("idClient", "==", result.idClient).get();

      const batch = db.batch();
      let count = 0;

      snapshot.forEach((doc) => {
        const e = doc.data();
        if (e.type === "recurring" || (e.type === "single-session" && e.sessionDate >= todayStr)) {
          batch.delete(doc.ref);
          count++;
        }
      });

      // 2. Financeiro (Dívidas), se configurado
      const settingsRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/settings/general`);
      const settingsSnap = await settingsRef.get();
      const cancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;

      if (cancelDebt) {
        // Buscar recebíveis em aberto ligados ao contrato ou venda
        const receivablesRef = db
          .collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

        let debtsQuery = receivablesRef.where("status", "==", "open");

        // Tenta filtrar por idContract se existir, ou idSale
        // Como o Firestore não faz OR nativo entre campos diferentes facilmente na mesma query sem indices complexos, 
        // vamos priorizar idSale se houver, ou buscar ambos se necessário.
        // Simplificação: Se tiver idSale, usa. Se não, tenta idContract se o receivable tiver esse campo (nosso model tem idSale e metadata).

        let docsToCancel = [];

        if (result.idSale) {
          const saleDebts = await receivablesRef
            .where("idSale", "==", result.idSale)
            .where("status", "==", "open")
            .get();
          docsToCancel = [...saleDebts.docs];
        }

        // Se idSale não cobriu, podemos tentar achar por metadados se o contrato tiver gerado.
        // Para evitar complexidade e leituras excessivas, vamos cancelar apenas se linkado à venda por enquanto.
        // Opcional: Se quiser ser agressivo, buscar por idClient e filtrar memory? Pode ser pesado.

        if (docsToCancel.length > 0) {
          docsToCancel.forEach(doc => {
            batch.update(doc.ref, {
              status: "canceled",
              canceledAt: FieldValue.serverTimestamp(),
              cancelReason: "Cancelamento de contrato (Automático)",
              updatedAt: FieldValue.serverTimestamp()
            });
            count++;
          });
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.error("Erro na limpeza pós-cancelamento:", e);
      // Não falha a requisição principal pois o contrato já foi cancelado
    }
  }

  return { success: true, ...result };
});

/**
 * Interromper uma suspensão ativa ou agendada.
 */
exports.stopClientContractSuspension = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idClientContract, idSuspension } = data;

  if (!idClientContract || !idSuspension) {
    throw new functions.https.HttpsError("invalid-argument", "ID do contrato e da suspensão são obrigatórios.");
  }

  const contractsRef = getContractsColl(idTenant, idBranch);
  const contractRef = contractsRef.doc(idClientContract);
  const suspRef = contractRef.collection("suspensions").doc(idSuspension);

  try {
    return await db.runTransaction(async (t) => {
      const contractSnap = await t.get(contractRef);
      const suspSnap = await t.get(suspRef);

      if (!contractSnap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");
      if (!suspSnap.exists) throw new functions.https.HttpsError("not-found", "Suspensão não encontrada.");

      const contract = contractSnap.data();
      const suspension = suspSnap.data();

      const statusLower = (suspension.status || "").toLowerCase();
      const isScheduled = statusLower === "scheduled";
      const isActive = statusLower === "active";

      if (!isScheduled && !isActive) {
        throw new functions.https.HttpsError("failed-precondition", `Apenas suspensões ativas ou agendadas podem ser interrompidas. Status atual: ${suspension.status}`);
      }

      // Se for agendada: Apenas cancela o agendamento
      if (isScheduled) {
        const daysToReturn = Number(suspension.daysUsed || 0);

        t.update(suspRef, {
          status: "cancelled", // Mudando para cancelled para diferenciar de stopped
          stoppedAt: FieldValue.serverTimestamp(),
          stoppedBy: uid,
          unusedDays: daysToReturn,
          daysUsed: 0,
        });

        // Devolver dias para pendingSuspensionDays do contrato
        t.update(contractRef, {
          pendingSuspensionDays: Math.max(0, (Number(contract.pendingSuspensionDays || 0) - daysToReturn)),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          type: "scheduled_cancelled",
          unusedDays: daysToReturn,
        };
      }

      // Se for ativa: Interrompe hoje e reajusta o contrato
      const today = getToday();
      const startDate = parseDate(suspension.startDate);
      const originalEndDate = parseDate(suspension.endDate);

      if (!startDate || !originalEndDate) {
        throw new functions.https.HttpsError("internal", "Dados de data da suspensão corrompidos.");
      }

      const msPerDay = 1000 * 60 * 60 * 24;

      // Dias que seriam usados originalmente
      const originalDaysRequested = Number(suspension.daysUsed || 0);

      // Calcular dias efetivamente usados (startDate até hoje inclusive? ou até ontem?)
      // Se paramos hoje, o aluno volta a contar hoje. Então ele usou de startDate até ONTEM.
      let actuallyUsedDays = Math.floor((today.getTime() - startDate.getTime()) / msPerDay);
      if (actuallyUsedDays < 0) actuallyUsedDays = 0;

      const unusedDays = originalDaysRequested - actuallyUsedDays;

      if (unusedDays <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "A suspensão já está no fim ou já expirou.");
      }

      // Reajustar data final do contrato
      const currentContractEndDate = parseDate(contract.endDate || contract.endAt);
      if (!currentContractEndDate) {
        throw new functions.https.HttpsError("failed-precondition", "Contrato sem data de término (plano infinito?)");
      }

      const newContractEndDate = new Date(currentContractEndDate);
      newContractEndDate.setDate(newContractEndDate.getDate() - unusedDays);
      const newContractEndDateStr = formatDateString(newContractEndDate);

      // Atualizar Suspensão
      const yesterday = new Date(today.getTime() - msPerDay);
      t.update(suspRef, {
        status: "stopped",
        endDate: formatDateString(yesterday), // Novo fim da suspensão foi ontem
        daysUsed: actuallyUsedDays,
        unusedDays: unusedDays,
        stoppedAt: FieldValue.serverTimestamp(),
        stoppedBy: uid,
      });

      // Atualizar Contrato
      t.update(contractRef, {
        status: "active",
        endDate: newContractEndDateStr,
        totalSuspendedDays: Math.max(0, (Number(contract.totalSuspendedDays || 0) - unusedDays)),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        type: "active_stopped",
        actuallyUsedDays,
        unusedDays,
        newContractEndDate: newContractEndDateStr,
      };
    });
  } catch (error) {
    console.error("ERRO [stopClientContractSuspension]:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro desconhecido ao interromper suspensão.");
  }
});
