export type ComponentId = string
export type PadId = string
export type NetworkId = string

export interface InputPad {
  padId: string
  networkId: string
  type: "rect"
  offset: { x: number; y: number }
  size: { x: number; y: number }
}

export interface OutputPad extends InputPad {
  absoluteCenter: { x: number; y: number }
}

export interface InputComponent {
  componentId: string
  /**
   * If not provided, the component can be rotated by 0, 90, 180, or 270 degrees.
   */
  availableRotationDegrees?: number[]
  pads: InputPad[]
}

export interface PackedComponent extends InputComponent {
  center: { x: number; y: number }
  ccwRotationOffset: number
  pads: OutputPad[]
}

export interface PackInput {
  components: InputComponent[]

  minGap: number

  packOrderStrategy: "largest_to_smallest"
  packPlacementStrategy: "shortest_connection_along_outline"

  disconnectedPackDirection?:
    | "left"
    | "right"
    | "up"
    | "down"
    | "nearest_to_center"
  packFirst?: ComponentId[]
}

export interface PackOutput extends PackInput {
  components: PackedComponent[]
}
