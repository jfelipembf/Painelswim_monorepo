/**
 * ENTITY PAYLOAD BUILDERS (NodeJS/CommonJS version)
 */

const asString = (val) => (val !== undefined && val !== null ? String(val) : null);

const buildAddress = (data) => {
    let source = data
    let street = ""

    if (data.address && typeof data.address === 'object') {
        source = { ...data, ...data.address }
        street = source.street || source.address || ""
    } else {
        street = data.street || data.address || ""
    }

    if (typeof street === 'object') street = ""

    return {
        street: street,
        number: source.number || "",
        complement: source.complement || "",
        neighborhood: source.neighborhood || "",
        city: source.city || "",
        state: source.state || "",
        zip: source.zip || ""
    }
}

exports.buildClientPayload = (data) => {
    const {
        firstName,
        lastName,
        name,
        email,
        phone,
        birthDate,
        gender,
        document,
        status,
        funnel
    } = data

    const fullName = name || [firstName, lastName].filter(Boolean).join(" ").trim()

    return {
        firstName: firstName || "",
        lastName: lastName || "",
        name: fullName,
        email: email || "",
        phone: phone || "",
        birthDate: birthDate || null,
        gender: gender || "",
        document: document || "",
        address: buildAddress(data),
        photo: data.photo || "",
        status: status || "lead",
        funnel: funnel || {}
    }
}

exports.buildContractPayload = (data) => {
    return {
        title: data.title || "",
        status: data.status || "active",
        duration: Number(data.duration || 0),
        durationType: data.durationType || "Meses",
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),
        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments ?? data.weeklyLimit ?? 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],
        value: Number(data.value || 0),
        maxAmountInstallments: Number(data.maxAmountInstallments || 1),
        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),
    }
}

exports.buildClientContractPayload = (data) => {
    return {
        idClient: asString(data.idClient),
        idContract: asString(data.idContract),
        idSale: asString(data.idSale),
        idSaleItem: asString(data.idSaleItem),
        contractTitle: data.contractTitle || data.title || "",
        contractCode: data.contractCode || null,
        status: data.status || "active",
        startDate: data.startDate || new Date().toISOString().split("T")[0],
        endDate: data.endDate || null,
        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments || 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],
        enrollmentStatus: data.enrollmentStatus || "pending",
        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),
        totalSuspendedDays: Number(data.totalSuspendedDays || 0),
        pendingSuspensionDays: Number(data.pendingSuspensionDays || 0),
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),
        billing: data.billing || "--",
        balanceDays: Number(data.balanceDays ?? data.daysBalance ?? 0),
        notes: data.notes || "",
    }
}

exports.buildReceivablePayload = (data) => {
    return {
        idClient: asString(data.idClient),
        idSale: asString(data.idSale),
        idContract: asString(data.idContract),
        amount: Number(data.amount || 0),
        balance: Number(data.balance !== undefined ? data.balance : data.amount || 0),
        dueDate: data.dueDate || new Date().toISOString().split("T")[0],
        paidAt: data.paidAt || null,
        status: data.status || "open",
        description: data.description || "Saldo Devedor",
        paymentType: data.paymentType || null,
        competenceDate: data.competenceDate || data.dueDate || new Date().toISOString().split("T")[0],
    }
}

exports.buildClientDebtPayload = (data) => {
    return {
        idReceivable: asString(data.idReceivable || data.id),
        idSale: asString(data.idSale),
        amount: Number(data.amount || 0),
        balance: Number(data.balance !== undefined ? data.balance : data.amount || 0),
        dueDate: data.dueDate || new Date().toISOString().split("T")[0],
        status: data.status || "open",
        description: data.description || "Dívida",
        createdAt: data.createdAt || null,
    }
}
