import type { Point } from "@tscircuit/math-utils"
import { cross } from "../math/cross"

type Segment = [Point, Point]

/**
 * Simplifies an outline by removing collinear segments.
 * Adjacent segments that are collinear (have the same direction) are merged into a single segment.
 * 
 * @param outline - Array of line segments forming a closed outline
 * @param tolerance - Tolerance for considering segments collinear (default: 1e-10)
 * @returns Simplified outline with collinear segments merged
 */
export function simplifyCollinearSegments(
  outline: Segment[],
  tolerance: number = 1e-10,
): Segment[] {
  if (outline.length <= 1) {
    return outline
  }

  const simplified: Segment[] = []
  
  // Track the start point of the current merged segment
  let currentSegmentStart = outline[0]![0]
  let currentSegmentEnd = outline[0]![1]
  
  for (let i = 1; i < outline.length; i++) {
    const nextSegment = outline[i]!
    const [nextStart, nextEnd] = nextSegment
    
    // Check if current segment end connects to next segment start
    // Use a much smaller tolerance for connectivity (1e-10) than for collinearity
    const connectionTolerance = 1e-10
    const isConnected = 
      Math.abs(currentSegmentEnd.x - nextStart.x) < connectionTolerance &&
      Math.abs(currentSegmentEnd.y - nextStart.y) < connectionTolerance
    
    if (!isConnected) {
      // Not connected, save current segment and start new one
      simplified.push([currentSegmentStart, currentSegmentEnd])
      currentSegmentStart = nextStart
      currentSegmentEnd = nextEnd
      continue
    }
    
    // Check if the segments are collinear using cross product
    // We need to check if the three points (currentSegmentStart, currentSegmentEnd, nextEnd) are collinear
    const crossProduct = cross(currentSegmentStart, currentSegmentEnd, nextEnd)
    
    if (Math.abs(crossProduct) < tolerance) {
      // Segments are collinear, extend the current segment
      currentSegmentEnd = nextEnd
    } else {
      // Not collinear, save current segment and start new one
      simplified.push([currentSegmentStart, currentSegmentEnd])
      currentSegmentStart = nextStart
      currentSegmentEnd = nextEnd
    }
  }
  
  // Handle the last segment and potential wrap-around for closed outlines
  if (outline.length > 2) {
    const firstSegment = simplified[0]
    const lastSegmentCandidate = [currentSegmentStart, currentSegmentEnd] as Segment
    
    // Check if last segment can merge with the first segment (for closed outlines)
    if (firstSegment && simplified.length > 0) {
      const connectionTolerance = 1e-10
      const isLastConnectedToFirst =
        Math.abs(currentSegmentEnd.x - firstSegment[0].x) < connectionTolerance &&
        Math.abs(currentSegmentEnd.y - firstSegment[0].y) < connectionTolerance
      
      if (isLastConnectedToFirst) {
        // Check if they're collinear
        const crossProduct = cross(currentSegmentStart, currentSegmentEnd, firstSegment[1])
        
        if (Math.abs(crossProduct) < tolerance) {
          // Merge last segment with first segment
          simplified[0] = [currentSegmentStart, firstSegment[1]]
        } else {
          // Not collinear, add as separate segment
          simplified.push(lastSegmentCandidate)
        }
      } else {
        // Not connected, add as separate segment
        simplified.push(lastSegmentCandidate)
      }
    } else {
      // No first segment to merge with, add as separate segment
      simplified.push(lastSegmentCandidate)
    }
  } else {
    // For very short outlines, just add the last segment
    simplified.push([currentSegmentStart, currentSegmentEnd])
  }
  
  return simplified
}