import { useState, useEffect, useMemo, useRef } from "react"
import { useToast } from "components/Common/ToastProvider"
import { useLoading } from "../../../../hooks/useLoading"
import {
  createActivityWithSchedule,
  useActivityPhotoUpload,
  updateActivity,
} from "../../../../services/Activity"
import { normalizeStatusPt } from "../Utils"
import { buildActivityPayload } from "services/payloads"
import { INITIAL_ACTIVITY_FORM } from "../Constants"
import { useActivitiesData } from "./useActivitiesData"

export const useActivitiesPage = ({ setBreadcrumbItems }) => {
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  // Data Hook handles fetching
  const { activities, setActivities } = useActivitiesData({ withLoading, toast })

  const [selectedId, setSelectedId] = useState(null)
  const selected = useMemo(() => activities.find(a => a.id === selectedId), [activities, selectedId])

  const [formValue, setFormValue] = useState(INITIAL_ACTIVITY_FORM)

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState("")

  const { uploadPhoto, uploading: uploadingPhoto } = useActivityPhotoUpload()

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Atividades", link: "/admin/activity" },
    ]
    setBreadcrumbItems("Atividades", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    if (selected) {
      const next = { ...selected, status: normalizeStatusPt(selected.status) }
      setFormValue(next)
      setFormValue(next)
      setPhotoFile(null)
      setPhotoPreview(next.photo || "")
    } else {
      setFormValue(INITIAL_ACTIVITY_FORM)
      setPhotoFile(null)
      setPhotoPreview("")
    }
  }, [selected])

  const handleSave = async () => {
    try {
      await withLoading("save", async () => {
        if (!formValue.name) {
          toast.show({ title: "Informe o nome da atividade", color: "warning" })
          return
        }

        // Strict photo (no fallback)
        let photo = formValue.photo || ""
        if (photoFile instanceof File) {
          try {
            photo = await uploadPhoto(photoFile)
          } catch (err) {
            console.error(err)
            toast.show({ title: "Erro ao enviar foto", description: err?.message || String(err), color: "danger" })
            return
          }
        }

        const rawData = {
          ...formValue,
          photo: photo,
          status: normalizeStatusPt(formValue.status)
        }

        // Strict payload builder
        const payload = buildActivityPayload(rawData)

        if (formValue.id === "new") {
          // Add schedule manually since builder doesn't handle nested schedule array logic yet 
          // (or we pass it through if builder allows extra props? Builder ignores extra props)
          // Actually createActivityWithSchedule takes a complex object.
          // buildActivityPayload returns the 'Activity' part. 
          // We need to merge schedule back OR update builder. 
          // For now, let's pass the schedule property alongside the payload since the service expects it.

          const fullPayload = {
            ...payload,
            schedule: Array.isArray(formValue.schedule)
              ? formValue.schedule.map(s => ({
                weekday: s.weekday,
                startTime: s.startTime || formValue.startTime || "",
                endTime: s.endTime || formValue.endTime || "",
                capacity: s.capacity || formValue.capacityDefault || 0,
                idArea: s.idArea || formValue.idArea || "",
                area: s.area || formValue.area || "",
                idStaff: s.idStaff || formValue.idStaff || "",
                instructor: s.instructor || formValue.instructor || "",
              }))
              : [],
          }

          const created = await createActivityWithSchedule(fullPayload)
          const createdMapped = { ...created, status: normalizeStatusPt(created.status) }
          setActivities(prev => [...prev, createdMapped])
          setSelectedId(created.id)
          setFormValue(createdMapped)
          setPhotoFile(null)
          setPhotoPreview("")
          toast.show({ title: "Atividade criada", description: created.name, color: "success" })
        } else {
          // Update
          const updated = await updateActivity(formValue.id, payload)
          const updatedMapped = { ...updated, status: normalizeStatusPt(updated.status) }
          setActivities(prev => prev.map(item => (item.id === formValue.id ? { ...item, ...updatedMapped } : item)))
          setFormValue(prev => ({ ...prev, ...updatedMapped }))
          setPhotoFile(null)
          setPhotoPreview(updatedMapped.photo || "")
          toast.show({ title: "Atividade atualizada", description: formValue.name, color: "success" })
        }
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
    }
  }

  const sideItems = useMemo(() => activities.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.description,
    meta: normalizeStatusPt(item.status),
    draggable: false,
    helper: `Cor: ${item.color}`,
  })), [activities])

  const handleSelect = async (id) => {
    // If clicking same ID, do nothing (optional, but good UX)
    if (id === selectedId) return

    await withLoading("selection", async () => {
      // Artificial delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      setSelectedId(id)
    })
  }

  return {
    activities,
    selectedId,
    setSelectedId,
    handleSelect, // New export
    formValue,
    setFormValue,
    photoFile,
    setPhotoFile,
    photoPreview,
    isLoading,
    uploadingPhoto,
    handleSave,
    sideItems,
    setActivities
  }
}
