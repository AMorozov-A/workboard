export function getUserInitials(nameOrEmail: string | null | undefined): string {
  const raw = (nameOrEmail ?? '').trim()
  if (!raw) return '?'

  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }

  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
}

