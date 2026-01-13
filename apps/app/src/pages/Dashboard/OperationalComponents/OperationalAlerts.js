import React, { useState } from "react";
import { Card, CardBody, Row, Col, Input } from "reactstrap";

const OperationalAlerts = () => {
    const [checkedItems, setCheckedItems] = useState({});

    const handleCheck = (id) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const data = {
        pendencias: [
            { id: "p1", title: "Atestados Vencidos", info: "12 pendentes", date: "Urgente" },
            { id: "p2", title: "Contratos s/ Assinatura", info: "5 pendentes", date: "Hoje" },
            { id: "p3", title: "Exames Periódicos", info: "3 pendentes", date: "12 Jan" },
            { id: "p4", title: "Treinamento NR10", info: "RH aguardando", date: "15 Jan" },
        ],
        avisos: [
            { id: "a1", title: "Manutenção Piscina B", info: "Das 08:00 às 12:00", date: "Amanhã" },
            { id: "a2", title: "Novo Uniforme", info: "Retirada na recepção", date: "Jan" },
            { id: "a3", title: "Dedetização", info: "Área externa", date: "Sáb" },
        ],
        aniversariantes: [
            { id: "b1", title: "João Silva", info: "Setor Operacional", date: "Hoje" },
            { id: "b2", title: "Maria Souza", info: "Setor Administrativo", date: "15 Jan" },
        ]
    };

    const Column = ({ title, items, showDivider = true }) => {
        const sortedItems = [...items].sort((a, b) => !!checkedItems[a.id] - !!checkedItems[b.id]);

        return (
            <Col md={4} className={showDivider ? "border-end" : ""}>
                <div className="p-3">
                    <h5 className="font-size-15 mb-4 fw-bold text-dark">{title}</h5>
                    {/* Altura interna ajustada para o card de 500px */}
                    <div style={{ height: "400px", overflowY: "auto" }} className="custom-scroll">
                        <ol className="activity-feed mb-0 ps-3">
                            {sortedItems.map((item) => (
                                <li key={item.id} className="feed-item" style={{
                                    opacity: checkedItems[item.id] ? 0.5 : 1,
                                    transition: 'all 0.3s'
                                }}>
                                    <div className="feed-item-list d-flex align-items-start gap-2">
                                        <Input
                                            type="checkbox"
                                            checked={!!checkedItems[item.id]}
                                            onChange={() => handleCheck(item.id)}
                                            style={{ marginTop: "2px", cursor: "pointer" }}
                                        />
                                        <div className={checkedItems[item.id] ? "text-decoration-line-through" : ""}>
                                            <span className="date mb-1">{item.date}</span>
                                            <span className="activity-text fw-bold d-block">{item.title}</span>
                                            <p className="text-muted small mb-0">{item.info}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </Col>
        );
    };

    return (
        <React.Fragment>
            <Card style={{ height: "500px" }} className="shadow-sm border-0">
                <CardBody className="p-0">
                    <Row className="g-0">
                        <Column title="Atividades" items={data.pendencias} />
                        <Column title="Avisos" items={data.avisos} />
                        <Column title="Aniversários" items={data.aniversariantes} showDivider={false} />
                    </Row>
                </CardBody>
            </Card>

            <style>{`
                .activity-feed { list-style: none; }
                .activity-feed .feed-item {
                    position: relative;
                    padding-bottom: 27px;
                    padding-left: 20px;
                    border-left: 2px solid #f3f3f3;
                }
                .activity-feed .feed-item:last-child { border-left: none; }
                .activity-feed .feed-item:after {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 4px;
                    left: -7px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #3b5de7;
                }
                .activity-feed .feed-item .date {
                    display: block;
                    font-size: 11px;
                    color: #adb5bd;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </React.Fragment>
    );
};

export default OperationalAlerts;