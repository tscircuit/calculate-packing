export type ComponentId = string
export type PadId = string

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

  packOrder: ComponentId[] | "largest_to_smallest"
  packStrategy: "shortest_connection_along_outline"
}

export interface PackOutput extends PackInput {
  components: PackedComponent[]
}
