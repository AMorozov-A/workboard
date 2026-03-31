import {
  createTask as createTaskApi,
  deleteTask as deleteTaskApi,
  listTasksByProject,
  updateTask as updateTaskApi,
} from '@shared/api/crmV1Service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mapApiTaskToTask } from './lib/mapApiTask'
import { taskToCreateBody, taskToUpdateBody } from './lib/taskToApi'
import type { Task } from './model/types'

export const projectTasksQueryKey = ['project-tasks'] as const

async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  const { items } = await listTasksByProject(projectId)
  return items.map(mapApiTaskToTask)
}

export const useProjectTasksQuery = (projectId: string) =>
  useQuery({
    queryKey: [...projectTasksQueryKey, projectId],
    queryFn: () => fetchProjectTasks(projectId),
    enabled: Boolean(projectId),
  })

export const useCreateTaskMutation = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Task) => {
      const { task: row } = await createTaskApi(taskToCreateBody(task))
      return mapApiTaskToTask(row)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...projectTasksQueryKey, projectId] })
    },
  })
}

/**
 * @param tasksQueryKey — тот же идентификатор, что в `useProjectTasksQuery(tasksQueryKey)`:
 * сегмент из URL (`project.key` или uuid), не обязательно `task.projectId` из API.
 */
export const useUpdateTaskMutation = (tasksQueryKey: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Task) => {
      const { task: row } = await updateTaskApi(task.id, taskToUpdateBody(task))
      return mapApiTaskToTask(row)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...projectTasksQueryKey, tasksQueryKey] })
    },
  })
}

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { taskId: string; tasksQueryKey: string }) => {
      await deleteTaskApi(payload.taskId)
      return payload.tasksQueryKey
    },
    onSuccess: (tasksQueryKey, variables) => {
      queryClient.setQueryData<Task[]>(
        [...projectTasksQueryKey, tasksQueryKey],
        (prev) => (prev ?? []).filter((t) => t.id !== variables.taskId)
      )
      void queryClient.invalidateQueries({ queryKey: [...projectTasksQueryKey, tasksQueryKey] })
    },
  })
}
