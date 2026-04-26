const PALETTE = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-text-muted)',
] as const

const hashString = (value: string) => {
  // djb2-ish: fast, deterministic, good enough for palette indexing
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return hash >>> 0
}

export const stableColorFromKey = (seed: string) => {
  const s = seed.trim()
  const idx = hashString(s || 'default') % PALETTE.length
  return PALETTE[idx]
}

