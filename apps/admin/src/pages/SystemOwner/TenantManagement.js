import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, Button, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap'
import { useTenantManagement } from '../../hooks/clients/useTenantManagement'

const TenantManagement = () => {
  const [tenants, setTenants] = useState([])
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [branches, setBranches] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [branchModalOpen, setBranchModalOpen] = useState(false)
  const [newTenantData, setNewTenantData] = useState({ name: '', slug: '' })
  const [newBranchData, setNewBranchData] = useState({ name: '' })

  const {
    loading,
    error,
    listAllTenants,
    getTenantBranches,
    toggleTenantStatus,
    toggleBranchStatus,
    updateBillingStatus,
    createTenant,
    createBranch,
  } = useTenantManagement()

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const data = await listAllTenants()
      setTenants(data)
    } catch (err) {
      console.error('Error loading tenants:', err)
    }
  }

  const loadBranches = async (tenantId) => {
    try {
      const data = await getTenantBranches(tenantId)
      setBranches(data)
      setSelectedTenant(tenantId)
    } catch (err) {
      console.error('Error loading branches:', err)
    }
  }

  const handleCreateTenant = async () => {
    try {
      // TODO: pegar UID do usuário autenticado
      const ownerUid = 'CURRENT_USER_UID' // Substituir pela auth real
      await createTenant(newTenantData, ownerUid)
      setModalOpen(false)
      setNewTenantData({ name: '', slug: '' })
      loadTenants()
    } catch (err) {
      console.error('Error creating tenant:', err)
    }
  }

  const handleCreateBranch = async () => {
    try {
      await createBranch(selectedTenant, newBranchData)
      setBranchModalOpen(false)
      setNewBranchData({ name: '' })
      loadBranches(selectedTenant)
    } catch (err) {
      console.error('Error creating branch:', err)
    }
  }

  const handleToggleTenant = async (tenantId, currentStatus) => {
    try {
      await toggleTenantStatus(tenantId, currentStatus !== 'active')
      loadTenants()
    } catch (err) {
      console.error('Error toggling tenant:', err)
    }
  }

  const handleToggleBranch = async (branchId, currentStatus) => {
    try {
      await toggleBranchStatus(selectedTenant, branchId, currentStatus !== 'active')
      loadBranches(selectedTenant)
    } catch (err) {
      console.error('Error toggling branch:', err)
    }
  }

  const handleUpdateBilling = async (branchId, status) => {
    try {
      await updateBillingStatus(selectedTenant, branchId, status)
      loadBranches(selectedTenant)
    } catch (err) {
      console.error('Error updating billing:', err)
    }
  }

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge color="success">Ativo</Badge>
    ) : (
      <Badge color="danger">Bloqueado</Badge>
    )
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
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="card-title">Gerenciamento de Tenants</h4>
                  <Button color="primary" onClick={() => setModalOpen(true)}>
                    + Novo Tenant
                  </Button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => (
                      <tr key={tenant.id}>
                        <td>{tenant.name}</td>
                        <td>
                          <code>{tenant.slug}</code>
                        </td>
                        <td>{getStatusBadge(tenant.status)}</td>
                        <td>
                          {tenant.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '-'}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            color="info"
                            className="me-2"
                            onClick={() => loadBranches(tenant.id)}
                          >
                            Ver Unidades
                          </Button>
                          <Button
                            size="sm"
                            color={tenant.status === 'active' ? 'danger' : 'success'}
                            onClick={() => handleToggleTenant(tenant.id, tenant.status)}
                          >
                            {tenant.status === 'active' ? 'Bloquear' : 'Liberar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {selectedTenant && (
          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="card-title">Unidades do Tenant</h4>
                    <Button color="primary" onClick={() => setBranchModalOpen(true)}>
                      + Nova Unidade
                    </Button>
                  </div>

                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Status</th>
                        <th>Pagamento</th>
                        <th>Criado em</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map(branch => (
                        <tr key={branch.id}>
                          <td>{branch.name}</td>
                          <td>{getStatusBadge(branch.status)}</td>
                          <td>{getBillingBadge(branch.billingStatus)}</td>
                          <td>
                            {branch.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '-'}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              color={branch.status === 'active' ? 'danger' : 'success'}
                              className="me-2"
                              onClick={() => handleToggleBranch(branch.id, branch.status)}
                            >
                              {branch.status === 'active' ? 'Bloquear' : 'Liberar'}
                            </Button>
                            {branch.billingStatus !== 'active' && (
                              <Button
                                size="sm"
                                color="success"
                                onClick={() => handleUpdateBilling(branch.id, 'active')}
                              >
                                Regularizar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        {/* Modal Criar Tenant */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
          <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Criar Novo Tenant</ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Label for="tenantName">Nome do Tenant</Label>
                <Input
                  type="text"
                  id="tenantName"
                  value={newTenantData.name}
                  onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                  placeholder="Ex: Academia XYZ"
                />
              </FormGroup>
              <FormGroup>
                <Label for="tenantSlug">Slug (URL)</Label>
                <Input
                  type="text"
                  id="tenantSlug"
                  value={newTenantData.slug}
                  onChange={(e) => setNewTenantData({ ...newTenantData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="Ex: academia-xyz"
                />
                <small className="text-muted">
                  URL: app.painelswim.com/{newTenantData.slug || 'slug'}
                </small>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleCreateTenant} disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal Criar Branch */}
        <Modal isOpen={branchModalOpen} toggle={() => setBranchModalOpen(!branchModalOpen)}>
          <ModalHeader toggle={() => setBranchModalOpen(!branchModalOpen)}>
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
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setBranchModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleCreateBranch} disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  )
}

export default TenantManagement
