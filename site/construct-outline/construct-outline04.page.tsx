import React from "react"
import { ConstructOutlineDebugger } from "../components/ConstructOutlineDebugger"
import type { PackedComponent } from "../../lib/types"
import inputData from "../construct-outline-inputs/construct-outline-input-02.json"

const ConstructOutline04: React.FC = () => {
  const { components, minGap, stepNumber } = inputData

  return (
    <ConstructOutlineDebugger
      components={components as PackedComponent[]}
      minGap={minGap}
      title={`Construct Outline 04 - Step ${stepNumber} (${components.length} component${components.length !== 1 ? 's' : ''})`}
      stepNumber={stepNumber}
    />
  )
}

export default ConstructOutline04