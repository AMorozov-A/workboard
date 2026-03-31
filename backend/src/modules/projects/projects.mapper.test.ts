import type { Project } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { mapProjectToJson } from './projects.mapper';

function makeProject(overrides: Partial<Project> = {}): Project {
  const createdAt = new Date('2026-01-15T10:00:00.000Z');
  const updatedAt = new Date('2026-01-16T12:30:00.000Z');
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    key: 'proj-1',
    title: 'Test',
    description: null,
    client: 'ACME',
    status: 'active',
    budget: null,
    deadline: null,
    userId: 'user-1',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('mapProjectToJson', () => {
  it('maps dates to ISO strings; null deadline → null', () => {
    const row = makeProject({
      deadline: null,
    });
    const json = mapProjectToJson(row);
    expect(json.deadline).toBeNull();
    expect(json.createdAt).toBe(row.createdAt.toISOString());
    expect(json.updatedAt).toBe(row.updatedAt.toISOString());
  });

  it('maps deadline to ISO string when set', () => {
    const d = new Date('2026-03-01T00:00:00.000Z');
    const json = mapProjectToJson(makeProject({ deadline: d }));
    expect(json.deadline).toBe(d.toISOString());
  });
});
