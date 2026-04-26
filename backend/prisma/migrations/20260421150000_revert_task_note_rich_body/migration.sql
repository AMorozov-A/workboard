PRAGMA foreign_keys=OFF;

CREATE TABLE "new_TaskNote" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "key"       TEXT NOT NULL,
    "title"     TEXT,
    "body"      TEXT NOT NULL,
    "taskId"    TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_TaskNote" ("id", "key", "title", "body", "taskId", "createdAt")
SELECT "id", "key", "title", COALESCE("bodyText", ''), "taskId", "createdAt"
FROM "TaskNote";

DROP TABLE "TaskNote";
ALTER TABLE "new_TaskNote" RENAME TO "TaskNote";

CREATE INDEX "TaskNote_taskId_idx" ON "TaskNote"("taskId");
CREATE UNIQUE INDEX "TaskNote_taskId_key_key" ON "TaskNote"("taskId", "key");

PRAGMA foreign_keys=ON;
