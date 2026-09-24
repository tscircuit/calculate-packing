export type ComponentId = string
export type PadId = string
export type NetworkId = string

export interface InputPad {
  padId: string
  networkId: string
  type: "rect"
  offset: { x: number; y: number }
  size: { x: number; y: number }
  absoluteCenter?: { x: number; y: number }
}

export interface OutputPad extends InputPad {
  absoluteCenter: { x: number; y: number }
}

export interface ComponentCourtyard {
  offsetFromCenter: { x: number; y: number }
  width: number
  height: number
}

export interface InputComponent {
  componentId: string
  /** Components marked as static are not moved by the packer */
  isStatic?: boolean
  /**
   * If not provided, the component can be rotated by 0, 90, 180, or 270 degrees.
   */
  availableRotationDegrees?: number[]
  /** Preconfigured center for static components */
  center?: { x: number; y: number }
  /** Preconfigured rotation (degrees CCW) for static components */
  ccwRotationOffset?: number
  pads: InputPad[]
  /** Optional courtyard defining the component's physical boundary */
  courtyard?: ComponentCourtyard
}

export interface PackedComponent extends InputComponent {
  center: { x: number; y: number }
  /** @deprecated Rotation in degrees (counterclockwise) */
  ccwRotationOffset: number
  /** Rotation in degrees (counterclockwise) - output field */
  ccwRotationDegrees?: number
  pads: OutputPad[]
}

export interface InputObstacle {
  obstacleId: string
  absoluteCenter: { x: number; y: number }
  width: number
  height: number
}

export type PackPlacementStrategy =
  | "shortest_connection_along_outline"
  | "minimum_sum_distance_to_network"
  | "minimum_sum_squared_distance_to_network"
  | "minimum_closest_sum_squared_distance"

/**
 * A distance constraint that fixes the relative position of two components
 * along a specific axis.
 *
 * `fixed_x_distance_and_orientation`:
 *   After both chips are packed, `rightChipId.center.x` is snapped to
 *   `leftChipId.center.x + distance`. The Y coordinate is determined by the
 *   pack algorithm and left unchanged, giving predictable single-axis layout.
 */
export interface DistanceConstraint {
  /** The component whose X position is used as the reference anchor. */
  leftChipId: ComponentId
  /** The component whose X position will be overridden. */
  rightChipId: ComponentId
  /** The only currently supported constraint type. */
  type: "fixed_x_distance_and_orientation"
  /** Desired X distance from leftChipId.center.x to rightChipId.center.x (positive = rightward). */
  distance: number
}

export interface PackInput {
  components: InputComponent[]

  obstacles?: InputObstacle[]

  bounds?: { minX: number; minY: number; maxX: number; maxY: number }

  boundaryOutline?: Array<{ x: number; y: number }>

  minGap: number

  packOrderStrategy: "largest_to_smallest"
  packPlacementStrategy: PackPlacementStrategy

  weightedConnections?: Array<{
    padIds: string[]
    weight: number
    ignoreWeakConnections?: boolean
  }>

  /**
   * Optional list of inter-component distance constraints.
   * These are applied after the normal pack step to snap component positions.
   */
  distanceConstraints?: DistanceConstraint[]

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
