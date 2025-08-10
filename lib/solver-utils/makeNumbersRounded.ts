export const makeNumbersRounded = (obj: any): any => {
  if (typeof obj === "number") {
    return Math.round(obj * 100) / 100
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        makeNumbersRounded(value),
      ]),
    )
  }
  return obj
}
