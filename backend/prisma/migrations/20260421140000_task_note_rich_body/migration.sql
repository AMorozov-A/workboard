-- Migrate TaskNote.body (String) to structured rich payload
-- Adds bodyJson (tiptap doc), bodyText (plain text index) and schemaVersion.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_TaskNote" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "key"           TEXT NOT NULL,
    "title"         TEXT,
    "bodyJson"      JSONB NOT NULL,
    "bodyText"      TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "taskId"        TEXT NOT NULL,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy legacy data treating the old body as plain text paragraph.
-- Even if legacy body contains a tiptap JSON string, rendering it as plain text
-- is acceptable for existing notes (they will be re-serialized on next edit).
INSERT INTO "new_TaskNote" ("id", "key", "title", "bodyJson", "bodyText", "schemaVersion", "taskId", "createdAt")
SELECT
    "id",
    "key",
    "title",
    json_object(
        'type', 'doc',
        'content', json_array(
            json_object(
                'type', 'paragraph',
                'content', json_array(
                    json_object(
                        'type', 'text',
                        'text', "body"
                    )
                )
            )
        )
    ),
    "body",
    1,
    "taskId",
    "createdAt"
FROM "TaskNote";

DROP TABLE "TaskNote";
ALTER TABLE "new_TaskNote" RENAME TO "TaskNote";

CREATE INDEX "TaskNote_taskId_idx" ON "TaskNote"("taskId");
CREATE UNIQUE INDEX "TaskNote_taskId_key_key" ON "TaskNote"("taskId", "key");

PRAGMA foreign_keys=ON;
