import { useProjectQuery, useUpdateProjectMutation } from '@entities/project/api'
import { getProjectStatusOptions, getProjectStatusTag } from '@entities/project/lib/presentation'
import {
  useCreateTaskMutation,
  useProjectTasksQuery,
  useUpdateTaskMutation,
} from '@entities/task/api'
import {
  getTaskPriorityOptions,
  getTaskPriorityTag,
  getTaskStatusOptions,
  getTaskStatusLabel,
  getTaskStatusTag,
} from '@entities/task/lib/presentation'
import { KANBAN_STATUS_ORDER } from '@entities/task/lib/kanbanStatusOrder'
import { getTaskSprintBucket, SPRINT_BUCKET_ORDER } from '@entities/task/lib/sprintBuckets'
import type { Task, TaskPriority, TaskStatus } from '@entities/task/model/types'
import { CreateTaskButton } from '@features/task/create'
import { routes } from '@shared/config/routes'
import { getUserInitials } from '@shared/lib/getUserInitials'
import { useAppSelector } from '@app/store/hooks'
import { ContentState, GroupedSections, notifyError, notifySuccess } from '@shared/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, DatePicker, Divider, Input, InputNumber, Popover, Select, Skeleton, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleAlert,
  Clock,
  Eye,
  Filter,
  LayoutGrid,
  Loader2,
  Minus,
  TriangleAlert,
  Plus,
  Table2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TaskModalWidget } from '@widgets/task/TaskModalWidget'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  BreadcrumbCurrent,
  ProjectBreadcrumb,
  ProjectBreadcrumbRight,
  ProjectBreadcrumbRow,
  ProjectBreadcrumbLeft,
  ProjectHeaderRow,
  ProjectPageDescription,
  ProjectPageTitle,
  ProjectTitleBlock,
  ProjectTitleRow,
  InlineBodyField,
  InlineEditControl,
  InlineEditText,
  InlineTitleField,
  TasksTableShell,
  TasksToolbar,
} from './ProjectPage.styles'
import { ProjectKanbanBoard } from './ProjectKanbanBoard'
import {
  type TasksTableSectionGroup,
  useProjectTaskBoard,
} from './model/useProjectTaskBoard'

type ProjectEditFormValues = {
  name: string
  client: string
  status: 'active' | 'paused' | 'done'
  budget: number | null | undefined
  deadline?: Dayjs | null
  description?: string
}

type EditableProjectField = keyof Pick<
  ProjectEditFormValues,
  'name' | 'description' | 'client' | 'status' | 'budget' | 'deadline'
>

function formatTaskMonthDay(value?: string): string {
  if (!value) return '—'
  const date = dayjs(value)
  if (!date.isValid()) return '—'
  return date.format('MMM D')
}

function getStatusHeaderMeta(status: TaskStatus): {
  color: string
  Icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
} {
  if (status === 'in_progress') return { color: 'var(--color-primary)', Icon: Loader2 }
  if (status === 'review') return { color: 'var(--color-warning)', Icon: Eye }
  if (status === 'done') return { color: 'var(--color-success)', Icon: CheckCircle2 }
  return { color: 'var(--color-text-muted)', Icon: Circle }
}

function getPriorityHeaderMeta(priority: TaskPriority): {
  color: string
  Icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
} {
  if (priority === 'high') return { color: 'var(--color-priority-high)', Icon: CircleAlert }
  if (priority === 'medium') return { color: 'var(--color-priority-medium)', Icon: Minus }
  return { color: 'var(--color-text-muted)', Icon: Circle }
}

function getSprintHeaderMeta(bucket: (typeof SPRINT_BUCKET_ORDER)[number]): {
  color: string
  Icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
} {
  if (bucket === 'overdue') return { color: 'var(--color-error)', Icon: TriangleAlert }
  if (bucket === 'this_week') return { color: 'var(--color-primary)', Icon: Calendar }
  if (bucket === 'next_week') return { color: 'var(--color-warning)', Icon: CalendarDays }
  return { color: 'var(--color-text-muted)', Icon: Clock }
}

function DroppableGroupBody({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      data-droppable-id={id}
      style={{
        borderRadius: 10,
        outline: isOver ? '2px solid var(--color-primary-border)' : '2px solid transparent',
        outlineOffset: 2,
        transition: 'outline var(--duration-mid) var(--ease-default)',
      }}
    >
      {children}
    </div>
  )
}

function DraggableTableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  const rowKey = (props as unknown as { 'data-row-key'?: string })['data-row-key']
  const draggableId = rowKey ? String(rowKey) : ''

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    disabled: !draggableId,
    data: { type: 'taskRow', taskId: draggableId } as const,
  })

  const style: React.CSSProperties = {
    ...props.style,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-dragging={isDragging ? 'true' : undefined}
    />
  )
}

export const ProjectPage = () => {
  const { t } = useTranslation()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.user)
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
    refetch: refetchProject,
  } = useProjectQuery(projectId)

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useProjectTasksQuery(projectId ?? '')

  const { mutateAsync: updateProject } = useUpdateProjectMutation()
  const createTaskMutation = useCreateTaskMutation(projectId ?? '')
  const updateTaskMutation = useUpdateTaskMutation(projectId ?? '')

  const {
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
  } = useProjectTaskBoard({
    tasks,
    onCreateTask: async (task) => {
      await createTaskMutation.mutateAsync(task)
    },
    onUpdateTask: async (task) => {
      await updateTaskMutation.mutateAsync(task)
    },
  })
  const [editingField, setEditingField] = useState<EditableProjectField | null>(null)

  const tableSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleSaveTask = async (updatedTask: Task) => {
    await updateTaskMutation.mutateAsync(updatedTask)
  }

  const validationSchema = z.object({
    name: z.string().min(1, t('projects.validation.nameRequired')),
    client: z.string().min(1, t('projects.validation.clientRequired')),
    status: z.enum(['active', 'paused', 'done']),
    budget: z.union([
      z.number().nonnegative(t('projects.validation.budgetNonNegative')),
      z.null(),
      z.undefined(),
    ]),
    deadline: z.custom<Dayjs | null>((value) => value == null || dayjs.isDayjs(value)).optional(),
    description: z.string().optional(),
  })

  const {
    control: projectControl,
    handleSubmit: handleProjectSubmit,
    reset: resetProjectForm,
    getValues: getProjectValues,
    formState: {
      errors: projectErrors,
      isDirty: isProjectDirty,
      isSubmitting: isProjectSubmitting,
      isValid: isProjectValid,
    },
  } = useForm<ProjectEditFormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      client: '',
      status: 'active',
      budget: null,
      deadline: null,
      description: '',
    },
  })

  useEffect(() => {
    if (!project) return
    resetProjectForm({
      name: project.name,
      client: project.client ?? '',
      status: project.status ?? 'active',
      budget: project.budget ?? null,
      deadline: project.deadline ? dayjs(project.deadline) : null,
      description: project.description ?? '',
    })
  }, [project, resetProjectForm])

  const onSubmitProjectInline = async (values: ProjectEditFormValues) => {
    if (!project) return
    try {
      await updateProject({
        projectId: project.id,
        project: {
          ...project,
          name: values.name.trim(),
          client: values.client.trim(),
          status: values.status,
          budget: values.budget ?? undefined,
          deadline: values.deadline?.format ? values.deadline.format('YYYY-MM-DD') : undefined,
          description: values.description?.trim() || undefined,
        },
      })
      notifySuccess(
        t('projects.notifications.updatedTitle'),
        t('projects.notifications.updatedDescription'),
      )
    } catch {
      notifyError(
        t('projects.notifications.updateErrorTitle'),
        t('projects.notifications.updateErrorDescription'),
      )
    }
  }

  const trySubmitProject = async () => {
    if (!isProjectDirty) return
    if (!isProjectValid) return
    await handleProjectSubmit(onSubmitProjectInline)()
  }

  const trySubmitProjectStatus = async (nextStatus?: ProjectEditFormValues['status']) => {
    if (!project) return
    if (!isProjectValid) return

    const current = nextStatus ?? getProjectValues('status')
    const prev = project.status ?? 'active'
    if (current === prev) return

    await handleProjectSubmit(onSubmitProjectInline)()
  }

  const startEditField = (field: EditableProjectField) => {
    if (isProjectSubmitting) return
    void trySubmitProject()

    setEditingField(field)
  }

  const stopEditField = (field: EditableProjectField) => {
    if (editingField !== field) return
    setEditingField(null)
    if (field === 'status') {
      setStatusDropdownOpen(false)
    }
  }


  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const task = filteredTasks.find((x) => x.id === taskId)
    if (!task || task.status === newStatus) return
    await updateTaskMutation.mutateAsync({ ...task, status: newStatus })
  }

  const { filteredTasks, tasksByStatus } = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const isStatusMatched = statusFilter === 'all' || task.status === statusFilter
      const isPriorityMatched =
        priorityFilter === 'all' || task.priority === priorityFilter
      return isStatusMatched && isPriorityMatched
    })
    const map = new Map<TaskStatus, Task[]>()
    for (const s of KANBAN_STATUS_ORDER) {
      map.set(s, [])
    }
    for (const task of filtered) {
      const list = map.get(task.status)
      if (list) list.push(task)
    }
    return { filteredTasks: filtered, tasksByStatus: map }
  }, [priorityFilter, statusFilter, tasks])
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all'

  const renderTasksContent = () => {
    if (isTasksLoading) {
      return (
        <div style={{ width: '100%', paddingTop: 'var(--space-2)' }}>
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </div>
      )
    }

    if (isTasksError) {
      return (
        <ContentState
          variant="error"
          title={t('projectDetails.tasksSection.errorTitle')}
          description={t('projectDetails.tasksSection.errorDescription')}
          action={
            <Button type="primary" onClick={() => void refetchTasks()}>
              {t('common.retry')}
            </Button>
          }
        />
      )
    }

    if (tasks.length === 0) {
      return (
        <div data-testid="project-tasks-empty">
          <ContentState
            variant="empty"
            title={t('projectDetails.tasksSection.emptyTitle')}
            description={t('projectDetails.tasksSection.emptyDescription')}
            action={<CreateTaskButton onClick={openCreateTaskModal} />}
          />
        </div>
      )
    }

    if (filteredTasks.length === 0) {
      return (
        <ContentState
          variant="empty"
          title={t('projectDetails.tasksSection.filteredEmptyTitle')}
          description={t('projectDetails.tasksSection.filteredEmptyDescription')}
          action={
            <Button onClick={handleResetFilters}>
              {t('common.resetFilters')}
            </Button>
          }
        />
      )
    }

    if (tasksView === 'table') {
      const emptyText = t('projectDetails.tasksSection.statusGroupEmpty')

      const statusGroups = KANBAN_STATUS_ORDER.map((status) => {
        const { color, Icon } = getStatusHeaderMeta(status)
        return { key: status, label: getTaskStatusLabel(status), Icon, color, emptyText }
      })

      const priorityGroups = getTaskPriorityOptions().map((option) => {
        const { color, Icon } = getPriorityHeaderMeta(option.value)
        return { key: option.value, label: option.label, Icon, color, emptyText }
      })

      const sprintGroups = SPRINT_BUCKET_ORDER.map((k) => {
        const { color, Icon } = getSprintHeaderMeta(k)
        return { key: k, label: t(`projectDetails.tasksSection.sprintBuckets.${k}`), Icon, color, emptyText }
      })

      const tableGroups =
        tasksTableGroup === 'status'
          ? statusGroups
          : tasksTableGroup === 'priority'
            ? priorityGroups
            : sprintGroups

      const groupBy = (task: Task): string => {
        if (tasksTableGroup === 'status') return task.status
        if (tasksTableGroup === 'priority') return task.priority
        return getTaskSprintBucket(task)
      }

      const baseColumns: ColumnsType<Task> = [
        {
          title: t('projectDetails.tasksSection.columns.key'),
          dataIndex: 'key',
          className: 'crm-task-table-col-key',
          render: (value: string) => (
            <Typography.Text
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </Typography.Text>
          ),
        },
        {
          title: t('projectDetails.tasksSection.columns.task'),
          dataIndex: 'title',
          className: 'crm-task-table-col-title',
          width: '100%',
          render: (_: unknown, task: Task) => (
            <Space orientation="vertical" size={2}>
              <Typography.Text strong>{task.title}</Typography.Text>
            </Space>
          ),
        },
        {
          title: t('projectDetails.tasksSection.columns.status'),
          dataIndex: 'status',
          align: 'right',
          className: 'crm-task-table-col-status',
          width: 120,
          render: (value?: Task['status']) => getTaskStatusTag(value),
        },
        {
          title: t('projectDetails.tasksSection.columns.priority'),
          dataIndex: 'priority',
          align: 'right',
          className: 'crm-task-table-col-priority',
          width: 120,
          render: (value?: Task['priority']) => getTaskPriorityTag(value),
        },
        {
          title: t('projectDetails.tasksSection.columns.deadline'),
          dataIndex: 'dueDate',
          className: 'crm-task-table-col-deadline',
          width: 60,
          render: (value?: string) => formatTaskMonthDay(value),
        },
      ]

      const hiddenColumnByGroup: Record<TasksTableSectionGroup, string> = {
        status: 'status',
        priority: 'priority',
        sprint: 'dueDate',
      }

      const hiddenDataIndex = hiddenColumnByGroup[tasksTableGroup]
      const columns = baseColumns.filter((c) =>
        'dataIndex' in c ? c.dataIndex !== hiddenDataIndex : true
      )

      return (
        <TasksTableShell>
          <DndContext
            sensors={tableSensors}
            collisionDetection={closestCorners}
            onDragStart={handleTableDragStart}
            onDragEnd={(e) => void handleTableDragEnd(e)}
            onDragCancel={handleTableDragCancel}
          >
            <GroupedSections<Task, string>
              groups={tableGroups}
              items={filteredTasks}
              groupBy={groupBy}
              collapsedKeys={collapsedSectionKeys}
              onCollapsedKeysChange={setCollapsedSectionKeys}
              renderGroupBody={({ groupItems, group }) =>
                groupItems.length === 0 ? (
                  <DroppableGroupBody id={`group:${group.key}`}>
                    <div style={{ padding: '6px 0' }}>
                      <Typography.Text type="secondary">{group.emptyText}</Typography.Text>
                    </div>
                  </DroppableGroupBody>
                ) : (
                  <DroppableGroupBody id={`group:${group.key}`}>
                    <Table<Task>
                      rowKey="id"
                      dataSource={groupItems}
                      pagination={false}
                      showHeader={false}
                      tableLayout="auto"
                      onRow={(record) => ({
                        onClick: () => {
                          if (isTableDragging) return
                          handleOpenTask(record.id)
                        },
                        style: { cursor: 'pointer' },
                      })}
                      components={{
                        body: {
                          row: DraggableTableRow,
                        },
                      }}
                      columns={columns}
                    />
                  </DroppableGroupBody>
                )
              }
            />

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {tableActiveTaskId ? (
                <div
                  style={{
                    padding: '4px 0',
                    maxWidth: 340,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 10,
                      background: 'color-mix(in srgb, var(--color-primary-bg) 20%, transparent)',
                    }}
                  >
                    <Typography.Text strong ellipsis>
                    {tasks.find((x) => x.id === tableActiveTaskId)?.title ?? ''}
                    </Typography.Text>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </TasksTableShell>
      )
    }

    return (
      <ProjectKanbanBoard
        projectKey={project?.key ?? ''}
        tasksByStatus={tasksByStatus}
        tasksFlat={filteredTasks}
        selectedTaskId={selectedTaskId}
        isDrawerOpen={isTaskModalOpen}
        onTaskOpen={handleOpenTask}
        onTaskStatusChange={(taskId, newStatus) => {
          void handleTaskStatusChange(taskId, newStatus)
        }}
      />
    )
  }

  if (!projectId) {
    return null
  }

  if (isProjectLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Space orientation="vertical" size={24} style={{ display: 'flex' }}>
          <div>
            <Typography.Text strong>{t('projectDetails.loadingTitle')}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              {t('projectDetails.loadingDescription')}
            </Typography.Paragraph>
          </div>
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Space>
      </div>
    )
  }

  if (isProjectError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <ContentState
          variant="error"
          title={t('projects.error.title')}
          description={t('projects.error.description')}
          action={
            <Button type="primary" onClick={() => void refetchProject()}>
              {t('common.retry')}
            </Button>
          }
        />
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <ContentState
          variant="empty"
          title={t('projectDetails.notFoundTitle')}
          description={t('projectDetails.notFoundDescription')}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <ProjectBreadcrumbRow>
        <ProjectBreadcrumbLeft>
          <ProjectBreadcrumb
            items={[
              {
                title: (
                  <Space size={6}>
                    <Link to={routes.projects}>{t('projects.breadcrumb.workspace')}</Link>
                  </Space>
                ),
              },
              {
                title: (
                  <BreadcrumbCurrent>{project.name}</BreadcrumbCurrent>
                ),
              },
            ]}
          />
        </ProjectBreadcrumbLeft>
        <ProjectBreadcrumbRight>
          <Typography.Text
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.02em',
              color: 'var(--color-text-muted)',
            }}
          >
            {project.key}
          </Typography.Text>
          <Controller
            name="status"
            control={projectControl}
            render={({ field }) => (
              <InlineEditControl>
                <Select
                  {...field}
                  variant="borderless"
                  options={getProjectStatusOptions()}
                  disabled={isProjectSubmitting}
                  aria-label={t('projects.form.status')}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 100 }}
                  open={editingField === 'status' ? statusDropdownOpen : false}
                  suffixIcon={null}
                  labelRender={() => getProjectStatusTag(field.value)}
                  onDropdownVisibleChange={(open) => {
                    if (editingField !== 'status') return
                    setStatusDropdownOpen(open)
                    if (!open) {
                      void trySubmitProjectStatus().finally(() => stopEditField('status'))
                    }
                  }}
                  onClick={() => {
                    if (editingField !== 'status') {
                      startEditField('status')
                      setStatusDropdownOpen(true)
                    }
                  }}
                  onChange={(value) => {
                    field.onChange(value)
                    setStatusDropdownOpen(false)
                    setTimeout(() => {
                      void trySubmitProjectStatus(value).finally(() => stopEditField('status'))
                    }, 0)
                  }}
                />
              </InlineEditControl>
            )}
          />
          <Popover
            open={infoOpen}
            trigger="click"
            placement="bottomRight"
            arrow={false}
            overlayStyle={{ maxWidth: 280 }}
            onOpenChange={(open) => setInfoOpen(open)}
            align={{ offset: [-8, 8] }}
            content={
              <div style={{ maxWidth: 280 }}>
                <div
                  style={{ display: 'grid', gap: 10 }}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div>
                      <Typography.Text type="secondary">
                        {t('projectDetails.fields.client')}
                      </Typography.Text>
                      <Controller
                        name="client"
                        control={projectControl}
                        render={({ field }) => (
                          <InlineEditControl>
                            <Input
                              {...field}
                              bordered={false}
                              placeholder={t('projects.form.clientPlaceholder')}
                              disabled={isProjectSubmitting}
                              aria-label={t('projects.form.client')}
                              onBlur={() => {
                                if (projectErrors.client) return
                                void trySubmitProject()
                              }}
                            />
                          </InlineEditControl>
                        )}
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        {t('projectDetails.fields.budget')}
                      </Typography.Text>
                      <Controller
                        name="budget"
                        control={projectControl}
                        render={({ field }) => (
                          <InlineEditControl>
                            <InputNumber
                              value={field.value ?? null}
                              onChange={field.onChange}
                              variant="borderless"
                              min={0}
                              controls={false}
                              placeholder={t('projects.form.budgetPlaceholder')}
                              disabled={isProjectSubmitting}
                              aria-label={t('projects.form.budget')}
                              onBlur={() => {
                                if (projectErrors.budget) return
                                void trySubmitProject()
                              }}
                            />
                          </InlineEditControl>
                        )}
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        {t('projectDetails.fields.deadline')}
                      </Typography.Text>
                      <Controller
                        name="deadline"
                        control={projectControl}
                        render={({ field }) => (
                          <InlineEditControl>
                            <DatePicker
                              {...field}
                              variant="borderless"
                              style={{ width: '100%' }}
                              disabled={isProjectSubmitting}
                              aria-label={t('projects.form.deadline')}
                              onOpenChange={(open) => {
                                if (!open) void trySubmitProject()
                              }}
                            />
                          </InlineEditControl>
                        )}
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        {t('projectDetails.fields.tasks')}
                      </Typography.Text>
                      <div>{tasks.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <Button
              className="project-page-help-icon-button"
              type="text"
              size="small"
              aria-label={t('common.help')}
              icon={<CircleAlert size={16} aria-hidden />}
            />
          </Popover>
          <Button
            type="text"
            size="small"
            className="project-page-user-button"
            aria-label={t('layout.openSettings')}
            onClick={() => navigate(routes.profile)}
          >
            <span className="project-page-user-avatar" aria-hidden>
              {getUserInitials(currentUser?.name || currentUser?.email)}
            </span>
          </Button>
        </ProjectBreadcrumbRight>
      </ProjectBreadcrumbRow>

      <div style={{ height: 12 }} />

      <ProjectHeaderRow>
        <ProjectTitleBlock>
          <ProjectTitleRow>
            <div
              style={{
                display: 'grid',
                rowGap: 'var(--space-4)',
                width: '100%',
              }}
            >
              <Controller
                name="name"
                control={projectControl}
                render={({ field }) => (
                  editingField === 'name' ? (
                    <>
                      <InlineTitleField>
                        <InlineEditControl>
                          <Input
                            {...field}
                            autoFocus
                            bordered={false}
                            placeholder={t('projects.form.namePlaceholder')}
                            status={projectErrors.name ? 'error' : ''}
                            disabled={isProjectSubmitting}
                            aria-label={t('projects.form.name')}
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 'var(--font-size-h2)',
                              fontWeight: 600,
                              lineHeight: 1.25,
                              letterSpacing: '-0.01em',
                              color: 'var(--color-text)',
                            }}
                            onBlur={() => {
                              if (projectErrors.name) return
                              void trySubmitProject().finally(() => stopEditField('name'))
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter') return
                              e.preventDefault()
                              ;(e.currentTarget as HTMLInputElement).blur()
                            }}
                            ref={field.ref}
                          />
                        </InlineEditControl>
                      </InlineTitleField>
                      {projectErrors.name?.message ? (
                        <Typography.Text type="danger">{projectErrors.name.message}</Typography.Text>
                      ) : null}
                    </>
                  ) : (
                    <InlineTitleField>
                      <InlineEditText onClick={() => startEditField('name')} aria-label={t('projects.form.name')}>
                        <ProjectPageTitle>{field.value || t('projects.form.namePlaceholder')}</ProjectPageTitle>
                      </InlineEditText>
                    </InlineTitleField>
                  )
                )}
              />
              <Controller
                name="description"
                control={projectControl}
                render={({ field }) => (
                  editingField === 'description' ? (
                    <InlineBodyField>
                      <InlineEditControl>
                        <Input.TextArea
                          {...field}
                          autoFocus
                          bordered={false}
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          placeholder={t('projects.form.descriptionPlaceholder')}
                          disabled={isProjectSubmitting}
                          aria-label={t('projects.form.description')}
                          style={{
                            margin: 0,
                            fontSize: 'var(--font-size-body)',
                            lineHeight: 1.6,
                            color: 'var(--color-text-muted)',
                          }}
                          onBlur={() => {
                            void trySubmitProject().finally(() => stopEditField('description'))
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return
                            if (e.shiftKey) return
                            e.preventDefault()
                            ;(e.currentTarget as HTMLTextAreaElement).blur()
                          }}
                        />
                      </InlineEditControl>
                    </InlineBodyField>
                  ) : field.value ? (
                    <InlineBodyField>
                      <InlineEditText onClick={() => startEditField('description')}>
                        <ProjectPageDescription>{field.value}</ProjectPageDescription>
                      </InlineEditText>
                    </InlineBodyField>
                  ) : (
                    <InlineBodyField>
                      <InlineEditText onClick={() => startEditField('description')}>
                        <Typography.Text type="secondary">
                          {t('projects.form.descriptionPlaceholder')}
                        </Typography.Text>
                      </InlineEditText>
                    </InlineBodyField>
                  )
                )}
              />
            </div>
          </ProjectTitleRow>
        </ProjectTitleBlock>
      </ProjectHeaderRow>

      {tasks.length > 0 ? (
        <>
          <div style={{ marginTop: 8 }}>
            <TasksToolbar>
              <div />
              <Space size={2}>
                <Button
                  type="text"
                  size="small"
                  icon={<Plus size={14} aria-hidden />}
                  aria-label={t('tasks.actions.create')}
                  onClick={openCreateTaskModal}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<LayoutGrid size={14} aria-hidden />}
                  aria-label={t('projectDetails.tasksSection.viewKanban')}
                  aria-pressed={tasksView === 'kanban'}
                  onClick={() => setTasksViewPersisted('kanban')}
                  style={tasksView === 'kanban' ? { color: 'var(--color-primary)' } : undefined}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Table2 size={14} aria-hidden />}
                  aria-label={t('projectDetails.tasksSection.viewTable')}
                  aria-pressed={tasksView === 'table'}
                  onClick={() => setTasksViewPersisted('table')}
                  style={tasksView === 'table' ? { color: 'var(--color-primary)' } : undefined}
                />
                <Popover
                  open={filtersOpen}
                  trigger="click"
                  placement="bottomRight"
                  arrow={false}
                  overlayClassName="project-page-filters-popover-overlay"
                  onOpenChange={(open) => setFiltersOpen(open)}
                  content={
                    <div
                      className="project-page-filters-popover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: tasksView === 'table' ? '0 8px 8px 8px' : '8px',
                      }}
                    >
                      {tasksView === 'table' ? (
                        <Tabs
                          size="small"
                          activeKey={tasksTableGroup}
                          onChange={(key) => setTasksTableGroupPersisted(key as TasksTableSectionGroup)}
                          items={[
                            {
                              key: 'status',
                              label: t('projectDetails.tasksSection.groupByStatus'),
                              children: (
                                <Select
                                  value={priorityFilter}
                                  onChange={(value) => setPriorityFilter(value)}
                                  style={{ width: 'fit-content', maxWidth: 240 }}
                                  size="small"
                                  variant="borderless"
                                  dropdownMatchSelectWidth={false}
                                  dropdownStyle={{ minWidth: 180 }}
                                  className="project-page-filter-select"
                                  options={[
                                    {
                                      value: 'all',
                                      label: t('projectDetails.tasksSection.allPriorities'),
                                    },
                                    ...getTaskPriorityOptions(),
                                  ]}
                                />
                              ),
                            },
                            {
                              key: 'priority',
                              label: t('projectDetails.tasksSection.groupByPriority'),
                              children: (
                                <Select
                                  value={statusFilter}
                                  onChange={(value) => setStatusFilter(value)}
                                  style={{ width: 'fit-content', maxWidth: 240 }}
                                  size="small"
                                  variant="borderless"
                                  dropdownMatchSelectWidth={false}
                                  dropdownStyle={{ minWidth: 180 }}
                                  className="project-page-filter-select"
                                  options={[
                                    {
                                      value: 'all',
                                      label: t('projectDetails.tasksSection.allStatuses'),
                                    },
                                    ...getTaskStatusOptions(),
                                  ]}
                                />
                              ),
                            },
                            {
                              key: 'sprint',
                              label: t('projectDetails.tasksSection.groupBySprint'),
                              children: (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <Select
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
                                    style={{ width: 'fit-content', maxWidth: 240 }}
                                    size="small"
                                    variant="borderless"
                                    dropdownMatchSelectWidth={false}
                                    dropdownStyle={{ minWidth: 180 }}
                                    className="project-page-filter-select"
                                    options={[
                                      {
                                        value: 'all',
                                        label: t('projectDetails.tasksSection.allStatuses'),
                                      },
                                      ...getTaskStatusOptions(),
                                    ]}
                                  />
                                  <Select
                                    value={priorityFilter}
                                    onChange={(value) => setPriorityFilter(value)}
                                    style={{ width: 'fit-content', maxWidth: 240 }}
                                    size="small"
                                    variant="borderless"
                                    dropdownMatchSelectWidth={false}
                                    dropdownStyle={{ minWidth: 180 }}
                                    className="project-page-filter-select"
                                    options={[
                                      {
                                        value: 'all',
                                        label: t('projectDetails.tasksSection.allPriorities'),
                                      },
                                      ...getTaskPriorityOptions(),
                                    ]}
                                  />
                                </div>
                              ),
                            },
                          ]}
                        />
                      ) : (
                        <>
                          <Select
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value)}
                            style={{ width: 'fit-content', maxWidth: 240 }}
                            size="small"
                            variant="borderless"
                            dropdownMatchSelectWidth={false}
                            dropdownStyle={{ minWidth: 180 }}
                            className="project-page-filter-select"
                            options={[
                              { value: 'all', label: t('projectDetails.tasksSection.allStatuses') },
                              ...getTaskStatusOptions(),
                            ]}
                          />
                          <Select
                            value={priorityFilter}
                            onChange={(value) => setPriorityFilter(value)}
                            style={{ width: 'fit-content', maxWidth: 240 }}
                            size="small"
                            variant="borderless"
                            dropdownMatchSelectWidth={false}
                            dropdownStyle={{ minWidth: 180 }}
                            className="project-page-filter-select"
                            options={[
                              {
                                value: 'all',
                                label: t('projectDetails.tasksSection.allPriorities'),
                              },
                              ...getTaskPriorityOptions(),
                            ]}
                          />
                        </>
                      )}
                      {hasActiveFilters ? (
                        <Button
                          type="text"
                          size="small"
                          onClick={() => {
                            handleResetFilters()
                            setFiltersOpen(false)
                          }}
                          icon={<X size={16} aria-hidden />}
                          style={{ justifySelf: 'end' }}
                        >
                          {t('common.resetFilters')}
                        </Button>
                      ) : null}
                    </div>
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<Filter size={14} aria-hidden />}
                    aria-label="Filters"
                  />
                </Popover>
              </Space>
            </TasksToolbar>
          </div>
          <Divider style={{ margin: '12px 0' }} />
        </>
      ) : null}
      {renderTasksContent()}

      <TaskModalWidget
        open={isTaskModalOpen}
        mode={taskModalMode ?? 'create'}
        task={taskModalMode === 'edit' ? selectedTask : null}
        projectId={project.id}
        tasksQueryKey={projectId ?? ''}
        onClose={handleCloseTaskModal}
        onCreate={handleCreateTask}
        onSave={handleSaveTask}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  )
}
