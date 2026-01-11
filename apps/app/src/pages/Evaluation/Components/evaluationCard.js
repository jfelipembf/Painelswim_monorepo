import React from "react"
import PropTypes from "prop-types"
import { Card, CardBody, CardHeader, Badge } from "reactstrap"
import EvaluationForm from "./evaluationForm"

const EvaluationCard = ({ schedule }) => {
  if (!schedule) {
    return (
      <Card className="h-100 shadow-sm">
        <CardHeader className="bg-white border-bottom py-3">
          <div className="text-center text-muted">
            <i className="mdi mdi-calendar-blank me-2" />
            Nenhum evento selecionado
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-cursor-default-click text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">Clique em um evento para ver os detalhes.</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  const {
    activityName,
    employeeName,
    startTime,
    endTime,
    color
  } = schedule

  return (
    <Card className="h-100 shadow-sm">
      <CardHeader
        className="bg-white border-bottom py-3"
        style={color ? { borderTop: `3px solid ${color}` } : undefined}
      >
        <div className="d-flex flex-column gap-2">
          {/* Título principal e instrutor mais compactos */}
          <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-2 gap-sm-3">
            <div className="flex-grow-1">
              <h4 className="mb-1 fw-bold">{activityName || "Evento"}</h4>
              {employeeName && (
                <div className="text-muted small">
                  <i className="mdi mdi-account me-1" />
                  {employeeName}
                </div>
              )}
            </div>
            <div className="d-flex flex-column align-items-start align-items-sm-end gap-1 w-100 w-sm-auto">
              <Badge color="secondary" className="text-white px-2 py-1" style={{ fontSize: '0.75rem' }}>
                <i className="mdi mdi-clock me-1" />
                {startTime} — {endTime}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-3">
        {schedule?.idClass ? (
          <EvaluationForm
            classId={schedule.idClass}
            idActivity={schedule.idActivity}
          />
        ) : (
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-calendar-check text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">Evento selecionado</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

EvaluationCard.propTypes = {
  schedule: PropTypes.shape({
    activityName: PropTypes.string,
    employeeName: PropTypes.string,
    areaName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    maxCapacity: PropTypes.number,
    enrolledCount: PropTypes.number,
    attendanceRecorded: PropTypes.bool,
    presentCount: PropTypes.number,
    absentCount: PropTypes.number,
    color: PropTypes.string,
  })
}

export default EvaluationCard
