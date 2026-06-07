import type { Request, Response } from 'express';
import { mapChecklistItemToJson } from './checklist.mapper';
import * as checklistService from './checklist.service';

function userId(req: Request): string {
  return req.user!.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const rows = await checklistService.listChecklistItems(taskId, userId(req));
  res.status(200).json({ ok: true, items: rows.map(mapChecklistItemToJson) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const input = checklistService.parseCreateChecklistBody(req.body);
  const row = await checklistService.createChecklistItem(taskId, userId(req), input);
  res.status(201).json({ ok: true, item: mapChecklistItemToJson(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { taskId, itemId } = req.params;
  const input = checklistService.parseUpdateChecklistBody(req.body);
  const row = await checklistService.updateChecklistItem(taskId, itemId, userId(req), input);
  res.status(200).json({ ok: true, item: mapChecklistItemToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { taskId, itemId } = req.params;
  await checklistService.deleteChecklistItem(taskId, itemId, userId(req));
  res.status(204).send();
}

