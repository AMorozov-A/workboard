export function getProjectInitials(name: string, keyFallback: string): string {
  const trimmed = name.trim()
  if (trimmed.length >= 1) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const a = parts[0][0] ?? ''
      const b = parts[1][0] ?? ''
      return `${a}${b}`.toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }

  const alnum = keyFallback.replace(/[^a-zA-Z0-9]/g, '')
  if (alnum.length >= 2) {
    return alnum.slice(0, 2).toUpperCase()
  }

  const slice = keyFallback.slice(0, 2).toUpperCase()
  return slice || '?'
}
