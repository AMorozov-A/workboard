import { describe, expect, it } from 'vitest'
import { stableColorFromKey } from './stableColorFromKey'

describe('stableColorFromKey', () => {
  it('returns deterministic value for same seed', () => {
    const a = stableColorFromKey('todo')
    const b = stableColorFromKey('todo')
    expect(a).toBe(b)
  })

  it('handles blank seed', () => {
    expect(stableColorFromKey('')).toBeTruthy()
    expect(stableColorFromKey('   ')).toBeTruthy()
  })
})

