import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Alert
} from 'reactstrap'
import { useTenantManagement } from '../../hooks/clients/useTenantManagement'
import AvatarUploadCard from '../../components/Common/AvatarUploadCard'
import { fetchNormalizedAddress } from '../Users/utils/address'

const TenantProfile = () => {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [branches, setBranches] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    cnpj: '',
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    numero: '',
  })

  const [branchLogoFile, setBranchLogoFile] = useState(null)
  const [branchLogoPreview, setBranchLogoPreview] = useState('')

  useEffect(() => {
    return () => {
      if (branchLogoPreview) URL.revokeObjectURL(branchLogoPreview)
    }
  }, [branchLogoPreview])

  const {
    loading,
    error,
    getTenant,
    getTenantBranches,
    createBranch,
    toggleBranchStatus,
    updateBillingStatus,
  } = useTenantManagement()

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      // Carregar dados do tenant
      const tenantData = await getTenant(tenantId)
      setTenant(tenantData)
      
      // Carregar branches
      const branchesData = await getTenantBranches(tenantId)
      setBranches(branchesData)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const handleCreateBranch = async () => {
    try {
      const branchId = await createBranch(tenantId, {
        name: newBranchData.name,
        cnpj: newBranchData.cnpj,
        logoFile: branchLogoFile,
        address: {
          cep: newBranchData.cep,
          estado: newBranchData.estado,
          cidade: newBranchData.cidade,
          bairro: newBranchData.bairro,
          numero: newBranchData.numero,
        },
      })
      setModalOpen(false)
      setNewBranchData({
        name: '',
        cnpj: '',
        cep: '',
        estado: '',
        cidade: '',
        bairro: '',
        numero: '',
      })
      setBranchLogoFile(null)
      if (branchLogoPreview) URL.revokeObjectURL(branchLogoPreview)
      setBranchLogoPreview('')
      // Redirecionar para o perfil da branch criada
      navigate(`/branches/${branchId}`)
    } catch (err) {
      console.error('Error creating branch:', err)
    }
  }

  const handleBranchLogoSelect = (file) => {
    setBranchLogoFile(file || null)
    if (branchLogoPreview) URL.revokeObjectURL(branchLogoPreview)
    if (file) {
      setBranchLogoPreview(URL.createObjectURL(file))
    } else {
      setBranchLogoPreview('')
    }
  }

  const handleBranchCepBlur = async () => {
    try {
      const { normalizedCep, address } = await fetchNormalizedAddress(newBranchData.cep)
      setNewBranchData((prev) => ({ ...prev, cep: normalizedCep }))
      if (!address) return
      setNewBranchData((prev) => ({
        ...prev,
        estado: address.estado || prev.estado,
        cidade: address.cidade || prev.cidade,
        bairro: address.bairro || prev.bairro,
      }))
    } catch (err) {
      console.error('Error fetching CEP:', err)
    }
  }

  const handleToggleBranch = async (branchId, currentStatus) => {
    try {
      await toggleBranchStatus(tenantId, branchId, currentStatus !== 'active')
      loadData()
    } catch (err) {
      console.error('Error toggling branch:', err)
    }
  }

  const handleUpdateBilling = async (branchId, status) => {
    try {
      await updateBillingStatus(tenantId, branchId, status)
      loadData()
    } catch (err) {
      console.error('Error updating billing:', err)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge color="success" className="me-2">Ativo</Badge>
    }
    if (status === 'trial') {
      return <Badge color="warning" className="me-2">Trial</Badge>
    }
    if (status === 'suspended') {
      return <Badge color="danger" className="me-2">Suspenso</Badge>
    }
    return <Badge color="danger" className="me-2">Bloqueado</Badge>
  }

  const getBillingBadge = (billingStatus) => {
    const badges = {
      active: <Badge color="success">Em dia</Badge>,
      past_due: <Badge color="warning">Atrasado</Badge>,
      canceled: <Badge color="danger">Cancelado</Badge>,
    }
    return badges[billingStatus] || <Badge color="secondary">-</Badge>
  }

  return (
    <>
      <Row>
        <Col lg={12}>
          {error && (
            <Alert color="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Dados da Organização */}
          {tenant && (
            <Card className="mb-4">
              <CardBody>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={
                      tenant.logoUrl ||
                      `https://ui-avatars.com/api/?background=556ee6&color=fff&name=${encodeURIComponent(
                        tenant.name || 'Academia'
                      )}`
                    }
                    alt={tenant.name}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                  <div className="flex-grow-1">
                    <h4 className="mb-1">{tenant.name}</h4>
                    <div className="d-flex align-items-center gap-2">
                      <code className="text-muted small">{tenant.slug}</code>
                      <span className="text-muted">•</span>
                      {getStatusBadge(tenant.status)}
                    </div>
                  </div>
                  <Button color="primary" onClick={() => setModalOpen(true)}>
                    + Nova Unidade
                  </Button>
                </div>
                
                <Row className="g-3">
                  {tenant.cnpj && (
                    <Col md={4}>
                      <small className="text-muted d-block fw-semibold">CNPJ</small>
                      <span className="small">{tenant.cnpj}</span>
                    </Col>
                  )}
                  {tenant.address?.cidade && (
                    <Col md={4}>
                      <small className="text-muted d-block fw-semibold">Localização</small>
                      <span className="small">
                        {tenant.address.cidade}
                        {tenant.address.estado && `, ${tenant.address.estado}`}
                      </span>
                    </Col>
                  )}
                  <Col md={4}>
                    <small className="text-muted d-block fw-semibold">Criado em</small>
                    <span className="small">
                      {tenant.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '-'}
                    </span>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          )}

          {/* Header das Unidades */}
          <div className="mb-3">
            <h5 className="mb-1">Unidades</h5>
            <p className="text-muted small mb-0">Gerencie as unidades desta organização</p>
          </div>
        </Col>
      </Row>

      {/* Branches Cards */}
      <Row>
          {branches.length === 0 && !loading ? (
            <Col lg={12}>
              <Card>
                <CardBody className="text-center py-5">
                  <i className="mdi mdi-store-outline display-4 text-muted mb-3"></i>
                  <h5>Nenhuma unidade cadastrada</h5>
                  <p className="text-muted">Crie a primeira unidade para começar.</p>
                  <Button color="primary" onClick={() => setModalOpen(true)}>
                    Criar Primeira Unidade
                  </Button>
                </CardBody>
              </Card>
            </Col>
          ) : (
            branches.map((branch) => (
              <Col lg={4} md={6} key={branch.id}>
                <Card className="branch-card">
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <CardTitle tag="h5" className="mb-2">
                          {branch.name}
                        </CardTitle>
                        <div className="mb-2">
                          {getStatusBadge(branch.status)}
                          {getBillingBadge(branch.billingStatus)}
                        </div>
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-light dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="mdi mdi-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/branches/${branch.id}`)}
                            >
                              <i className="mdi mdi-eye me-2"></i>
                              Ver Detalhes
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleToggleBranch(branch.id, branch.status)}
                            >
                              <i className={`mdi ${branch.status === 'active' ? 'mdi-lock' : 'mdi-lock-open'} me-2`}></i>
                              {branch.status === 'active' ? 'Bloquear' : 'Liberar'}
                            </button>
                          </li>
                          {branch.billingStatus !== 'active' && (
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleUpdateBilling(branch.id, 'active')}
                              >
                                <i className="mdi mdi-check-circle me-2"></i>
                                Regularizar Pagamento
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="branch-info">
                      <div className="info-item mb-2">
                        <small className="text-muted">Timezone:</small>
                        <div>{branch.timezone || 'America/Sao_Paulo'}</div>
                      </div>
                      
                      {branch.address?.city && (
                        <div className="info-item mb-2">
                          <small className="text-muted">Localização:</small>
                          <div>
                            {branch.address.city}
                            {branch.address.state && `, ${branch.address.state}`}
                          </div>
                        </div>
                      )}

                      <div className="info-item">
                        <small className="text-muted">Criado em:</small>
                        <div>
                          {branch.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-top">
                      <Button
                        color="primary"
                        size="sm"
                        block
                        onClick={() => navigate(`/branches/${branch.id}?tenantId=${tenantId}`)}
                      >
                        Acessar Unidade
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))
          )}
      </Row>

      {/* Modal Criar Branch */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Criar Nova Unidade
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="branchName">Nome da Unidade</Label>
              <Input
                type="text"
                id="branchName"
                value={newBranchData.name}
                onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                placeholder="Ex: Unidade Centro"
              />
            </FormGroup>

            <FormGroup>
              <Label className="d-block">Logo</Label>
              <AvatarUploadCard
                imageUrl={branchLogoPreview || undefined}
                defaultImage={null}
                loading={loading}
                onSelectFile={handleBranchLogoSelect}
                accept="image/*"
                size="lg"
                variant="rounded"
                mt={0}
              />
            </FormGroup>

            <FormGroup>
              <Label for="branchCnpj">CNPJ (opcional)</Label>
              <Input
                type="text"
                id="branchCnpj"
                value={newBranchData.cnpj}
                onChange={(e) => setNewBranchData({ ...newBranchData, cnpj: e.target.value })}
              />
            </FormGroup>

            <Row className="g-3">
              <Col md={4}>
                <FormGroup>
                  <Label for="branchCep">CEP</Label>
                  <Input
                    type="text"
                    id="branchCep"
                    value={newBranchData.cep}
                    onChange={(e) => setNewBranchData({ ...newBranchData, cep: e.target.value })}
                    onBlur={handleBranchCepBlur}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="branchEstado">Estado</Label>
                  <Input
                    type="text"
                    id="branchEstado"
                    value={newBranchData.estado}
                    onChange={(e) => setNewBranchData({ ...newBranchData, estado: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="branchCidade">Cidade</Label>
                  <Input
                    type="text"
                    id="branchCidade"
                    value={newBranchData.cidade}
                    onChange={(e) => setNewBranchData({ ...newBranchData, cidade: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="branchBairro">Bairro</Label>
                  <Input
                    type="text"
                    id="branchBairro"
                    value={newBranchData.bairro}
                    onChange={(e) => setNewBranchData({ ...newBranchData, bairro: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="branchNumero">Número</Label>
                  <Input
                    type="text"
                    id="branchNumero"
                    value={newBranchData.numero}
                    onChange={(e) => setNewBranchData({ ...newBranchData, numero: e.target.value })}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleCreateBranch} disabled={loading}>
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </ModalFooter>
      </Modal>

      <style jsx>{`
        .branch-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .branch-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .info-item small {
          display: block;
          font-weight: 600;
        }
      `}</style>
    </>
  )
}

export default TenantProfile
