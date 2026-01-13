import React from "react"
import { Card, CardBody, Row, Col } from "reactstrap"

const OperationalMiniWidgets = () => {
    const reports = [
        {
            title: "Número de Vendas",
            iconClass: "cart-outline",
            total: "8",
            badgecolor: "success",
            average: "+2",
            label: "Hoje"
        },
        {
            title: "Valor em Vendas",
            iconClass: "currency-usd",
            total: "R$ 1.250,00",
            badgecolor: "info",
            average: "R$ 450",
            label: "Média p/ venda"
        },
        {
            title: "Aulas Experimentais",
            iconClass: "star-circle-outline",
            total: "5",
            badgecolor: "warning",
            average: "3",
            label: "Realizadas"
        },
        {
            title: "Pendências/Avisos",
            iconClass: "alert-circle-outline",
            total: "15",
            badgecolor: "danger",
            average: "4",
            label: "Críticas"
        },
    ]

    return (
        <Row>
            {reports.map((report, key) => (
                <Col xl={3} sm={6} key={key}>
                    <Card className="mini-stat bg-primary">
                        <CardBody className="mini-stat-img">
                            <div className="mini-stat-icon">
                                <i className={"float-end mdi mdi-" + report.iconClass}></i>
                            </div>
                            <div className="text-white">
                                <h6 className="text-uppercase mb-3 font-size-16 text-white">{report.title}</h6>
                                <h2 className="mb-4 text-white">{report.total}</h2>
                                <span className={"badge bg-" + report.badgecolor}> {report.average} </span>
                                <span className="ms-2">{report.label}</span>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            ))}
        </Row>
    )
}

export default OperationalMiniWidgets
