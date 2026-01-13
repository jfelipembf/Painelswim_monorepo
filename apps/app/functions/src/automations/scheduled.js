const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("./helpers/helper");

/**
 * ============================================================================
 * SCHEDULED AUTOMATIONS
 * ____________________________________________________________________________
 *
 * 1. checkBirthdayAutomations: Função agendada para verificar automações de aniversário.
 *
 * ============================================================================
 */

/**
 * Função agendada para verificar automações de aniversário.
 * Executa todos os dias às 09:00 (Horário de São Paulo).
 */
exports.checkBirthdayAutomations = functions.pubsub
    .schedule("0 9 * * *") // Daily at 09:00
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {


        // 1. Buscar todas as automações de ANIVERSÁRIO ativas em todos os tenants/filiais
        // O uso de Collection Group Query requer um índice em 'type' e 'active'
        // Índice: automations (collectionId) -> campos: type: ASC, active: ASC

        try {
            const automationsSnap = await db.collectionGroup("automations")
                .where("type", "==", "BIRTHDAY")
                .where("active", "==", true)
                .get();

            if (automationsSnap.empty) {

                return null;
            }



            const promises = automationsSnap.docs.map(async (doc) => {
                const automation = doc.data();
                // Obter IDs da Filial e Tenant pai a partir do caminho do doc ref
                // Caminho: tenants/{idTenant}/branches/{idBranch}/automations/{autoId}
                const pathSegments = doc.ref.path.split("/");
                const idTenant = pathSegments[1];
                const idBranch = pathSegments[3];

                // Determinar a data alvo do aniversário
                // Padrão: Hoje. Se config.daysBefore estiver definido (ex: 1), verificamos aniversários daqui a X dias?
                // Normalmente a mensagem de "Aniversário" é enviada NO dia, mas suportamos "daysBefore" se necessário.
                // Se daysBefore > 0, significa que enviamos lógica para "Aniversário Chegando".

                const daysBefore = automation.config?.daysBefore || 0;
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + daysBefore);

                const targetMonth = targetDate.getMonth() + 1; // 1-12
                const targetDay = targetDate.getDate(); // 1-31



                // Consultar Clientes: mais simples consultar por birthMonth e birthDay se armazenados separadamente.
                // Se birthDate for string YYYY-MM-DD, não podemos consultar intervalo facilmente.
                // Vamos assumir que iteramos clientes ativos ou usamos uma estrutura existente.
                // Para eficiência, vamos buscar a coleção 'clients' onde status == 'active'.

                // IMPORTANTE: Consultar todos os clientes pode ser custoso se houver muitos.
                // Idealmente, clientes deveriam ter campos 'birthMonth' e 'birthDay' indexados.
                // SE NÃO, temos que buscar tudo e filtrar em memória (perigo para bases grandes).
                // Vamos assumir que filtramos em memória por enquanto, pois não quero migrar o DB.

                const clientsRef = db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients");

                const clientsSnap = await clientsRef
                    .where("status", "==", "active") // Apenas clientes ativos?
                    .get();

                const matches = [];

                // Iterar sobre os snapshots para filtrar em memória
                clientsSnap.forEach(clientDoc => {
                    const client = clientDoc.data();

                    // Validar se birthDate existe e se é uma string válida
                    if (!client.birthDate || typeof client.birthDate !== "string") return;

                    // Parsear data de nascimento (esperando YYYY-MM-DD, ex: "1984-10-16")
                    const parts = client.birthDate.split("-");
                    if (parts.length !== 3) return; // formato inválido

                    const m = Number(parts[1]); // Mês (1-12)
                    const d = Number(parts[2]); // Dia (1-31)

                    if (m === targetMonth && d === targetDay) {
                        matches.push(client);
                    }
                });



                // Processar Gatilho para cada correspondência
                const triggerPromises = matches.map(client => {
                    const data = {
                        name: client.name || "Aluno",
                        professional: "", // Não aplicável para aniversário
                        date: `${targetDay}/${targetMonth}`, // String de aniversário
                        time: "",
                        phone: client.phone || client.mobile || client.whatsapp
                    };

                    // Chamamos processTrigger, mas precisamos ignorar 'buscar automação' novamente 
                    // porque processTrigger busca a automação por tipo. 
                    // Para ser eficiente, processTrigger normalmente busca. 
                    // Aqui JÁ TÍNHAMOS o doc da automação, mas processTrigger reinicia a lógica.
                    // Tudo bem para reutilização, apenas overhead. 
                    // Para melhor eficiência, poderíamos chamar sendWhatsApp diretamente, mas vamos manter processTrigger pela consistência.
                    return processTrigger(idTenant, idBranch, "BIRTHDAY", data);
                });

                return Promise.all(triggerPromises);
            });

            await Promise.all(promises);


        } catch (error) {
            console.error("Error in checkBirthdayAutomations:", error);
        }
    });
