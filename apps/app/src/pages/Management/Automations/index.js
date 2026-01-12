import React, { useState, useEffect } from "react"
import { Container, Row, Col, Card, CardBody, CardHeader, Spinner } from "reactstrap"
import { connect } from "react-redux"

// Components
import SideMenu from "components/Common/SideMenu"
import AutomationDetail from "./components/AutomationDetail"

// Hooks & Constants
import { useAutomations } from "./hooks/useAutomations"
import { TRIGGER_LABELS } from "./constants/triggers"

// Actions
import { setBreadcrumbItems } from "../../../store/actions"

const AutomationsPage = ({ setBreadcrumbItems }) => {
    const { automations, loading, fetchAutomations, saveAutomation } = useAutomations()
    const [selectedId, setSelectedId] = useState(null)

    // Select the first automation by default when loaded
    useEffect(() => {
        if (automations.length > 0 && !selectedId) {
            setSelectedId(automations[0].id)
        }
    }, [automations, selectedId])

    useEffect(() => {
        // Set breadcrumbs in global header instead of page content
        const breadcrumbs = [
            { title: "Gerencial", link: "/management/automations" },
            { title: "Automações", link: "/management/automations" },
        ]
        setBreadcrumbItems("Automações", breadcrumbs)
    }, [setBreadcrumbItems])

    document.title = "Automações | Painel Swim"

    const selectedAutomation = automations.find(a => a.id === selectedId)

    // Helper formatting for SideMenu
    const menuItems = automations.map(auto => ({
        id: auto.id,
        title: auto.name, // The Label from constants
        subtitle: auto.active ? "Ativo" : "Inativo",
        color: auto.active ? "success" : "secondary"
    }))

    return (
        <Container fluid>
            {loading && automations.length === 0 ? (
                <div className="text-center my-4"><Spinner color="primary" /></div>
            ) : (
                <Row className="g-4">
                    <Col lg={4}>
                        <SideMenu
                            title="Gatilhos"
                            description="Selecione um evento para configurar a automação."
                            items={menuItems}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            emptyLabel="Nenhum gatilho disponível."
                        />
                    </Col>

                    <Col lg={8}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-white">
                                <h5 className="mb-0">Configuração</h5>
                            </CardHeader>
                            <CardBody>
                                <AutomationDetail
                                    automation={selectedAutomation}
                                    onSave={saveAutomation}
                                    triggerLabels={TRIGGER_LABELS}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    )
}

export default connect(null, { setBreadcrumbItems })(AutomationsPage)
