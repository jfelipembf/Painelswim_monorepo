import React, { useState, useEffect } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from "reactstrap"
import Select from "react-select"
import { listStaff } from "../../../services/Staff/staff.service"
import { createTask } from "../../../services/Tasks/tasks.service"
import { getAuthUser } from "../../../helpers/permission_helper"
import { useToast } from "../../../components/Common/ToastProvider"

const TaskModal = ({ isOpen, toggle, onTaskCreated }) => {
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState(new Date().toLocaleDateString('en-CA'))
    const [selectedStaffs, setSelectedStaffs] = useState([])
    const [staffOptions, setStaffOptions] = useState([])
    const [isSaving, setIsSaving] = useState(false)
    const toast = useToast()

    useEffect(() => {
        if (isOpen) {
            loadStaff()
        }
    }, [isOpen])

    const loadStaff = async () => {
        try {
            const staffs = await listStaff()
            const options = staffs.map(s => ({
                value: s.id,
                label: s.name || s.fullName || s.email
            }))
            setStaffOptions(options)

            // Pré-selecionar o usuário logado por padrão
            const user = getAuthUser()
            if (user?.uid) {
                const self = options.find(o => o.value === user.uid)
                if (self && selectedStaffs.length === 0) {
                    setSelectedStaffs([self])
                }
            }
        } catch (error) {
            console.error("Erro ao carregar staffs", error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!description) return toast.show({ title: "Campo obrigatório", description: "Informe a descrição da tarefa", color: "warning" })

        setIsSaving(true)
        try {
            const user = getAuthUser()
            await createTask({
                description,
                dueDate,
                assignedStaffIds: selectedStaffs.map(s => s.value),
                createdBy: user?.uid
            })

            toast.show({ title: "Sucesso", description: "Tarefa criada com sucesso", color: "success" })
            setDescription("")
            setSelectedStaffs([])
            onTaskCreated()
            toggle()
        } catch (error) {
            console.error("Erro ao criar tarefa", error)
            toast.show({ title: "Erro", description: "Falha ao criar tarefa", color: "danger" })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Criar Nova Tarefa</ModalHeader>
            <Form onSubmit={handleSubmit}>
                <ModalBody>
                    <FormGroup>
                        <Label>Descrição da Tarefa</Label>
                        <Input
                            type="textarea"
                            rows="3"
                            placeholder="Ex: Ligar para Lucas Guimarães para confirmar experimental..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Data de Entrega</Label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Destinar para</Label>
                        <Select
                            isMulti
                            options={staffOptions}
                            value={selectedStaffs}
                            onChange={setSelectedStaffs}
                            placeholder="Selecione um ou mais colaboradores..."
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggle} disabled={isSaving}>Cancelar</Button>
                    <Button color="primary" type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Criar Tarefa"}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default TaskModal
