import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Row, Col } from "reactstrap"

// Components
import OperationalMiniWidgets from "./OperationalComponents/OperationalMiniWidgets"
import ExperimentalTracker from "./OperationalComponents/ExperimentalTracker"
import OperationalAlerts from "./OperationalComponents/OperationalAlerts"

import { setBreadcrumbItems } from "../../store/actions"

const OperationalDashboard = (props) => {
    document.title = "Dashboard Operacional | Painel Swim"

    const breadcrumbItems = [
        { title: "Dashboard", link: "#" },
        { title: "Operacional", link: "#" }
    ]

    useEffect(() => {
        props.setBreadcrumbItems('Dashboard Operacional', breadcrumbItems)
    }, [props])

    return (
        <React.Fragment>
            <OperationalMiniWidgets />

            <Row>
                <Col xl="3" md="6">
                    <ExperimentalTracker />
                </Col>
                <Col xl="9" md="6">
                    <OperationalAlerts />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(OperationalDashboard)
