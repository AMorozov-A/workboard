import type { Tag as PrismaTag } from '@prisma/client';
import type { TagJson } from './tag.types';

export function mapTagToJson(t: PrismaTag): TagJson {
  return {
    id: t.id,
    name: t.name,
    color: t.color,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

