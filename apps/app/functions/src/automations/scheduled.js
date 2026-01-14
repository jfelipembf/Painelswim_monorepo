const functions = require("firebase-functions/v1");
const { processDailyBirthdays } = require("./helpers/birthday.service");

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
    .schedule("00 09 * * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        try {
            await processDailyBirthdays();
        } catch (error) {
            console.error("Error in checkBirthdayAutomations:", error);
        }
    });
