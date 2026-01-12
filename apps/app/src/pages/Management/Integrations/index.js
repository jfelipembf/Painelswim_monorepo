import React, { useState, useEffect } from "react"
import { Container, Row, Col, Card, CardBody, CardHeader } from "reactstrap"
import { connect } from "react-redux"

// Components
import SideMenu from "components/Common/SideMenu"
import IntegrationForm from "./components/IntegrationForm"
import TestMessageForm from "./components/TestMessageForm"

// Constants
import { INTEGRATIONS_LIST } from "./constants/integrationsList"

// Actions
import { setBreadcrumbItems } from "../../../store/actions"

const IntegrationsPage = ({ setBreadcrumbItems }) => {
    const [selectedIntegration, setSelectedIntegration] = useState("gemini")

    useEffect(() => {
        const breadcrumbs = [
            { title: "Gerencial", link: "/management/evaluation-levels" },
            { title: "Integrações", link: "/management/integrations" },
        ]
        setBreadcrumbItems("Integrações", breadcrumbs)
    }, [setBreadcrumbItems])

    const selectedItem = INTEGRATIONS_LIST.find(i => i.id === selectedIntegration)

    return (
        <React.Fragment>
            <Container fluid>
                <Row className="g-4">
                    <Col lg={4}>
                        <SideMenu
                            title="Integrações"
                            description="Gerencie suas conexões externas."
                            items={INTEGRATIONS_LIST}
                            selectedId={selectedIntegration}
                            onSelect={setSelectedIntegration}
                            emptyLabel="Nenhuma integração disponível."
                        />
                    </Col>
                    <Col lg={8}>
                        <Card className="shadow-sm h-100">
                            <CardHeader className="bg-white">
                                <h5 className="mb-0">{selectedItem?.title || "Configuração"}</h5>
                            </CardHeader>
                            <CardBody>
                                <IntegrationForm selected={selectedIntegration} />
                                {selectedIntegration === "evolution" && <TestMessageForm />}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(IntegrationsPage)
