export const createColorMapFromStrings = (strings: string[]) => {
  const colorMap: Record<string, string> = {}
  for (let i = 0; i < strings.length; i++) {
    colorMap[strings[i]!] = `hsl(${(i * 300) / strings.length}, 100%, 50%)`
  }
  return colorMap
}

export const getColorForString = (string: string, alpha = 1) => {
  // pseudo random number from string
  const hash = string.split("").reduce((acc, char) => {
    return acc * 31 + char.charCodeAt(0)
  }, 0)
  return `hsl(${hash % 360}, 100%, 50%, ${alpha})`
}
