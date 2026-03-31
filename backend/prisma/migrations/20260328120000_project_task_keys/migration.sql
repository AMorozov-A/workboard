-- AlterTable
ALTER TABLE "Project" ADD COLUMN "key" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "key" TEXT;

-- Backfill Project.key: proj-{n} per user ordered by createdAt
UPDATE "Project" SET "key" = (
  SELECT 'proj-' || COUNT(*)
  FROM "Project" p2
  WHERE p2."userId" = "Project"."userId"
    AND (p2."createdAt" < "Project"."createdAt"
      OR (p2."createdAt" = "Project"."createdAt" AND p2."id" <= "Project"."id"))
)
WHERE "key" IS NULL;

-- Backfill Task.key: task-{n} per project
UPDATE "Task" SET "key" = (
  SELECT 'task-' || COUNT(*)
  FROM "Task" t2
  WHERE t2."projectId" = "Task"."projectId"
    AND (t2."createdAt" < "Task"."createdAt"
      OR (t2."createdAt" = "Task"."createdAt" AND t2."id" <= "Task"."id"))
)
WHERE "key" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_key_key" ON "Project"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Task_projectId_key_key" ON "Task"("projectId", "key");
