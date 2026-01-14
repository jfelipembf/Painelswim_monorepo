const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../../shared/context");

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
        status = "active",
        phone,
        photo,
        avatar, // Legacy support
        isInstructor,
    } = data;

    // Validação de campos obrigatórios
    if (!email || !firstName) {
        const missing = [];
        if (!email) missing.push("email");
        if (!password) missing.push("password");
        if (!firstName) missing.push("firstName");

        console.error("Campos obrigatórios ausentes:", missing, "Data recebida:", data);

        throw new functions.https.HttpsError(
            "invalid-argument",
            `Campos obrigatórios ausentes: ${missing.join(", ")}.`
        );
    }

    const displayName = `${firstName} ${lastName || ""}`.trim();

    try {
        // 1. Verificar se usuário já existe no Auth
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
            // 2. Criar usuário no Auth
            userRecord = await admin.auth().createUser({
                email,
                password,
                displayName,
                disabled: status === "inactive",
            });
            uid = userRecord.uid;
        }

        // 3. Criar documento no Firestore (Staff)
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
            role: role || null,
            status,
            photo: photo || avatar || null,
            avatar: photo || avatar || null,
            isInstructor: !!isInstructor, // Importante para diferenciar professores

            // Dados Pessoais
            gender: data.gender || null,
            birthDate: data.birthDate || null,

            // Endereço
            zip: data.zip || null,
            state: data.state || null,
            city: data.city || null,
            neighborhood: data.neighborhood || null,
            address: data.address || null,
            number: data.number || null,
            complement: data.complement || null,

            // Dados Profissionais
            roleId: data.roleId || null,
            hireDate: data.hireDate || null,
            council: data.council || null,
            employmentType: data.employmentType || null,
            salary: data.salary ? Number(data.salary) : null,
            idTenant,
            idBranch,
            createdAt: now,
            updatedAt: now,
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
        // 1. Atualizar dados no Authentication (se necessário)
        const authUpdates = {};
        if (email) authUpdates.email = email;
        if (password) authUpdates.password = password;
        if (displayName) authUpdates.displayName = displayName;
        if (status) authUpdates.disabled = status === "inactive";

        if (Object.keys(authUpdates).length > 0) {
            await admin.auth().updateUser(id, authUpdates);
        }

        // 2. Atualizar documento no Firestore
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
            role: role || null,
            status: status || "active",
            photo: photo !== undefined ? photo : (avatar !== undefined ? avatar : undefined),
            avatar: photo !== undefined ? photo : (avatar !== undefined ? avatar : undefined),
            isInstructor: isInstructor !== undefined ? !!isInstructor : undefined,
            updatedAt: now,
        };

        // Remove chaves undefined
        Object.keys(firestorePayload).forEach(key => firestorePayload[key] === undefined && delete firestorePayload[key]);

        await staffRef.set(firestorePayload, { merge: true });

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
    updateStaffUserLogic
};
