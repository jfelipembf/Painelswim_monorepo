import React, { useState, useEffect } from "react"
import {
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap"

const NewRoleModal = ({ isOpen, toggle, onSubmit, initialRole, mode = "create" }) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isInstructor, setIsInstructor] = useState(false)

  useEffect(() => {
    if (isOpen && mode === "edit" && initialRole) {
      setName(initialRole.label || "")
      setDescription(initialRole.description || "")
      setIsInstructor(!!initialRole.isInstructor)
    } else if (!isOpen) {
      setName("")
      setDescription("")
      setIsInstructor(false)
    }
  }, [isOpen, mode, initialRole])

  const handleSubmit = e => {
    e.preventDefault()
    const data = {
      label: name.trim(),
      description: description.trim() || "Cargo criado manualmente",
      isInstructor,
      permissions: initialRole?.permissions || {},
    }

    if (mode === "create") {
      data.id = name.toLowerCase().replace(/\s+/g, "-")
    } else {
      data.id = initialRole.id
    }

    onSubmit(data)
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>
        {mode === "edit" ? "Editar cargo" : "Novo cargo"}
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <FormGroup>
            <Label for="roleName">Nome do cargo</Label>
            <Input
              id="roleName"
              placeholder="Ex.: Coordenador Comercial"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="roleDescription">Descrição</Label>
            <Input
              id="roleDescription"
              type="textarea"
              rows="2"
              placeholder="Breve descrição para identificar o cargo"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </FormGroup>
          <FormGroup switch className="d-flex align-items-center gap-2">
            <Input
              type="switch"
              id="isInstructorSwitch"
              checked={isInstructor}
              onChange={e => setIsInstructor(e.target.checked)}
            />
            <Label check htmlFor="isInstructorSwitch" className="mb-0">
              Atua como Professor?
            </Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={toggle}>
            Cancelar
          </Button>
          <Button color="primary" type="submit">
            {mode === "edit" ? "Salvar mudanças" : "Criar cargo"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default NewRoleModal
