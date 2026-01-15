const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../../shared/context");
const { sendWhatsAppMessageInternal } = require("../../notifications/whatsapp");
const { saveAuditLog } = require("../../shared/audit");

/**
 * Lógica para criar um usuário da equipe (Staff)
 */
async function createStaffUserLogic(data, context) {
    // Validação de contexto (Auth, Tenant, Branch)
    const { idTenant, idBranch } = requireAuthContext(data, context);

    const {
        email,
        password = "123456",
        firstName,
        lastName,
        role, // Nome do cargo (role)
        roleId, // ID do cargo (roleId)
        status = "active",
        phone,
        photo,
        avatar, // Legacy support
        isInstructor,
    } = data;

    // ... (validations omitted for brevity in targetContent, but I'll include them in ReplacementContent)

    // Validação de campos obrigatórios
    if (!email || !firstName) {
        const missing = [];
        if (!email) missing.push("email");
        if (!firstName) missing.push("firstName");

        console.error("Campos obrigatórios ausentes:", missing, "Data recebida:", data);

        throw new functions.https.HttpsError(
            "invalid-argument",
            `Campos obrigatórios ausentes: ${missing.join(", ")}.`
        );
    }

    const displayName = `${firstName} ${lastName || ""}`.trim();

    try {
        // 1. Sincronizar dados do Cargo (se roleId existir)
        let finalRole = role || null;
        let finalIsInstructor = !!isInstructor;

        if (roleId) {
            const roleRef = admin.firestore()
                .collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("roles").doc(roleId);
            const roleSnap = await roleRef.get();
            if (roleSnap.exists) {
                const rData = roleSnap.data();
                finalRole = rData.label || finalRole;
                finalIsInstructor = rData.isInstructor !== undefined ? !!rData.isInstructor : finalIsInstructor;
            }
        }

        // 2. Verificar se usuário já existe no Auth
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code !== "auth/user-not-found") {
                throw error;
            }
        }

        let uid;

        if (userRecord) {
            // Usuário já existe, reaproveitar UID
            uid = userRecord.uid;
        } else {
            // 3. Criar usuário no Auth
            userRecord = await admin.auth().createUser({
                email,
                password,
                displayName,
                disabled: status === "inactive",
            });
            uid = userRecord.uid;
        }

        // 4. Criar documento no Firestore (Staff)
        const staffRef = admin
            .firestore()
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("staff")
            .doc(uid);

        const now = FieldValue.serverTimestamp();

        await staffRef.set({
            id: uid,
            firstName,
            lastName,
            displayName,
            email,
            phone: phone || null,
            role: finalRole,
            roleId: roleId || null,
            status,
            photo: photo || avatar || null,
            avatar: photo || avatar || null,
            isInstructor: finalIsInstructor,
            isFirstAccess: true, // Força a troca de senha no primeiro login

            // Dados Pessoais
            gender: data.gender || null,
            birthDate: data.birthDate || null,

            // Endereço (Normalizado apenas no mapa 'address')
            address: data.address || null,

            // Dados Profissionais
            hireDate: data.hireDate || null,
            council: data.council || null,
            employmentType: data.employmentType || null,
            salary: data.salary ? Number(data.salary) : null,
            idTenant,
            idBranch,
            createdAt: now,
            updatedAt: now,
        });

        // Tentar enviar mensagem de boas-vindas
        // await sendWelcomeMessage(idTenant, idBranch, {
        //     id: uid,
        //     firstName,
        //     email,
        //     phone
        // });

        // Registrar Log de Auditoria
        await saveAuditLog({
            idTenant,
            idBranch,
            uid: context.auth.uid,
            action: "STAFF_CREATE",
            targetId: uid,
            description: `Criou o colaborador ${displayName} (${finalRole})`,
            metadata: { email, role: finalRole, roleId }
        });

        return {
            success: true,
            uid,
            message: "Colaborador criado com sucesso.",
        };
    } catch (error) {
        console.error("Erro ao criar colaborador:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Erro interno ao criar colaborador.", error);
    }
}

// Helper para enviar mensagem de boas-vindas (Executado após criação)
async function sendWelcomeMessage(idTenant, idBranch, staffData) {

    try {
        if (!staffData.phone) {

            return;
        }

        // Buscar Tenant e Branch para pegar Slugs

        const tenantSnap = await admin.firestore().collection("tenants").doc(idTenant).get();
        const branchSnap = await admin.firestore().collection("tenants").doc(idTenant).collection("branches").doc(idBranch).get();

        if (!tenantSnap.exists || !branchSnap.exists) {
            console.error("[WelcomeMessage] Erro: Tenant ou Branch não encontrados.");
            return;
        }

        const tenantData = tenantSnap.data();
        const branchData = branchSnap.data();

        const tenantSlug = tenantData.slug || idTenant;
        const branchSlug = branchData.slug || idBranch;

        const url = `https://app.painelswim.com/${tenantSlug}/${branchSlug}/`;


        const message = `Olá ${staffData.firstName}, seja bem vindo, ao painel swim para seu acesso use a URL abaixo. criamos uma senha provisoria para voce

email de acesso: ${staffData.email}
senha provisoria: 123456

${url}

altera a sua senha por seguranca apos o primeiro acesso e tenha um otimo dia de trabalho`;


        await sendWhatsAppMessageInternal(idTenant, idBranch, staffData.phone, message);


    } catch (err) {
        console.error("[WelcomeMessage] Erro CATASTRÓFICO:", err);
    }
}


/**
 * Lógica para atualizar um usuário da equipe (Staff)
 */
async function updateStaffUserLogic(data, context) {
    // Validação de contexto (Auth, Tenant, Branch)
    const { idTenant, idBranch } = requireAuthContext(data, context);

    const {
        id, // UID do usuário a ser atualizado
        email,
        password,
        firstName,
        lastName,
        role,
        roleId,
        status,
        phone,
        photo,
        avatar,
        isInstructor,
    } = data;

    if (!id) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "O ID do colaborador é obrigatório para atualização."
        );
    }

    const displayName = `${firstName} ${lastName || ""}`.trim();
    const now = FieldValue.serverTimestamp();

    try {
        // 1. Sincronizar dados do Cargo (se roleId existir)
        let finalRole = role;
        let finalIsInstructor = isInstructor;

        if (roleId) {
            const roleRef = admin.firestore()
                .collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("roles").doc(roleId);
            const roleSnap = await roleRef.get();
            if (roleSnap.exists) {
                const rData = roleSnap.data();
                finalRole = rData.label || finalRole;
                finalIsInstructor = rData.isInstructor !== undefined ? !!rData.isInstructor : finalIsInstructor;
            }
        }

        // 2. Atualizar dados no Authentication (se necessário)
        const authUpdates = {};
        if (email) authUpdates.email = email;
        if (password && password.length >= 6) authUpdates.password = password;
        if (displayName) authUpdates.displayName = displayName;
        if (status) authUpdates.disabled = status === "inactive";

        if (Object.keys(authUpdates).length > 0) {
            try {
                await admin.auth().updateUser(id, authUpdates);
            } catch (authError) {
                console.error("Erro ao atualizar Auth:", authError);
                if (authError.code === 'auth/user-not-found') {
                    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado no sistema de autenticação (Auth).');
                }
                if (authError.code === 'auth/email-already-exists') {
                    throw new functions.https.HttpsError('already-exists', 'O email fornecido já está em uso por outro usuário.');
                }
                if (authError.code === 'auth/invalid-password') {
                    throw new functions.https.HttpsError('invalid-argument', 'A senha deve ter pelo menos 6 caracteres.');
                }
                throw authError;
            }
        }

        // 3. Atualizar documento no Firestore
        const staffRef = admin
            .firestore()
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("staff")
            .doc(id);

        // Preparar payload para Firestore (remove undefined)
        const firestorePayload = {
            firstName,
            lastName,
            displayName,
            email,
            phone: phone || null,
            role: finalRole !== undefined ? finalRole : undefined,
            roleId: roleId || undefined,
            status: status || "active",
            photo: photo !== undefined ? photo : (avatar !== undefined ? avatar : undefined),
            avatar: photo !== undefined ? photo : (avatar !== undefined ? avatar : undefined),
            isInstructor: finalIsInstructor !== undefined ? !!finalIsInstructor : undefined,
            address: data.address || undefined,
            updatedAt: now,
        };

        // Campos para remover (legacy address)
        const fieldsToRemove = {
            zip: FieldValue.delete(),
            state: FieldValue.delete(),
            city: FieldValue.delete(),
            neighborhood: FieldValue.delete(),
            number: FieldValue.delete(),
            complement: FieldValue.delete()
        };

        // Remove chaves undefined do payload
        Object.keys(firestorePayload).forEach(key => firestorePayload[key] === undefined && delete firestorePayload[key]);

        // Merge payload e remoção de campos antigos
        await staffRef.set({ ...firestorePayload, ...fieldsToRemove }, { merge: true });

        // Registrar Log de Auditoria
        await saveAuditLog({
            idTenant,
            idBranch,
            uid: context.auth.uid,
            action: "STAFF_UPDATE",
            targetId: id,
            description: `Atualizou os dados do colaborador ${displayName}`,
            metadata: {
                updates: Object.keys(firestorePayload),
                email
            }
        });

        return {
            success: true,
            message: "Colaborador atualizado com sucesso.",
        };
    } catch (error) {
        console.error("Erro ao atualizar colaborador:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Erro interno ao atualizar colaborador.", error);
    }
}

module.exports = {
    createStaffUserLogic,
    updateStaffUserLogic,
    sendWelcomeMessage
};
