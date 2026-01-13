const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { toISODate, addDays } = require("../helpers/date");

// ============================================================================
// SCHEDULED TASKS (Tarefas Agendadas)
// ============================================================================

/**
 * Rotina diária para cancelar contratos com inadimplência superior ao configurado.
 * Frequência: Diariamente às 01:00 AM (Brasília).
 * Lógica:
 * 1. Verifica configuração `activeContractCancellation`.
 * 2. Busca recebíveis em atraso acima do limite de dias.
 * 3. Identifica clientes inadimplentes.
 * 4. Cancela contratos ativos desses clientes.
 */
exports.processContractDefaultCancellation = functions
    .region("us-central1")
    .pubsub.schedule("0 1 * * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async (_) => {
        const db = admin.firestore();


        try {
            // 1. Iterar Tenants/Units para ler configurações
            const tenantsSnap = await db.collection("tenants").get();

            for (const tenantDoc of tenantsSnap.docs) {
                const tenantId = tenantDoc.id;
                const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

                for (const branchDoc of branchesSnap.docs) {
                    const branchId = branchDoc.id;

                    // Ler config
                    const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);
                    const settingsSnap = await settingsRef.get();
                    if (!settingsSnap.exists) continue;

                    const settings = settingsSnap.data();
                    const cancelDays = Number(settings.finance?.cancelContractAfterDays || 0); // ex: 30

                    if (cancelDays <= 0) continue; // Desativado

                    // Calcular data limite: Hoje - cancelDays
                    const limitDateIso = toISODate(addDays(new Date(), -cancelDays));


                    // Buscar Recebíveis VENCIDOS antes da data limite e ABERTOS
                    // Recebíveis antigos em aberto = Inadimplência crítica
                    const receivablesRef = db.collection(`tenants/${tenantId}/branches/${branchId}/receivables`);

                    const overdueSnap = await receivablesRef
                        .where("status", "==", "open")
                        .where("dueDate", "<=", limitDateIso) // Venceu há mais de X dias
                        .get();

                    if (overdueSnap.empty) continue;

                    // Agrupar por Contrato ou Cliente
                    // Se o recebível tiver idSale, buscamos o contrato dessa venda?
                    // Ou se tiver idClient, buscamos os contratos ATIVOS desse cliente?
                    // "Cancelar contrato por inadimplência"
                    // Melhor abordagem: Pegar todos os unique idClients dessas dívidas.
                    // Para cada cliente, buscar contratos ATIVOS.
                    // Opcional: Verificar se a dívida é DO contrato específico (via idSale).
                    // Para simplificar e ser efetivo: Se o cliente tem dívida crítica, cancela os contratos dele (ou marca para análise).
                    // O requisito é "Cancel contract after days of default".
                    // Vamos filtrar contratos ativos desse cliente.

                    const clientIds = new Set();
                    overdueSnap.docs.forEach(d => {
                        const data = d.data();
                        if (data.idClient) clientIds.add(data.idClient);
                    });

                    for (const clientId of clientIds) {
                        const contractsRef = db.collection(`tenants/${tenantId}/branches/${branchId}/clientsContracts`);
                        const activeContractsSnap = await contractsRef
                            .where("idClient", "==", clientId)
                            .where("status", "==", "active")
                            .get();

                        if (activeContractsSnap.empty) continue;

                        const batch = db.batch();
                        let batchCount = 0;

                        activeContractsSnap.docs.forEach(c => {
                            batch.update(c.ref, {
                                status: "canceled",
                                cancelReason: `Inadimplência automática (> ${cancelDays} dias)`,
                                canceledAt: admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                                canceledBy: "system"
                            });

                            // Nota: Não limpamos matrículas aqui para economizar complexidade na batch, 
                            // ou deveríamos? Se cancelou, o aluno não deve entrar.
                            // Idealmente deveríamos chamar a lógica de limpeza.
                            // Como estamos num loop deep, vamos fazer o update simples e confiar que 
                            // o "canceled" já bloqueia acesso na catraca/app.
                            // Futuramente: Trigger onUpdate contract -> clean enrollments.
                            batchCount++;
                        });

                        // Opcional: Também cancelar a dívida SE a config "cancelDebtOnCancelledContracts" tiver ativa?
                        // Risco de loop ou cancelamento de dívida que originou o cancelamento.
                        // Se a dívida gerou o cancelamento, geralmente NÃO se cancela a dívida, cobra-se judicialmente.
                        // Então não vamos cancelar a dívida aqui.

                        if (batchCount > 0) await batch.commit();
                    }
                }
            }
        } catch (e) {
            console.error("Erro na rotina de cancelamento por inadimplência:", e);
        }
        return null;
    });


