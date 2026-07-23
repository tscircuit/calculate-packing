import { expect, test } from "bun:test"
import { isStrongConnection } from "../lib/utils/isStrongConnection"

test("all connections are strong without weighted connections", () => {
  expect(isStrongConnection("pad1", "pad2")).toBe(true)
})

test("an explicitly weighted pad pair is strong", () => {
  expect(
    isStrongConnection("pad1", "pad2", [
      {
        padIds: ["pad1", "pad2"],
        weight: 2,
        ignoreWeakConnections: true,
      },
    ]),
  ).toBe(true)
})

test("weighted connections do not weaken unrelated pad pairs", () => {
  expect(
    isStrongConnection("pad3", "pad4", [
      {
        padIds: ["pad1", "pad2"],
        weight: 2,
        ignoreWeakConnections: true,
      },
    ]),
  ).toBe(true)
})

test("ignoreWeakConnections weakens unlisted connections for participating pads", () => {
  expect(
    isStrongConnection("pad1", "pad3", [
      {
        padIds: ["pad1", "pad2"],
        weight: 2,
        ignoreWeakConnections: true,
      },
    ]),
  ).toBe(false)
})

test("participating pads keep unlisted connections when weak connections are allowed", () => {
  expect(
    isStrongConnection("pad1", "pad3", [
      {
        padIds: ["pad1", "pad2"],
        weight: 2,
        ignoreWeakConnections: false,
      },
    ]),
  ).toBe(true)
})
