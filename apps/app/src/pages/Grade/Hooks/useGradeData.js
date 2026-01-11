import { useState, useEffect, useRef } from "react"
import { listSessions, listClasses } from "../../../services/Classes"
import { listActivities } from "../../../services/Activity"
import { listAreas } from "../../../services/Areas/index"
import { listStaff } from "../../../services/Staff/staff.service"
import { useLoading } from "../../../hooks/useLoading"

export const useGradeData = (referenceDate) => {
    const [sessions, setSessions] = useState([])
    const [activities, setActivities] = useState([])
    const [areas, setAreas] = useState([])
    const [staff, setStaff] = useState([])
    const { isLoading, withLoading } = useLoading()
    const firstLoadRef = useRef(true)

    useEffect(() => {
        const load = async () => {
            try {
                const key = firstLoadRef.current ? "page" : "refresh"
                await withLoading(key, async () => {
                    // listClasses is called but not used in Grade previously, verify if needed.
                    // Keeping it for consistency if it was there, or removing if unused.
                    // Original code: const [sess, acts, ars, stf] = await Promise.all([listSessions(), listActivities(), listAreas(), listStaff(), listClasses()])
                    // It seems listClasses result was ignored.
                    const [sess, acts, ars, stf] = await Promise.all([
                        listSessions(),
                        listActivities(),
                        listAreas(),
                        listStaff(),
                        listClasses(),
                    ])

                    const rawSessions = Array.isArray(sess) ? sess : []

                    setSessions(rawSessions.filter(Boolean))
                    setActivities(acts || [])
                    setAreas(ars || [])
                    setStaff(stf || [])
                })
            } catch (e) {
                console.error("Erro ao carregar grade", e)
            } finally {
                firstLoadRef.current = false
            }
        }
        load()
    }, [referenceDate, withLoading])

    return {
        sessions,
        setSessions,
        activities,
        areas,
        staff,
        loading: isLoading("page") || isLoading("refresh"),
    }
}
