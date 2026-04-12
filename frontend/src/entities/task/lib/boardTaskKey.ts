export function formatBoardTaskKey(projectKey: string, taskKey: string): string {
  const prefixMatch = projectKey.match(/^([a-zA-Z]+)/)
  const prefix =
    prefixMatch?.[1]?.toUpperCase() ??
    (projectKey.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'TASK')
  const taskNum = taskKey.match(/(\d+)/)?.[1] ?? taskKey
  return `${prefix}-${taskNum}`
}
