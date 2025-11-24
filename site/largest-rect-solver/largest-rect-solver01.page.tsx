import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { LargestRectOutsideOutlineFromPointSolver } from "lib/LargestRectOutsideOutlineFromPointSolver"
import { useMemo } from "react"

export default () => {
  const solver = useMemo(() => {
    return new LargestRectOutsideOutlineFromPointSolver({
      ccwFullOutline: [
        {
          x: 4.060979649999923,
          y: -7.000029899999991,
        },
        {
          x: -1.5620341000001656,
          y: -7.000029899999991,
        },
        {
          x: -1.5620341000001656,
          y: -7.513104049999988,
        },
        {
          x: -0.1480407000001529,
          y: -7.513104049999988,
        },
        {
          x: -0.1480407000001529,
          y: -8.175014949999996,
        },
        {
          x: 1.3719592999998471,
          y: -8.175014949999996,
        },
        {
          x: 1.3719592999998471,
          y: -9.185,
        },
        {
          x: 3.5719592999998473,
          y: -9.185,
        },
        {
          x: 3.5719592999998473,
          y: -8.545,
        },
        {
          x: 2.540979649999923,
          y: -8.545,
        },
        {
          x: 2.540979649999923,
          y: -7.344999999999999,
        },
        {
          x: 4.060979649999923,
          y: -7.344999999999999,
        },
      ],
      globalBounds: {
        minX: -4.602034100000166,
        minY: -12.225000000000001,
        maxX: 7.100979649999923,
        maxY: -3.9600298999999906,
      },
      origin: {
        x: 1.2494727749998786,
        y: -7.00012989999999,
      },
    })
  }, [])
  return <GenericSolverDebugger solver={solver} />
}
