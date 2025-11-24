import { Polygon, Box, BooleanOperations } from "@flatten-js/core"

const bigBox = new Polygon(new Box(0, 0, 100, 100))
const smallBox = new Polygon(new Box(10, 10, 20, 20))

const difference = BooleanOperations.subtract(bigBox, smallBox)

console.log(JSON.stringify(difference.toJSON(), null, "  "))
