import React, { useEffect, useMemo, useState } from "react"
import { Button, Col, Row, FormGroup, Label, Input } from "reactstrap"
import { connect } from "react-redux"

import BasicTable from "../../../components/Common/BasicTable"
import { setBreadcrumbItems } from "../../../store/actions"
import BasicModalForm from "../../../components/Common/BasicModalForm"
import { useNavigate, useParams } from "react-router-dom"
import { createStaff, listStaff, useStaffPhotoUpload } from "../../../services/Staff/index"
import { listRoles } from "../../../services/Roles/index"
import { buildStaffPayload } from "../../../services/payloads"
import { useToast } from "components/Common/ToastProvider"
import { PLACEHOLDER_AVATAR as placeholderAvatar } from "../../Clients/Constants/defaults"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"

const CollaboratorsList = ({ setBreadcrumbItems }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const navigate = useNavigate()
  const { tenant, branch } = useParams()
  const toast = useToast()
  const { uploadPhoto, uploading } = useStaffPhotoUpload()
  const { isLoading, withLoading } = useLoading()

  const profilePath = useMemo(() => {
    if (tenant && branch) {
      return `/${tenant}/${branch}/collaborators/profile`
    }
    return "/collaborators/profile"
  }, [tenant, branch])



  const computeAge = birthDate => {
    if (!birthDate) return ""
    const dt = new Date(birthDate)
    if (Number.isNaN(dt.getTime())) return ""
    const diff = Date.now() - dt.getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  const columns = useMemo(
    () => [
      {
        key: "avatar",
        label: "Colaborador",
        render: item => (
          <div className="d-flex align-items-center gap-3">
            <img
              src={item.photo || placeholderAvatar}
              alt={item.name || `${item.firstName || ""} ${item.lastName || ""}`}
              className="rounded-circle"
              width="48"
              height="48"
            />
            <div>
              <div className="fw-semibold">{item.name || `${item.firstName || ""} ${item.lastName || ""}`}</div>
              {item.birthDate ? (
                <div className="text-muted fs-12">{computeAge(item.birthDate)} anos</div>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: "Cargo",
      },
      {
        key: "status",
        label: "Status",
        render: item => (
          <span
            className={`badge bg-${item.status === "active"
              ? "success"
              : item.status === "pending"
                ? "warning"
                : "secondary"
              }`}
          >
            {item.status}
          </span>
        ),
      },
      {
        key: "phone",
        label: "Telefone",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "actions",
        label: "Ações",
        render: item => (
          <Button color="link" className="p-0" onClick={() => navigate(`${profilePath}?id=${item.id}`)}>
            Ver
          </Button>
        ),
      },
    ],
    [navigate, profilePath, placeholderAvatar]
  )

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Colaboradores", link: "/collaborators/list" },
    ]
    setBreadcrumbItems("Colaboradores", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const load = async () => {
      try {
        await withLoading('page', async () => {
          const data = await listStaff()
          setStaff(data)
        })
      } catch (e) {
        console.error(e)
        toast.show({ title: "Erro ao carregar colaboradores", description: e?.message || String(e), color: "danger" })
      }
    }
    load()
  }, [toast])

  useEffect(() => {
    const loadRoles = async () => {
      try {
        await withLoading('roles', async () => {
          const data = await listRoles()
          setRoles(data)
        })
      } catch (e) {
        console.error(e)
        toast.show({ title: "Erro ao carregar cargos", description: e?.message || String(e), color: "danger" })
      }
    }
    loadRoles()
  }, [toast])

  const renderExtraFields = ({ updateField, formData }) => (
    <>
      <h6 className="fw-semibold mb-3">Informações profissionais</h6>
      <Row className="g-3">
        <Col md="6">
          <FormGroup>
            <Label>Cargo</Label>
            <Input
              type="select"
              value={formData.roleId || ""}
              onChange={e => {
                updateField("roleId", e.target.value)
                const selected = roles.find(r => r.id === e.target.value)
                updateField("roleTitle", selected?.label || "")
              }}
            >
              <option value="">{isLoading('roles') ? "Carregando..." : "Selecione um cargo"}</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Data de contratação</Label>
            <Input type="date" onChange={e => updateField("hireDate", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Conselho de classe</Label>
            <Input onChange={e => updateField("council", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Regime</Label>
            <Input type="select" onChange={e => updateField("employmentType", e.target.value)}>
              <option value="">Selecione</option>
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
            </Input>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Salário base</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              onChange={e => updateField("salary", e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>
    </>
  )

  const handleModalSubmit = async data => {
    try {
      await withLoading('submit', async () => {
        let photo = ""
        if (data.avatarFile) {
          photo = await uploadPhoto(data.avatarFile)
        }

        const selectedRole = roles.find(r => r.id === data.roleId)

        // Strict consistency using buildStaffPayload
        const rawPayload = {
          ...data,
          role: data.roleTitle || selectedRole?.label || "",
          isInstructor: !!selectedRole?.isInstructor,
          photo: photo
        }

        const payload = buildStaffPayload(rawPayload)
        const response = await createStaff(payload)

        const newStaff = {
          ...payload,
          id: response.uid,
        }

        setStaff(prev => [newStaff, ...prev])
        setModalOpen(false)
        toast.show({ title: "Colaborador criado", description: "Registro salvo com sucesso.", color: "success" })
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
    }
  }

  return (
    <Row>
      <Col>
        {isLoading('page') && !staff.length ? (
          <PageLoader />
        ) : (
          <>
            <BasicTable
              columns={columns}
              data={staff}
              searchKeys={["name", "email", "phone", "role", "status"]}
              searchPlaceholder="Buscar colaboradores..."
              onNewClick={() => setModalOpen(true)}
              loading={isLoading('page')}
            />
            <BasicModalForm
              isOpen={modalOpen}
              toggle={() => setModalOpen(false)}
              title="Novo colaborador"
              onSubmit={handleModalSubmit}
              submitting={isLoading('submit') || uploading}
              renderExtra={renderExtraFields}
            />
          </>
        )}
      </Col>
    </Row>
  )
}

export default connect(null, { setBreadcrumbItems })(CollaboratorsList)
