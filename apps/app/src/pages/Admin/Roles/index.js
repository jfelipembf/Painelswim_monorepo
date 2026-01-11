import React, { useEffect, useMemo, useState } from "react"
import { Button, Container } from "reactstrap"
import { connect } from "react-redux"

import PermissionsMatrix from "./Components/PermissionsMatrix"
import RoleModal from "./Components/NewRoleModal"
import { setBreadcrumbItems } from "../../../store/actions"
import { PERMISSIONS, DEFAULT_ROLES } from "./Constants"
import { ensureDefaultRoles, createRole } from "../../../services/Roles/index"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"

const RolesPage = ({ setBreadcrumbItems }) => {
  const [roles, setRoles] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("create") // create | edit
  const [roleBeingEdited, setRoleBeingEdited] = useState(null)
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const permissions = useMemo(() => PERMISSIONS, [])
  const sortedRoles = useMemo(
    () =>
      roles
        .filter(r => r && r.label)
        .slice()
        .sort((a, b) => (a.label || "").localeCompare(b.label || "")),
    [roles]
  )

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Cargos e Permissões", link: "/roles" },
    ]
    setBreadcrumbItems("Cargos e Permissões", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const load = async () => {
      try {
        await withLoading('page', async () => {
          const seeded = await ensureDefaultRoles(DEFAULT_ROLES)
          setRoles(seeded)
        })
      } catch (e) {
        console.error(e)
        toast.show({ title: "Erro ao carregar cargos", description: e?.message || String(e), color: "danger" })
      }
    }
    load()
  }, [toast])

  const toggleEditMode = () => {
    setEditMode(prev => !prev)
    setSelectedRoles(new Set())
    setRoleBeingEdited(null)
  }

  const handleTogglePermission = (roleId, permissionId) => {
    if (editMode) return
    setRoles(prev =>
      prev.map(role =>
        role.id === roleId
          ? {
            ...role,
            permissions: {
              ...role.permissions,
              [permissionId]: !role.permissions?.[permissionId],
            },
          }
          : role
      )
    )
  }

  const handleSelectRole = roleId => {
    setSelectedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (selectedRoles.size === 0) return
    setRoles(prev => prev.filter(role => !selectedRoles.has(role.id)))
    setSelectedRoles(new Set())
    setEditMode(false)
  }

  const handleOpenCreateModal = () => {
    setModalMode("create")
    setRoleBeingEdited(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = () => {
    if (selectedRoles.size !== 1) return
    const roleId = Array.from(selectedRoles)[0]
    const role = roles.find(r => r.id === roleId)
    if (!role) return
    setModalMode("edit")
    setRoleBeingEdited(role)
    setModalOpen(true)
  }

  const handleModalSubmit = async data => {
    if (!data) return

    try {
      if (modalMode === "edit" && roleBeingEdited) {
        await withLoading('submit', async () => {
          const updatedRole = {
            ...roleBeingEdited,
            label: data.label,
            description: data.description,
            isInstructor: data.isInstructor,
          }

          await createRole(updatedRole) // createRole acts as upsert

          setRoles(prev =>
            prev.map(role =>
              role.id === roleBeingEdited.id ? updatedRole : role
            )
          )

          toast.show({ title: "Sucesso", description: "Cargo atualizado com sucesso.", color: "success" })
          setModalOpen(false)
          setRoleBeingEdited(null)
          setSelectedRoles(new Set())
          setEditMode(false)
        })
        return
      }

      const newRole = {
        id: data.label.toLowerCase().replace(/\s+/g, "-"),
        label: data.label,
        description: data.description || "Cargo criado manualmente",
        isInstructor: !!data.isInstructor,
        permissions: {},
      }

      await withLoading('submit', async () => {
        const created = await createRole(newRole)
        setRoles(prev => [...prev, created])
        toast.show({ title: "Sucesso", description: "Cargo criado com sucesso.", color: "success" })
        setModalOpen(false)
      })

    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro", description: e?.message || "Erro ao salvar cargo.", color: "danger" })
    }
  }

  const matrixActions = editMode ? (
    <>
      <Button color="danger" size="sm" disabled={selectedRoles.size === 0} onClick={handleDeleteSelected}>
        Excluir selecionados
      </Button>
      <Button
        color="warning"
        size="sm"
        disabled={selectedRoles.size !== 1}
        onClick={handleOpenEditModal}
      >
        Editar selecionado
      </Button>
      <Button color="light" size="sm" onClick={toggleEditMode}>
        Concluir edição
      </Button>
      <Button color="primary" size="sm" onClick={handleOpenCreateModal}>
        Novo cargo
      </Button>
    </>
  ) : (
    <>
      <Button color="light" size="sm" onClick={toggleEditMode}>
        Editar cargos
      </Button>
      <Button color="primary" size="sm" onClick={handleOpenCreateModal}>
        Novo cargo
      </Button>
    </>
  )

  return (
    <React.Fragment>
      <Container fluid>
        {isLoading('page') && !roles.length ? (
          <PageLoader />
        ) : (
          <PermissionsMatrix
            permissions={permissions}
            roles={sortedRoles}
            editMode={editMode}
            selectedRoles={selectedRoles}
            onSelectRole={handleSelectRole}
            onTogglePermission={handleTogglePermission}
            actions={matrixActions}
            loading={isLoading('page')}
          />
        )}
      </Container>

      <RoleModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialRole={roleBeingEdited}
        mode={modalMode}
        submitting={isLoading('submit')}
      />
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(RolesPage)
