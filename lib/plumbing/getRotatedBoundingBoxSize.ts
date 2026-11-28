export const getRotatedBoundingBoxSize = (opts: {
  width: number
  height: number
  ccwRotationDegrees: number
}) => {
  const { width, height, ccwRotationDegrees } = opts
  const angleRad = (ccwRotationDegrees * Math.PI) / 180
  const rawAbsCos = Math.abs(Math.cos(angleRad))
  const rawAbsSin = Math.abs(Math.sin(angleRad))
  const absCos =
    rawAbsCos < 1e-12 ? 0 : Math.abs(rawAbsCos - 1) < 1e-12 ? 1 : rawAbsCos
  const absSin =
    rawAbsSin < 1e-12 ? 0 : Math.abs(rawAbsSin - 1) < 1e-12 ? 1 : rawAbsSin

  return {
    width: width * absCos + height * absSin,
    height: width * absSin + height * absCos,
  }
}
