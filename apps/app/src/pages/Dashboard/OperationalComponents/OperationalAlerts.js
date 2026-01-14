import React, { useState } from "react";
import { Card, CardBody, Row, Col, Input, Button } from "reactstrap";
import TaskModal from "./TaskModal";
import { completeTask } from "../../../services/Tasks/tasks.service";
import { getAuthUser } from "../../../helpers/permission_helper";
import { useToast } from "../../../components/Common/ToastProvider";

const OperationalAlerts = ({ tasks = [], birthdays = [], refreshTasks }) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const toast = useToast();

    const authUser = getAuthUser();
    const idTenant = authUser.tenant?.id || authUser.tenant?.idTenant || localStorage.getItem("idTenant");

    const handleTaskCheck = async (taskId) => {
        try {
            await completeTask(idTenant, taskId);
            toast.show({ title: "Sucesso", description: "Tarefa concluída!", color: "success" });
            if (refreshTasks) refreshTasks();
        } catch (error) {
            console.error("Erro ao concluir tarefa:", error);
            toast.show({ title: "Erro", description: "Não foi possível concluir a tarefa.", color: "danger" });
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (!selectedDate) return true;
        return task.dueDate === selectedDate;
    });

    const data = {
        avisos: [
            { id: "a1", title: "Manutenção Piscina B", info: "Das 08:00 às 12:00", date: "Amanhã" },
            { id: "a2", title: "Novo Uniforme", info: "Retirada na recepção", date: "Jan" },
            { id: "a3", title: "Dedetização", info: "Área externa", date: "Sáb" },
        ],
        // birthdays prop replaces static aniversariantes
    };

    const Column = ({ title, items, showDivider = true, isTasks = false, isBirthday = false }) => {
        return (
            <Col md={4} className={showDivider ? "border-end" : ""}>
                <div className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="font-size-15 mb-0 fw-bold text-dark">{title}</h5>
                            {isTasks && (
                                <Input
                                    type="date"
                                    bsSize="sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ maxWidth: "130px" }}
                                />
                            )}
                        </div>

                        {isTasks && (
                            <Button
                                color="primary"
                                size="sm"
                                className="rounded-circle p-0"
                                style={{ width: "22px", height: "22px" }}
                                onClick={() => setIsTaskModalOpen(true)}
                            >
                                <i className="mdi mdi-plus"></i>
                            </Button>
                        )}
                    </div>
                    <div style={{ height: "400px", overflowY: "auto" }} className="custom-scroll">
                        <ol className="activity-feed mb-0 ps-3">
                            {items.length === 0 ? (
                                <li className="text-muted small mt-2">Nada para exibir.</li>
                            ) : (
                                items.map((item) => (
                                    <li key={item.id} className="feed-item">
                                        <div className="feed-item-list d-flex align-items-start gap-2">
                                            {isTasks && (
                                                <Input
                                                    type="checkbox"
                                                    checked={item.status === 'completed'}
                                                    onChange={() => (item.status !== 'completed') ? handleTaskCheck(item.id) : null}
                                                    style={{ marginTop: "2px", cursor: "pointer" }}
                                                    disabled={item.status === 'completed'}
                                                />
                                            )}

                                            <div style={{ opacity: item.status === 'completed' ? 0.6 : 1, width: '100%' }}>
                                                <div className="d-flex justify-content-between">
                                                    <span className="date mb-1">{item.dueDate || item.date}</span>
                                                    {isBirthday && (
                                                        <span>
                                                            {item.messageSent === true && <i className="mdi mdi-check-circle text-success" title="Mensagem Enviada"></i>}
                                                            {item.messageSent === false && <i className="mdi mdi-close-circle text-danger" title="Erro no Envio"></i>}
                                                            {item.messageSent === undefined && <i className="mdi mdi-clock-outline text-muted" title="Aguardando"></i>}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`activity-text fw-bold d-block ${item.status === 'completed' ? 'text-decoration-line-through' : ''}`}>
                                                    {item.description || item.title || item.name}
                                                </span>
                                                <p className="text-muted small mb-0">{item.info || item.role || ""}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
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
                        <Column title="Tarefas" items={filteredTasks} isTasks={true} />
                        <Column title="Avisos" items={data.avisos} />
                        <Column title="Aniversários" items={birthdays} showDivider={false} isBirthday={true} />
                    </Row>
                </CardBody>
            </Card>

            <TaskModal
                isOpen={isTaskModalOpen}
                toggle={() => setIsTaskModalOpen(!isTaskModalOpen)}
                onTaskCreated={refreshTasks}
            />

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