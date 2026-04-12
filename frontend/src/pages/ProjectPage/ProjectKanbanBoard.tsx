import { formatBoardTaskKey } from '@entities/task/lib/boardTaskKey'
import { KANBAN_STATUS_ORDER } from '@entities/task/lib/kanbanStatusOrder'
import type { Task, TaskStatus } from '@entities/task/model/types'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Tag } from 'antd'
import { Calendar } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatTaskDate,
  getTaskPriorityTag,
  getTaskStatusOptions,
} from '@entities/task/lib/presentation'

import {
  KanbanBoard,
  KanbanColumn,
  KanbanColumnBody,
  KanbanColumnCount,
  KanbanColumnHeader,
  KanbanColumnTitle,
  TaskCardButton,
  TaskCardDesc,
  TaskCardFooter,
  TaskCardKey,
  TaskCardLabels,
  TaskCardMeta,
  TaskCardTitle,
  TaskCardTop,
} from './ProjectPage.styles'

type Props = {
  projectKey: string
  tasksByStatus: Map<TaskStatus, Task[]>
  tasksFlat: Task[]
  selectedTaskId: string | null
  isDrawerOpen: boolean
  onTaskOpen: (taskId: string) => void
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

function DroppableColumn({
  status,
  statusLabel,
  columnTasks,
  children,
}: {
  status: TaskStatus
  statusLabel: string
  columnTasks: Task[]
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <KanbanColumn ref={setNodeRef} $isDropOver={isOver}>
      <KanbanColumnHeader>
        <KanbanColumnTitle>{statusLabel}</KanbanColumnTitle>
        <KanbanColumnCount>{columnTasks.length}</KanbanColumnCount>
      </KanbanColumnHeader>
      <KanbanColumnBody>{children}</KanbanColumnBody>
    </KanbanColumn>
  )
}

function DraggableTaskCard({
  task,
  projectKey,
  isSelected,
  onOpen,
}: {
  task: Task
  projectKey: string
  isSelected: boolean
  onOpen: (taskId: string) => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task } as const,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  return (
    <TaskCardButton
      ref={setNodeRef}
      type="button"
      style={style}
      $selected={isSelected}
      $dragging={isDragging}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(task.id)}
    >
      <TaskCardTop>
        <TaskCardKey>{formatBoardTaskKey(projectKey, task.key)}</TaskCardKey>
        <span style={{ lineHeight: 1 }}>{getTaskPriorityTag(task.priority)}</span>
      </TaskCardTop>
      <TaskCardTitle>{task.title}</TaskCardTitle>
      <TaskCardDesc>
        {task.description ?? t('projectDetails.tasksSection.descriptionFallback')}
      </TaskCardDesc>
      <TaskCardFooter>
        <TaskCardMeta>
          <Calendar size={14} strokeWidth={2} aria-hidden />
          <span>{formatTaskDate(task.dueDate)}</span>
        </TaskCardMeta>
        <TaskCardLabels>
          {(task.labels ?? []).slice(0, 4).map((label) => (
            <Tag key={label}>{t(`tasks.labels.${label}`, { defaultValue: label })}</Tag>
          ))}
        </TaskCardLabels>
      </TaskCardFooter>
    </TaskCardButton>
  )
}

function TaskDragPreview({ task, projectKey }: { task: Task; projectKey: string }) {
  const { t } = useTranslation()

  return (
    <TaskCardButton
      type="button"
      $selected={false}
      $dragging={false}
      style={{ cursor: 'grabbing', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: 280 }}
    >
      <TaskCardTop>
        <TaskCardKey>{formatBoardTaskKey(projectKey, task.key)}</TaskCardKey>
        <span style={{ lineHeight: 1 }}>{getTaskPriorityTag(task.priority)}</span>
      </TaskCardTop>
      <TaskCardTitle>{task.title}</TaskCardTitle>
      <TaskCardDesc>
        {task.description ?? t('projectDetails.tasksSection.descriptionFallback')}
      </TaskCardDesc>
    </TaskCardButton>
  )
}

export function ProjectKanbanBoard({
  projectKey,
  tasksByStatus,
  tasksFlat,
  selectedTaskId,
  isDrawerOpen,
  onTaskOpen,
  onTaskStatusChange,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  )

  const statusLabels = useMemo(() => {
    const opts = getTaskStatusOptions()
    const map = new Map<TaskStatus, string>()
    for (const o of opts) {
      map.set(o.value, o.label)
    }
    return map
  }, [])

  const activeTask = activeId ? tasksFlat.find((x) => x.id === activeId) ?? null : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const targetStatus = over.id as TaskStatus
    if (!KANBAN_STATUS_ORDER.includes(targetStatus)) return

    const taskId = String(active.id)
    const task = tasksFlat.find((x) => x.id === taskId)
    if (!task || task.status === targetStatus) return

    onTaskStatusChange(taskId, targetStatus)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <KanbanBoard>
        {KANBAN_STATUS_ORDER.map((status) => {
          const columnTasks = tasksByStatus.get(status) ?? []
          const statusLabel = statusLabels.get(status) ?? status

          return (
            <DroppableColumn
              key={status}
              status={status}
              statusLabel={statusLabel}
              columnTasks={columnTasks}
            >
              {columnTasks.map((task) => {
                const isSelected = isDrawerOpen && selectedTaskId === task.id
                return (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    projectKey={projectKey}
                    isSelected={isSelected}
                    onOpen={onTaskOpen}
                  />
                )
              })}
            </DroppableColumn>
          )
        })}
      </KanbanBoard>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? <TaskDragPreview task={activeTask} projectKey={projectKey} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
