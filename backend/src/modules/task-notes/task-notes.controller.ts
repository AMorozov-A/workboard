import type { Request, Response } from 'express';
import * as taskNotesService from './task-notes.service';
import { mapTaskNoteToJson } from './task-notes.mapper';

function userId(req: Request): string {
  return req.user!.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const rows = await taskNotesService.listNotesByTask(taskId, userId(req));
  res.status(200).json({
    ok: true,
    items: rows.map(mapTaskNoteToJson),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params;
  const dto = taskNotesService.parseCreateTaskNoteBody(req.body);
  const row = await taskNotesService.createNote(taskId, userId(req), dto);
  res.status(201).json({ ok: true, note: mapTaskNoteToJson(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { taskId, noteId } = req.params;
  const dto = taskNotesService.parseUpdateTaskNoteBody(req.body);
  const row = await taskNotesService.updateNote(taskId, noteId, userId(req), dto);
  res.status(200).json({ ok: true, note: mapTaskNoteToJson(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { taskId, noteId } = req.params;
  await taskNotesService.deleteNote(taskId, noteId, userId(req));
  res.status(204).send();
}
