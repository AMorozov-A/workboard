-- AlterTable
ALTER TABLE "Project" ADD COLUMN "taskKeyPrefix" TEXT NOT NULL DEFAULT 'T';

-- Backfill: derive taskKeyPrefix from Project.key prefix (e.g. "t-1" -> "T")
UPDATE "Project"
SET "taskKeyPrefix" = UPPER(
  CASE
    WHEN INSTR("key", '-') > 0 THEN SUBSTR("key", 1, INSTR("key", '-') - 1)
    ELSE "key"
  END
)
WHERE "taskKeyPrefix" = 'T' AND "key" IS NOT NULL AND "key" != '';

