import React from "react"
import { Button, ButtonGroup } from "reactstrap"

import { TURN_OPTIONS } from "../Constants"

const TurnSelector = ({ value, onChange }) => {
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <span className="text-muted fw-semibold text-uppercase small">Turno</span>
      <ButtonGroup className="flex-wrap">
        {TURN_OPTIONS.map(option => (
          <Button
            key={option.value}
            color={value === option.value ? "primary" : "light"}
            onClick={() => onChange(option.value)}
            size="sm"
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}

export default TurnSelector
