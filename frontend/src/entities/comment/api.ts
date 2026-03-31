import { listCommentsByTask } from '@shared/api/crmV1Service'
import { useQuery } from '@tanstack/react-query'

export const taskCommentsQueryKey = (taskId: string) => ['comments', 'task', taskId] as const

export const useTaskCommentsQuery = (taskId: string | undefined) =>
  useQuery({
    queryKey: taskCommentsQueryKey(taskId ?? ''),
    queryFn: () => listCommentsByTask(taskId!),
    enabled: Boolean(taskId),
  })
