import type { Request, Response } from 'express';
import * as tasksService from './tasks.service';
import { mapTaskToJson } from './tasks.mapper';

function userId(req: Request): string {
  return req.user!.userId;
}

export async function listByProject(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { projectId: resolvedProjectId, rows } = await tasksService.listTasksForProject(
    projectId,
    userId(req),
  );
  res.status(200).json({
    ok: true,
    projectId: resolvedProjectId,
    items: rows.map(mapTaskToJson),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = tasksService.parseCreateTaskBody(req.body);
  const row = await tasksService.createTask(userId(req), input);
  res.status(201).json({ ok: true, task: mapTaskToJson(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = tasksService.parseUpdateTaskBody(req.body);
  const row = await tasksService.updateTask(req.params.id, userId(req), input);
  res.status(200).json({ ok: true, task: mapTaskToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await tasksService.deleteTask(req.params.id, userId(req));
  res.status(204).send();
}
