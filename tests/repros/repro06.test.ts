import { expect, test } from "bun:test"
import { pack } from "lib/index"
import input from "site/repros/repro06.json"

test("repro06 - boolean operation error", () => {
  pack(input as any)
})
