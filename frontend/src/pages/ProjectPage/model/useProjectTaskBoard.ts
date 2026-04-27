import type { Task } from '@entities/task/model/types'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

export type TasksViewMode = 'kanban' | 'table'
export type TasksTableSectionGroup = 'status' | 'priority' | 'sprint'

const TASKS_VIEW_STORAGE_KEY = 'crm:projectTasksView'
const TASKS_TABLE_GROUP_STORAGE_KEY = 'crm:projectTasksTableGroup'

const isTasksViewMode = (value: unknown): value is TasksViewMode =>
  value === 'kanban' || value === 'table'

const isTasksTableSectionGroup = (value: unknown): value is TasksTableSectionGroup =>
  value === 'status' || value === 'priority' || value === 'sprint'

function readStoredTasksView(): TasksViewMode | null {
  try {
    const raw = localStorage.getItem(TASKS_VIEW_STORAGE_KEY)
    return isTasksViewMode(raw) ? raw : null
  } catch {
    return null
  }
}

function storeTasksView(value: TasksViewMode) {
  try {
    localStorage.setItem(TASKS_VIEW_STORAGE_KEY, value)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[ProjectPage] Failed to store tasks view mode', e)
    }
  }
}

function readStoredTasksTableGroup(): TasksTableSectionGroup | null {
  try {
    const raw = localStorage.getItem(TASKS_TABLE_GROUP_STORAGE_KEY)
    return isTasksTableSectionGroup(raw) ? raw : null
  } catch {
    return null
  }
}

function storeTasksTableGroup(value: TasksTableSectionGroup) {
  try {
    localStorage.setItem(TASKS_TABLE_GROUP_STORAGE_KEY, value)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.debug('[ProjectPage] Failed to store tasks table group', e)
    }
  }
}

function computeDueDateForSprintGroup(groupKey: string): string | undefined {
  const today = dayjs().startOf('day')
  switch (groupKey) {
    case 'overdue':
      return today.subtract(1, 'day').format('YYYY-MM-DD')
    case 'this_week':
      return today.format('YYYY-MM-DD')
    case 'next_week':
      return today.add(7, 'day').format('YYYY-MM-DD')
    default:
      return undefined
  }
}

type UseProjectTaskBoardArgs = {
  tasks: Task[]
  onCreateTask: (task: Task) => Promise<void>
  onUpdateTask: (task: Task) => Promise<void>
}

export function useProjectTaskBoard({ tasks, onCreateTask, onUpdateTask }: UseProjectTaskBoardArgs) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit' | null>(null)
  const isTaskModalOpen = taskModalMode !== null

  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all')
  const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<string[]>([])

  const [tasksView, setTasksView] = useState<TasksViewMode>(() => readStoredTasksView() ?? 'kanban')
  const [tasksTableGroup, setTasksTableGroup] = useState<TasksTableSectionGroup>(
    () => readStoredTasksTableGroup() ?? 'status',
  )

  const [tableActiveTaskId, setTableActiveTaskId] = useState<string | null>(null)
  const [isTableDragging, setIsTableDragging] = useState(false)

  const setTasksViewPersisted = (next: TasksViewMode) => {
    setTasksView(next)
    storeTasksView(next)
  }

  const setTasksTableGroupPersisted = (next: TasksTableSectionGroup) => {
    setTasksTableGroup(next)
    storeTasksTableGroup(next)

    if (next === 'status') setStatusFilter('all')
    if (next === 'priority') setPriorityFilter('all')
  }

  const openCreateTaskModal = () => {
    setSelectedTaskId(null)
    setTaskModalMode('create')
  }

  const handleCreateTask = async (task: Task) => {
    await onCreateTask(task)
  }

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setTaskModalMode('edit')
  }

  const handleCloseTaskModal = () => {
    setTaskModalMode(null)
  }

  const handleResetFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const handleTableDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    setTableActiveTaskId(id)
    setIsTableDragging(true)
  }

  const handleTableDragEnd = async (event: DragEndEvent) => {
    setIsTableDragging(false)
    setTableActiveTaskId(null)

    const { active, over } = event
    if (!over) return

    const overId = String(over.id)
    if (!overId.startsWith('group:')) return

    const taskId = String(active.id)
    const task = tasks.find((x) => x.id === taskId)
    if (!task) return

    const groupKey = overId.replace(/^group:/, '')

    if (tasksTableGroup === 'status') {
      const nextStatus = groupKey as Task['status']
      if (task.status === nextStatus) return
      await onUpdateTask({ ...task, status: nextStatus })
      return
    }

    if (tasksTableGroup === 'priority') {
      const nextPriority = groupKey as Task['priority']
      if (task.priority === nextPriority) return
      await onUpdateTask({ ...task, priority: nextPriority })
      return
    }

    const nextDueDate = computeDueDateForSprintGroup(groupKey)
    if (task.dueDate === nextDueDate) return
    await onUpdateTask({ ...task, dueDate: nextDueDate })
  }

  const handleTableDragCancel = () => {
    setIsTableDragging(false)
    setTableActiveTaskId(null)
  }

  const handleTaskDeleted = () => {
    setSelectedTaskId(null)
  }

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((x) => x.id === selectedTaskId) ?? null : null),
    [selectedTaskId, tasks],
  )

  return {
    selectedTaskId,
    selectedTask,
    taskModalMode,
    isTaskModalOpen,
    openCreateTaskModal,
    handleCreateTask,
    handleOpenTask,
    handleCloseTaskModal,

    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    collapsedSectionKeys,
    setCollapsedSectionKeys,

    tasksView,
    setTasksViewPersisted,
    tasksTableGroup,
    setTasksTableGroupPersisted,
    handleResetFilters,

    tableActiveTaskId,
    isTableDragging,
    handleTableDragStart,
    handleTableDragEnd,
    handleTableDragCancel,
    handleTaskDeleted,
  }
}

