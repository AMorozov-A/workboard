import type { Request, Response } from 'express';
import * as tagsService from './tags.service';
import { mapTagToJson } from './tags.mapper';

function userId(req: Request): string {
  return req.user!.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  const rows = await tagsService.listTagsForUser(userId(req));
  res.status(200).json({ ok: true, items: rows.map(mapTagToJson) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = tagsService.parseCreateTagBody(req.body);
  const row = await tagsService.createTag(userId(req), input);
  res.status(201).json({ ok: true, tag: mapTagToJson(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = tagsService.parseUpdateTagBody(req.body);
  const row = await tagsService.updateTag(req.params.id, userId(req), input);
  res.status(200).json({ ok: true, tag: mapTagToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await tagsService.deleteTag(req.params.id, userId(req));
  res.status(204).send();
}

