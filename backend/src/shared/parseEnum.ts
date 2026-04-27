export function parseEnum<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  options: { fallback?: T; throwError: () => never },
): T {
  if (value === undefined || value === null) {
    if (options.fallback !== undefined) return options.fallback
    return options.throwError()
  }

  if (typeof value === 'string') {
    const candidate = value as T
    if (allowed.includes(candidate)) return candidate
  }

  return options.throwError()
}

