const axios = require("axios");

/**
 * Cria ou verifica a existência de uma instância na Evolution API.
 * 
 * @param {string} baseUrl - URL base da API Evolution (ex: https://api.meudominio.com).
 * @param {string} apiKey - Chave de autenticação global da Evolution API.
 * @param {string} instanceName - Nome da instância a ser criada/verificada.
 * @returns {Promise<void>} - Retorna void em sucesso ou loga apenas o erro sem interromper o fluxo crítico.
 */
const ensureEvolutionInstance = async (baseUrl, apiKey, instanceName) => {
    if (!baseUrl || !apiKey || !instanceName) {
        console.warn("EvolutionService: Dados insuficientes para criar instância.");
        return;
    }

    try {
        const cleanUrl = baseUrl.replace(/\/$/, "");
        const createUrl = `${cleanUrl}/instance/create`;

        const createPayload = {
            instanceName: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        };

        await axios.post(createUrl, createPayload, {
            headers: {
                apikey: apiKey,
                "Content-Type": "application/json"
            }
        });

        console.log(`EvolutionService: Instância '${instanceName}' criada/verificada com sucesso.`);
    } catch (error) {
        // Loga aviso se falhar (ex: já existe), mas não impede o salvamento da config
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.warn(`EvolutionService: Aviso ao criar instância '${instanceName}':`, errorMsg);
    }
};

/**
 * Busca o Base64 de uma mensagem de mídia na Evolution API.
 * Endpoint: /chat/getBase64FromMediaMessage/{instance}
 */
const fetchBase64FromMessage = async (baseUrl, apiKey, instanceName, messageData) => {
    if (!baseUrl || !apiKey || !instanceName || !messageData) {
        throw new Error("Missing params for fetchBase64FromMessage");
    }

    const cleanUrl = baseUrl.replace(/\/$/, "");
    const url = `${cleanUrl}/chat/getBase64FromMediaMessage/${instanceName}`;

    const payload = {
        message: messageData, // O objeto message completo (ex: { imageMessage: ... })
        convertToMp4: false
    };

    const response = await axios.post(url, payload, {
        headers: {
            apikey: apiKey,
            "Content-Type": "application/json"
        }
    });

    // Retorno esperado: { base64: "..." }
    return response.data?.base64;
};

module.exports = {
    ensureEvolutionInstance,
    fetchBase64FromMessage
};
