import type { Request, Response } from 'express';
import * as projectsService from './projects.service';
import { mapProjectToJson } from './projects.mapper';

function userId(req: Request): string {
  return req.user!.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  const rows = await projectsService.listProjectsForUser(userId(req));
  res.status(200).json({ ok: true, items: rows.map(mapProjectToJson) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const row = await projectsService.getProjectForUser(req.params.id, userId(req));
  res.status(200).json({ ok: true, project: mapProjectToJson(row) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = projectsService.parseCreateProjectBody(req.body);
  const row = await projectsService.createProject(userId(req), input);
  res.status(201).json({ ok: true, project: mapProjectToJson(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = projectsService.parseUpdateProjectBody(req.body);
  const row = await projectsService.updateProject(req.params.id, userId(req), input);
  res.status(200).json({ ok: true, project: mapProjectToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await projectsService.deleteProject(req.params.id, userId(req));
  res.status(204).send();
}
