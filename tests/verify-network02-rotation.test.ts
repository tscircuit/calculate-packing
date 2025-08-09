import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("min-sum-distance-to-network02 - verify C6 rotation and body pad dimensions", () => {
  // Exact code from the page
  const packInput: PackInput = {
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -1,
              y: 0.1,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "U1.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: -1,
              y: -0.1,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "U1.3",
            networkId: "U1.3",
            type: "rect",
            offset: {
              x: 1,
              y: -0.1,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "U1.4",
            networkId: "U1.4",
            type: "rect",
            offset: {
              x: 1,
              y: 0.1,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "U1-body",
            networkId: "U1",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 1.2000000000000002,
              y: 3,
            },
          },
        ],
      },
      {
        componentId: "C6",
        pads: [
          {
            padId: "C6.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027334999999961695,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C6.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027334999999961695,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C6-body",
            networkId: "C6",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
      {
        componentId: "C1",
        pads: [
          {
            padId: "C1.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027335000000006104,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C1.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027334999999961695,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C1-body",
            networkId: "C1",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
      {
        componentId: "C2",
        pads: [
          {
            padId: "C2.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027334999999961695,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C2.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027335000000006104,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.1,
              y: 0.1,
            },
          },
          {
            padId: "C2-body",
            networkId: "C2",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const result = pack(packInput)
  
  console.log(`=== EXACT min-sum-distance-to-network02 Test ===`)
  
  for (const component of result.components) {
    console.log(`\n${component.componentId}:`)
    console.log(`  Center: (${component.center.x.toFixed(3)}, ${component.center.y.toFixed(3)})`)
    console.log(`  Rotation: ${component.ccwRotationOffset}°`)
    
    const bodyPad = component.pads.find(p => p.padId.includes("body"))
    if (bodyPad) {
      console.log(`  Body pad size: ${bodyPad.size.x.toFixed(3)} x ${bodyPad.size.y.toFixed(3)}`)
      
      // Let's find the original size from input to compare
      const inputComponent = packInput.components.find(c => c.componentId === component.componentId)
      const inputBodyPad = inputComponent?.pads.find(p => p.padId.includes("body"))
      if (inputBodyPad) {
        console.log(`  Original body pad size: ${inputBodyPad.size.x.toFixed(3)} x ${inputBodyPad.size.y.toFixed(3)}`)
        
        if (component.ccwRotationOffset === 90 || component.ccwRotationOffset === -90) {
          console.log(`  → Expected after 90° rotation: ${inputBodyPad.size.y.toFixed(3)} x ${inputBodyPad.size.x.toFixed(3)}`)
          const expectedX = inputBodyPad.size.y
          const expectedY = inputBodyPad.size.x
          
          console.log(`  → Actual vs Expected: ${bodyPad.size.x.toFixed(3)} vs ${expectedX.toFixed(3)}, ${bodyPad.size.y.toFixed(3)} vs ${expectedY.toFixed(3)}`)
          
          // This is the key test - rotated body pads should have swapped dimensions
          expect(bodyPad.size.x).toBeCloseTo(expectedX, 3)
          expect(bodyPad.size.y).toBeCloseTo(expectedY, 3)
        }
      }
    }
  }
  
  // Basic sanity checks
  expect(result.components.length).toBe(4)
  console.log(`\n✅ Test completed`)
})