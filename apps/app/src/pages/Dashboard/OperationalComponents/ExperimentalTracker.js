import React from "react";
import { Card, CardBody, Badge } from "reactstrap";

const ExperimentalTracker = () => {
    const experimentals = [
        { id: "e1", name: "Gabriel Oliveira", time: "14:30", activity: "Natação Infantil", status: "Confirmado" },
        { id: "e2", name: "Mariana Costa", time: "16:00", activity: "Natação Adulto", status: "Aguardando" },
        { id: "e3", name: "Pedro Santos", time: "18:00", activity: "Hidroginástica", status: "Pendente" },
        { id: "e4", name: "Ana Beatriz", time: "19:30", activity: "Crossfit", status: "Confirmado" },
        { id: "e5", name: "Lucas Melo", time: "20:00", activity: "Musculação", status: "Aguardando" },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "Confirmado": return "success";
            case "Aguardando": return "info";
            default: return "warning";
        }
    };

    return (
        <React.Fragment>
            <Card style={{ height: "500px" }} className="shadow-sm border-0">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="card-title mb-0">Aulas Experimentais</h4>
                        <Badge color="soft-warning" className="text-warning border border-warning px-2">Hoje</Badge>
                    </div>

                    <div className="custom-scroll" style={{ height: "410px", overflowY: "auto" }}>
                        <ol className="activity-feed mb-0 ps-2">
                            {experimentals.map((item) => (
                                <li key={item.id} className="feed-item pb-4">
                                    <div className="d-flex align-items-start gap-2">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="avatar-xs">
                                                <span className="avatar-title rounded-circle bg-soft-primary text-primary fs-4">
                                                    <i className="mdi mdi-account-circle"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-2">
                                            <div className="d-flex flex-column">
                                                <span className="date mb-0 text-primary fw-bold" style={{ fontSize: '11px' }}>{item.time}</span>
                                                <h6 className="mb-0 font-size-14 fw-bold text-dark">{item.name}</h6>
                                                <p className="text-muted small mb-1">{item.activity}</p>
                                                <div>
                                                    <Badge
                                                        color={`soft-${getStatusColor(item.status)}`}
                                                        className={`text-${getStatusColor(item.status)} border`}
                                                        style={{ fontSize: '10px' }}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </CardBody>
            </Card>

            <style>{`
                .activity-feed { list-style: none; }
                .activity-feed .feed-item {
                    position: relative;
                    padding-left: 30px;
                    border-left: 2px solid #eff2f7;
                }
                .activity-feed .feed-item:last-child { border-left: none; }
                .activity-feed .feed-item:after {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 15px;
                    left: -7px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #f1b44c;
                }
                .avatar-xs { height: 38px; width: 38px; }
                .avatar-title { align-items: center; display: flex; height: 100%; justify-content: center; width: 100%; }
                .bg-soft-primary { background-color: rgba(59, 93, 231, 0.1); }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </React.Fragment>
    );
};

export default ExperimentalTracker;