import React from "react"
import { ButtonGroup, Button } from "reactstrap"

import {
  formatWeekShortLabel,
  addDays,
  getStartOfWeekSunday,
  formatISODate,
  isSameDay,
  getStepForView,
  formatRangeLabel,
} from "../Utils/dateUtils"

const WeekNavigator = ({ referenceDate, view, onReferenceDateChange }) => {
  const step = getStepForView(view)
  const label = formatRangeLabel(referenceDate, view)

  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        color="light"
        size="sm"
        onClick={() => onReferenceDateChange(addDays(referenceDate, -step))}
      >
        <i className="mdi mdi-chevron-left" />
      </Button>
      <div className="text-muted small fw-semibold text-uppercase">{label}</div>
      <Button
        color="light"
        size="sm"
        onClick={() => onReferenceDateChange(addDays(referenceDate, step))}
      >
        <i className="mdi mdi-chevron-right" />
      </Button>
    </div>
  )
}

export default WeekNavigator
