import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../db/client';
import { getProjectForUser } from './projects.service';

const userId = 'user-uuid-1';
const projectRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  key: 'proj-1',
  title: 'P',
  userId,
};

describe('getProjectForUser', () => {
  beforeEach(() => {
    vi.spyOn(prisma.project, 'findFirst');
    vi.spyOn(prisma.task, 'count');
    vi.mocked(prisma.task.count).mockResolvedValue(0 as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds by uuid when ref is a UUID', async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValueOnce(projectRow as never);
    const p = await getProjectForUser(projectRow.id, userId);
    expect(p).toMatchObject({
      ...projectRow,
      tasksCount: 0,
      tasksDoneCount: 0,
      progress: 0,
    });
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: projectRow.id, userId },
      include: { tags: true },
    });
  });

  it('throws 404 when uuid project not found', async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValueOnce(null);
    await expect(getProjectForUser(projectRow.id, userId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Проект не найден',
    });
    expect(prisma.project.findFirst).toHaveBeenCalledTimes(1);
  });

  it('finds by key when ref is not a UUID', async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValueOnce(projectRow as never);
    const p = await getProjectForUser('proj-1', userId);
    expect(p).toMatchObject({
      ...projectRow,
      tasksCount: 0,
      tasksDoneCount: 0,
      progress: 0,
    });
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { key: 'proj-1', userId },
      include: { tags: true },
    });
  });

  it('throws 404 when key not found', async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    await expect(getProjectForUser('proj-99', userId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Проект не найден',
    });
  });
});
