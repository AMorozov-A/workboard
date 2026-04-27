/**
 * Мин. длительность «загрузки» для списков в демо (мс).
 * VITEST → 0; иначе VITE_* из env; иначе в dev 800, в prod 0.
 */
export function getDemoListMinDelayMs(viteOverride: string | undefined): number {
  if (import.meta.env.VITEST) {
    return 0
  }
  if (viteOverride !== undefined && String(viteOverride) !== '') {
    const n = Number(viteOverride)
    if (Number.isFinite(n) && n >= 0) {
      return n
    }
  }
  return import.meta.env.DEV ? 800 : 0
}

/** Параллелит запрос с таймером, чтобы итог занял не меньше minMs. */
export async function withMinDuration<T>(minMs: number, load: () => Promise<T>): Promise<T> {
  if (minMs <= 0) {
    return load()
  }
  const [value] = await Promise.all([load(), new Promise<void>((r) => setTimeout(r, minMs))])
  return value
}
