import React from "react"
import { Badge, Card, CardBody, CardHeader, Table } from "reactstrap"

import { getLevelColor } from "../Utils/evaluationUtils"
import { useClientEvaluation } from "../Hooks/useClientEvaluation"

// Inline functions removed (levelColor, toJsDate)

const ClientEvaluation = ({ clientId }) => {
  const {
    loading,
    visibleEvaluations,
    objectives
  } = useClientEvaluation(clientId)

  if (loading) {
    return (
      <Card className="shadow-sm client-evaluation">
        <CardHeader>
          <h5 className="mb-0">Avaliação</h5>
        </CardHeader>
        <CardBody>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Carregando avaliações...</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm client-evaluation">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h5 className="mb-0">Avaliação</h5>
            <p className="text-muted small mb-0">Progresso do aluno.</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 260 }}># / Objetivos e tópicos</th>
                {visibleEvaluations.map(ass => (
                  <th key={ass.id} className="text-center">
                    {ass.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => (
                <React.Fragment key={obj.id}>
                  <tr className="table-active">
                    <td colSpan={visibleEvaluations.length + 1} className="fw-semibold">
                      {obj.index}. {obj.title}
                    </td>
                  </tr>
                  {obj.topics.map((topic, idx) => (
                    <tr key={topic.key || topic.id}>
                      <td>
                        <div className="fw-semibold">{`${obj.index}.${idx + 1} ${topic.description} `}</div>
                      </td>
                      {visibleEvaluations.map(ass => {
                        const result = ass.topics.find(t => t.idTopic === topic.id)
                        const color = getLevelColor(result?.levelValue || 0)
                        return (
                          <td key={`${ass.id} -${topic.id} `} className="text-center">
                            <Badge color={color} pill className="text-wrap">
                              {result?.levelLabel || "Não avaliado"}
                            </Badge>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {!objectives.length && (
                <tr>
                  <td colSpan={visibleEvaluations.length + 1} className="text-muted">
                    Nenhuma avaliação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default ClientEvaluation
