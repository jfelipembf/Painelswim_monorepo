import React from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"
import { connect } from "react-redux"

import SideMenu from "components/Common/SideMenu"
import { ActivityForm, ActivityObjectives } from "./Components"
import PageLoader from "components/Common/PageLoader"
import ButtonLoader from "components/Common/ButtonLoader"
import OverlayLoader from "components/Common/OverlayLoader"

import { setBreadcrumbItems } from "../../../store/actions"
import { useActivitiesPage } from "./Hooks"
import { mapStatusColor } from "./Utils"

const ActivitiesPage = ({ setBreadcrumbItems }) => {
  const {
    selectedId,
    setSelectedId,
    handleSelect,
    formValue,
    setFormValue,
    setActivities,
    photoFile,
    setPhotoFile,
    photoPreview,
    isLoading,
    uploadingPhoto,
    handleSave,
    sideItems,
    activities
  } = useActivitiesPage({ setBreadcrumbItems })

  if (isLoading('page') && !activities.length) {
    return <PageLoader />
  }

  return (
    <Container fluid>
      <Row className="g-4">
        <Col lg="4">
          <SideMenu
            title="Atividades"
            description="Selecione para editar."
            items={sideItems}
            selectedId={selectedId}
            onSelect={handleSelect}
            emptyLabel="Nenhuma atividade cadastrada."
            headerActions={
              <Button
                color="primary"
                size="sm"
                onClick={() => {
                  handleSelect("new")
                }}
              >
                Nova atividade
              </Button>
            }
          />
        </Col>

        <Col lg="8">
          <Card className="shadow-sm mb-3 position-relative">
            <OverlayLoader show={isLoading('selection')} />
            <CardHeader className="bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="mb-0">{formValue.name || "Selecione uma atividade"}</h5>
                <p className="text-muted mb-0 small">Edite ou crie uma atividade.</p>
              </div>
              {selectedId ? (
                <div className="d-flex align-items-center gap-2">
                  <Badge color={mapStatusColor(formValue.status || "ativo")} pill>
                    {formValue.status || "ativo"}
                  </Badge>
                  <ButtonLoader
                    color="primary"
                    size="sm"
                    onClick={handleSave}
                    loading={isLoading('save') || uploadingPhoto}
                  >
                    Salvar
                  </ButtonLoader>
                </div>
              ) : null}
            </CardHeader>
            <CardBody>
              {selectedId ? (
                <ActivityForm
                  value={formValue}
                  onChange={setFormValue}
                  photoPreview={photoPreview || formValue.photoUrl}
                  onPhotoChange={file => setPhotoFile(file)}
                />
              ) : (
                <div className="text-muted">Selecione uma atividade para editar ou clique em “Nova atividade”.</div>
              )}
            </CardBody>
          </Card>

          {selectedId && formValue.id !== "new" && (
            <ActivityObjectives
              objectives={formValue.objectives || []}
              onChange={nextObjectives => {
                setFormValue(prev => ({ ...prev, objectives: nextObjectives }))
                setActivities(prev =>
                  prev.map(item => (item.id === selectedId ? { ...item, objectives: nextObjectives } : item))
                )
              }}
            />
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ActivitiesPage)

