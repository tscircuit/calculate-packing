export const createColorMapFromStrings = (strings: string[]) => {
  const colorMap: Record<string, string> = {}
  for (let i = 0; i < strings.length; i++) {
    colorMap[strings[i]!] = `hsl(${(i * 300) / strings.length}, 100%, 50%)`
  }
  return colorMap
}
