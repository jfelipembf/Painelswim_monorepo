const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();
const { FieldValue } = admin.firestore;

/**
 * Atualiza os contadores em dailySummary e monthlySummary
 */
const updateSummaries = async ({
  idTenant,
  idBranch,
  dateStr,
  revenueDelta = 0,
  expenseDelta = 0,
  salesDelta = 0, // Novo: Delta de volume de vendas (valor bruto da venda)
}) => {
  if (!idTenant || !idBranch || !dateStr) {
    console.log("[updateSummaries] Missing params:", { idTenant, idBranch, dateStr });
    return;
  }

  if (revenueDelta === 0 && expenseDelta === 0 && salesDelta === 0) return;

  const monthId = dateStr.slice(0, 7); // YYYY-MM

  const dailyRef = db
    .collection("tenants").doc(idTenant)
    .collection("branches").doc(idBranch)
    .collection("dailySummary").doc(dateStr);

  const monthlyRef = db
    .collection("tenants").doc(idTenant)
    .collection("branches").doc(idBranch)
    .collection("monthlySummary").doc(monthId);

  const batch = db.batch();

  // Daily updates
  const dailyUpdates = { updatedAt: FieldValue.serverTimestamp() };
  if (revenueDelta !== 0) {
    dailyUpdates.totalRevenue = FieldValue.increment(revenueDelta);
  }
  if (expenseDelta !== 0) {
    dailyUpdates.totalExpenses = FieldValue.increment(expenseDelta);
    dailyUpdates.expenses = FieldValue.increment(expenseDelta);
  }
  if (salesDelta !== 0) {
    dailyUpdates.salesDay = FieldValue.increment(salesDelta);
  }

  // Monthly updates
  const monthlyUpdates = { updatedAt: FieldValue.serverTimestamp() };
  if (revenueDelta !== 0) {
    monthlyUpdates.totalRevenue = FieldValue.increment(revenueDelta);
  }
  if (expenseDelta !== 0) {
    monthlyUpdates.totalExpenses = FieldValue.increment(expenseDelta);
    monthlyUpdates.expenses = FieldValue.increment(expenseDelta);
  }
  if (salesDelta !== 0) {
    monthlyUpdates.salesMonth = FieldValue.increment(salesDelta);
  }

  batch.set(dailyRef, dailyUpdates, { merge: true });
  batch.set(monthlyRef, monthlyUpdates, { merge: true });

  try {
    await batch.commit();
    console.log(`[updateSummaries] Success for ${dateStr}:`, { revenueDelta, expenseDelta, salesDelta });
  } catch (err) {
    console.error("[updateSummaries] Error committing batch:", err);
  }
};

/**
 * Trigger para Transações Financeiras (Fluxo de Caixa)
 * Afeta: totalRevenue, totalExpenses, expenses
 */
exports.onFinancialTransactionWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/financialTransactions/{idTransaction}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const getValues = (data) => {
      if (!data) return { revenue: 0, expense: 0, date: null };
      const amount = Number(data.amount || 0);
      const date = data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0, 10) : null);

      // Sale = receita positiva
      if (data.type === "sale") return { revenue: amount, expense: 0, date };

      // Expense = despesa  positiva
      if (data.type === "expense") return { revenue: 0, expense: amount, date };

      // receivablePayment = entrada de dinheiro (receita positiva)
      // amount é negativo na transação, então invertemos
      if (data.type === "receivablePayment") {
        return { revenue: Math.abs(amount), expense: 0, date };
      }

      return { revenue: 0, expense: 0, date };
    };

    const valBefore = getValues(before);
    const valAfter = getValues(after);

    // Se mudou de dia
    if (before && after && valBefore.date !== valAfter.date) {
      // Subtrai do antigo
      await updateSummaries({
        idTenant, idBranch, dateStr: valBefore.date,
        revenueDelta: -valBefore.revenue,
        expenseDelta: -valBefore.expense
      });
      // Adiciona no novo
      await updateSummaries({
        idTenant, idBranch, dateStr: valAfter.date,
        revenueDelta: valAfter.revenue,
        expenseDelta: valAfter.expense
      });
    } else {
      // Mesmo dia ou criação/deleção
      const date = valAfter.date || valBefore.date;
      await updateSummaries({
        idTenant, idBranch, dateStr: date,
        revenueDelta: valAfter.revenue - valBefore.revenue,
        expenseDelta: valAfter.expense - valBefore.expense
      });
    }
  });

/**
 * Trigger para Vendas (Volume de Vendas)
 * Afeta: salesDay, salesMonth
 */
exports.onSaleWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/sales/{idSale}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const getVal = (data) => {
      if (!data) return { amount: 0, date: null };
      // Usamos o valor líquido da venda (net) para as estatísticas de vendas
      const amount = Number(data.totals?.net || 0);
      const date = data.saleDate || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0, 10) : null);
      return { amount, date };
    };

    const valBefore = getVal(before);
    const valAfter = getVal(after);

    if (before && after && valBefore.date !== valAfter.date) {
      await updateSummaries({ idTenant, idBranch, dateStr: valBefore.date, salesDelta: -valBefore.amount });
      await updateSummaries({ idTenant, idBranch, dateStr: valAfter.date, salesDelta: valAfter.amount });
    } else {
      const date = valAfter.date || valBefore.date;
      await updateSummaries({
        idTenant, idBranch, dateStr: date,
        salesDelta: valAfter.amount - valBefore.amount
      });
    }
  });
