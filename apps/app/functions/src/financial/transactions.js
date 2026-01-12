const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { generateEntityId } = require("../shared/id");

const db = admin.firestore();


// Helper to get transactions collection
const getTransactionsColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("financialTransactions");

const getSessionsColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("cashierSessions");

/**
 * Função interna para criar transação.
 * Pode ser usada por outros módulos (ex: Contracts).
 * Suporta batch opcional.
 */
const createTransactionInternal = async (
  {
    idTenant,
    idBranch,
    payload,
    options = {},
    batch,
  },
) => {
  const transactionId = await generateEntityId(
    idTenant,
    idBranch,
    "transaction",
    { sequential: true },
  );

  const finalPayload = {
    idTransaction: transactionId,
    ...payload,
    idTenant,
    idBranch,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = getTransactionsColl(idTenant, idBranch);

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
 * Registra uma despesa.
 * Valida se o caixa está aberto antes de registrar.
 */
exports.addExpense = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const amount = Number(data.amount);
  const { description, category, method, metadata } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O valor deve ser maior que zero.",
    );
  }
  if (!description) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A descrição é obrigatória.",
    );
  }

  // Verificar se o caixa está aberto
  const sessionsRef = getSessionsColl(idTenant, idBranch);
  const openSnapshot = await sessionsRef
    .where("status", "==", "open")
    .limit(1)
    .get();

  if (openSnapshot.empty) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Não há caixa aberto para registrar despesa.",
    );
  }

  const payload = {
    type: "expense",
    source: "cashier",
    amount,
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    category: category || "Despesa",
    description,
    method: method || "Dinheiro",
    metadata: {
      ...metadata,
      registeredBy: token.name || token.email || "user",
      uid,
    },
  };

  try {
    return await createTransactionInternal({ idTenant, idBranch, payload });
  } catch (error) {
    console.error("Erro ao registrar despesa:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erro ao salvar despesa.",
    );
  }
});

/**
 * Registra uma receita de venda.
 */
exports.addSaleRevenue = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const amount = Number(data.amount);
  const {
    saleType,
    description,
    idSale,
    idContract,
    idProduct,
    idService,
    idClient,
    method,
    metadata,
    totals,
  } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O valor deve ser maior que zero.",
    );
  }

  const payload = {
    type: "sale",
    saleType: saleType || null,
    source: "contract",
    amount,
    date: new Date().toISOString().split("T")[0],
    category: "Venda",
    description: description || "Venda",
    idSale: idSale || null,
    idContract: idContract || null,
    idProduct: idProduct || null,
    idService: idService || null,
    idClient: idClient || null,
    method: method || "Outros",
    metadata: {
      ...metadata,
      totals,
      registeredBy: token.name || token.email || "user",
      uid,
    },
  };

  try {
    return await createTransactionInternal({ idTenant, idBranch, payload });
  } catch (error) {
    console.error("Erro ao registrar receita:", error);
    throw new functions.https.HttpsError("internal", "Erro ao salvar receita.");
  }
});

/**
 * Atualiza uma transação financeira.
 */
exports.updateFinancialTransaction = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idTransaction, ...updates } = data;

  if (!idTransaction) throw new functions.https.HttpsError("invalid-argument", "ID da transação é obrigatório.");

  const ref = getTransactionsColl(idTenant, idBranch).doc(idTransaction);

  // Filtra campos não permitidos se necessário, mas por enquanto vamos confiar no caller autenticado para campos gerais
  // e apenas garantir timestamps e contexto
  const payload = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  // Remover campos protegidos que não devem ser alterados via update simples
  delete payload.idTenant;
  delete payload.idBranch;
  delete payload.idTransaction;
  delete payload.createdAt;

  try {
    await ref.update(payload);
    return { id: idTransaction, ...payload };
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    throw new functions.https.HttpsError("internal", "Erro ao atualizar transação.");
  }
});

/**
 * Remove uma transação financeira.
 */
exports.deleteFinancialTransaction = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idTransaction } = data;

  if (!idTransaction) throw new functions.https.HttpsError("invalid-argument", "ID da transação é obrigatório.");

  const ref = getTransactionsColl(idTenant, idBranch).doc(idTransaction);

  try {
    await ref.delete();
    return { success: true, id: idTransaction };
  } catch (error) {
    console.error("Erro ao remover transação:", error);
    throw new functions.https.HttpsError("internal", "Erro ao remover transação.");
  }
});

// Exportar helper interno para uso em outros módulos
exports.createTransactionInternal = createTransactionInternal;
