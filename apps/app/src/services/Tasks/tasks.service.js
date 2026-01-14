import { addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore"
import { tasksCol, taskDoc, getContext, getDb } from "./tasks.repository"

/**
 * Cria uma nova tarefa.
 */
export const createTask = async (taskData) => {
    const db = getDb()
    const ctx = getContext()
    const ref = tasksCol(db, ctx)

    const payload = {
        description: taskData.description,
        dueDate: taskData.dueDate,
        assignedStaffIds: taskData.assignedStaffIds || [],
        createdBy: taskData.createdBy,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(ref, payload)
    return { id: docRef.id, ...payload }
}

/**
 * Lista tarefas pendentes de um staff específico.
 */
export const getStaffTasks = async (uid) => {
    const db = getDb()
    const ctx = getContext()
    const ref = tasksCol(db, ctx)

    // Buscamos tarefas onde o staff está na lista de designados
    // e o status é pendente.
    const q = query(
        ref,
        where("assignedStaffIds", "array-contains", uid),
        orderBy("dueDate", "asc")
    )

    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Marca uma tarefa como concluída com auditoria.
 */
export const completeTask = async (taskId, uid) => {
    const db = getDb()
    const ctx = getContext()
    const docRef = taskDoc(db, ctx, taskId)

    await updateDoc(docRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: uid,
        updatedAt: serverTimestamp()
    })

    return { id: taskId, status: 'completed' }
}
