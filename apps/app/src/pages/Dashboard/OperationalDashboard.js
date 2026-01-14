import React, { useEffect } from "react"
import { connect } from "react-redux"
import { Row, Col } from "reactstrap"

// Components
import OperationalMiniWidgets from "./OperationalComponents/OperationalMiniWidgets"
import ExperimentalTracker from "./OperationalComponents/ExperimentalTracker"
import OperationalAlerts from "./OperationalComponents/OperationalAlerts"

import { setBreadcrumbItems } from "../../store/actions"
import { useOperationalDashboardLogic } from "./Hooks/useOperationalDashboardLogic"

const OperationalDashboard = (props) => {
    document.title = "Dashboard Operacional | Painel Swim"
    const { reports, experimentals, tasks, birthdays, refreshTasks, markTaskAsCompleted, isLoading } = useOperationalDashboardLogic()

    const breadcrumbItems = [
        { title: "Dashboard", link: "#" },
        { title: "Operacional", link: "#" }
    ]

    useEffect(() => {
        props.setBreadcrumbItems('Dashboard Operacional', breadcrumbItems)
    }, [props])

    return (
        <React.Fragment>
            <OperationalMiniWidgets reports={reports} isLoading={isLoading} />

            <Row>
                <Col xl="3" md="6">
                    <ExperimentalTracker experimentals={experimentals} isLoading={isLoading} />
                </Col>
                <Col xl="9" md="6">
                    <OperationalAlerts
                        tasks={tasks}
                        birthdays={birthdays}
                        refreshTasks={refreshTasks}
                        markTaskAsCompleted={markTaskAsCompleted}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(OperationalDashboard)
