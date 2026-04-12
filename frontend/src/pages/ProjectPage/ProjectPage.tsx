import { useProjectQuery, useUpdateProjectMutation } from '@entities/project/api'
import { getProjectStatusTag } from '@entities/project/lib/presentation'
import type { Project } from '@entities/project/types'
import {
  useCreateTaskMutation,
  useProjectTasksQuery,
  useUpdateTaskMutation,
} from '@entities/task/api'
import {
  formatTaskDate,
  getTaskPriorityOptions,
  getTaskPriorityTag,
  getTaskStatusOptions,
  getTaskStatusTag,
} from '@entities/task/lib/presentation'
import { KANBAN_STATUS_ORDER } from '@entities/task/lib/kanbanStatusOrder'
import type { Task, TaskStatus } from '@entities/task/model/types'
import type { TimelineEvent } from '@entities/timeline/types'
import { CreateTaskButton, CreateTaskModal, useCreateTaskModal } from '@features/task/create'
import { EditProjectModal, useEditProjectModal } from '@features/project/edit'
import { routes } from '@shared/config/routes'
import { formatLocaleCurrency, formatLocaleDate, formatLocaleDateTime } from '@shared/lib/i18n'
import { ContentState } from '@shared/ui'
import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Segmented, Select, Skeleton, Space, Table, Timeline, Typography } from 'antd'
import { LayoutGrid, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { TaskDrawerWidget } from '@widgets/task/TaskDrawerWidget'

import {
  BreadcrumbCurrent,
  FilterField,
  FilterLabel,
  ProjectBreadcrumb,
  ProjectHeaderRow,
  ProjectPageDescription,
  ProjectPageTitle,
  ProjectSummaryCard,
  ProjectTabs,
  ProjectTitleBlock,
  ProjectTitleRow,
  SummaryDd,
  SummaryDt,
  SummaryGrid,
  TasksFilters,
  TasksTableShell,
  TasksToolbar,
  ToolbarActions,
} from './ProjectPage.styles'
import { ProjectKanbanBoard } from './ProjectKanbanBoard'

type TasksViewMode = 'kanban' | 'table'

export const ProjectPage = () => {
  const { t } = useTranslation()
  const { projectId } = useParams()
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
    projectToEdit,
    isOpen: isEditOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useEditProjectModal()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all')
  const [tasksView, setTasksView] = useState<TasksViewMode>('kanban')
  const { isOpen, openModal, closeModal } = useCreateTaskModal()

  const handleCreateTask = async (task: Task) => {
    await createTaskMutation.mutateAsync(task)
  }

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
  }

  const handleResetFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const handleSaveTask = async (updatedTask: Task) => {
    await updateTaskMutation.mutateAsync(updatedTask)
  }

  const handleTaskDeleted = () => {
    setSelectedTaskId(null)
  }

  const handleUpdateProject = async (p: Project) => {
    await updateProject({ projectId: p.id, project: p })
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const task = filteredTasks.find((x) => x.id === taskId)
    if (!task || task.status === newStatus) return
    await updateTaskMutation.mutateAsync({ ...task, status: newStatus })
  }

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
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

  const timeline: TimelineEvent[] = []

  const renderTasksContent = () => {
    if (isTasksLoading) {
      return (
        <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
          <div>
            <Typography.Text strong>
              {t('projectDetails.tasksSection.loadingTitle')}
            </Typography.Text>
            <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              {t('projectDetails.tasksSection.loadingDescription')}
            </Typography.Paragraph>
          </div>
          <Skeleton active title={{ width: '32%' }} paragraph={{ rows: 5 }} />
        </Space>
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
            action={<CreateTaskButton onClick={openModal} />}
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
      return (
        <TasksTableShell>
          <Table<Task>
            rowKey="id"
            dataSource={filteredTasks}
            pagination={false}
            onRow={(record) => ({
              onClick: () => handleOpenTask(record.id),
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                title: t('projectDetails.tasksSection.columns.key'),
                dataIndex: 'key',
                width: 110,
                render: (value: string) => (
                  <Typography.Text code copyable={{ text: value }}>
                    {value}
                  </Typography.Text>
                ),
              },
              {
                title: t('projectDetails.tasksSection.columns.task'),
                dataIndex: 'title',
                render: (_, task) => (
                  <Space orientation="vertical" size={2}>
                    <Typography.Text strong>{task.title}</Typography.Text>
                    <Typography.Text type="secondary">
                      {task.description ?? t('projectDetails.tasksSection.descriptionFallback')}
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                title: t('projectDetails.tasksSection.columns.status'),
                dataIndex: 'status',
                render: (value?: Task['status']) => getTaskStatusTag(value),
              },
              {
                title: t('projectDetails.tasksSection.columns.priority'),
                dataIndex: 'priority',
                render: (value?: Task['priority']) => getTaskPriorityTag(value),
              },
              {
                title: t('projectDetails.tasksSection.columns.deadline'),
                dataIndex: 'dueDate',
                render: (value?: string) => formatTaskDate(value),
              },
            ]}
          />
        </TasksTableShell>
      )
    }

    return (
      <ProjectKanbanBoard
        projectKey={project?.key ?? ''}
        tasksByStatus={tasksByStatus}
        tasksFlat={filteredTasks}
        selectedTaskId={selectedTaskId}
        isDrawerOpen={isDrawerOpen}
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
      <Card>
        <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
          <div>
            <Typography.Text strong>{t('projectDetails.loadingTitle')}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              {t('projectDetails.loadingDescription')}
            </Typography.Paragraph>
          </div>
          <Skeleton active title={{ width: '32%' }} paragraph={{ rows: 6 }} />
        </Space>
      </Card>
    )
  }

  if (isProjectError) {
    return (
      <Card>
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
      </Card>
    )
  }

  if (!project) {
    return (
      <Card>
        <ContentState
          variant="empty"
          title={t('projectDetails.notFoundTitle')}
          description={t('projectDetails.notFoundDescription')}
        />
      </Card>
    )
  }

  const renderProjectTimeline = () => {
    if (timeline.length === 0) {
      return (
        <ContentState
          variant="empty"
          title={t('projectDetails.timeline.emptyTitle')}
          description={t('projectDetails.timeline.emptyDescription')}
        />
      )
    }

    return (
      <Timeline
        items={timeline.map((event) => ({
          key: event.id,
          children: (
            <div
              style={{
                padding: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                background: 'var(--color-surface-alt)',
              }}
            >
              <Space orientation="vertical" size={4} style={{ display: 'flex' }}>
                <Typography.Text strong>{event.title}</Typography.Text>
                <Typography.Text type="secondary">
                  {formatLocaleDateTime(event.time)}
                </Typography.Text>
                {event.description ? (
                  <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                    {event.description}
                  </Typography.Paragraph>
                ) : null}
              </Space>
            </div>
          ),
        }))}
      />
    )
  }

  return (
    <Space orientation="vertical" size={24} style={{ display: 'flex', width: '100%' }}>
      <ProjectBreadcrumb
        items={[
          {
            title: (
              <Link to={routes.app}>
                {t('projects.breadcrumb.workspace')}
              </Link>
            ),
          },
          {
            title: (
              <BreadcrumbCurrent>{project.name}</BreadcrumbCurrent>
            ),
          },
        ]}
      />

      <ProjectHeaderRow>
        <ProjectTitleBlock>
          <ProjectTitleRow>
            <ProjectPageTitle>{project.name}</ProjectPageTitle>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => openEditModal(project)}
            >
              {t('projectDetails.editProject')}
            </Button>
          </ProjectTitleRow>
          {project.description ? (
            <ProjectPageDescription>{project.description}</ProjectPageDescription>
          ) : null}
        </ProjectTitleBlock>

        <ProjectSummaryCard>
          <SummaryGrid>
            <SummaryDt>{t('projectDetails.fields.key')}</SummaryDt>
            <SummaryDd>
              <Typography.Text code copyable={{ text: project.key }}>
                {project.key}
              </Typography.Text>
            </SummaryDd>

            <SummaryDt>{t('projectDetails.fields.client')}</SummaryDt>
            <SummaryDd>{project.client ?? t('common.notSpecified')}</SummaryDd>

            <SummaryDt>{t('projectDetails.fields.status')}</SummaryDt>
            <SummaryDd>{getProjectStatusTag(project.status)}</SummaryDd>

            <SummaryDt>{t('projectDetails.fields.budget')}</SummaryDt>
            <SummaryDd>{formatLocaleCurrency(project.budget)}</SummaryDd>

            <SummaryDt>{t('projectDetails.fields.deadline')}</SummaryDt>
            <SummaryDd>
              {project.deadline ? formatLocaleDate(project.deadline) : t('projects.table.tbd')}
            </SummaryDd>

            <SummaryDt>{t('projectDetails.fields.tasks')}</SummaryDt>
            <SummaryDd>{tasks.length}</SummaryDd>
          </SummaryGrid>
        </ProjectSummaryCard>
      </ProjectHeaderRow>

      <ProjectTabs
        items={[
          {
            key: 'tasks',
            label: t('projectDetails.tabs.tasks'),
            children: (
              <>
                {tasks.length > 0 || isTasksLoading ? (
                  <>
                    <TasksToolbar>
                      <TasksFilters>
                        <FilterField>
                          <FilterLabel>{t('projectDetails.tasksSection.filterStatus')}</FilterLabel>
                          <Select
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value)}
                            style={{ width: 160 }}
                            options={[
                              {
                                value: 'all',
                                label: t('projectDetails.tasksSection.allStatuses'),
                              },
                              ...getTaskStatusOptions(),
                            ]}
                          />
                        </FilterField>
                        <FilterField>
                          <FilterLabel>
                            {t('projectDetails.tasksSection.filterPriority')}
                          </FilterLabel>
                          <Select
                            value={priorityFilter}
                            onChange={(value) => setPriorityFilter(value)}
                            style={{ width: 160 }}
                            options={[
                              {
                                value: 'all',
                                label: t('projectDetails.tasksSection.allPriorities'),
                              },
                              ...getTaskPriorityOptions(),
                            ]}
                          />
                        </FilterField>
                        {hasActiveFilters && (
                          <Button onClick={handleResetFilters}>
                            {t('common.resetFilters')}
                          </Button>
                        )}
                      </TasksFilters>
                      <ToolbarActions>
                        <Segmented
                          value={tasksView}
                          onChange={(v) => setTasksView(v as TasksViewMode)}
                          options={[
                            {
                              value: 'kanban',
                              label: (
                                <Space size={6}>
                                  <LayoutGrid size={14} aria-hidden />
                                  {t('projectDetails.tasksSection.viewKanban')}
                                </Space>
                              ),
                            },
                            {
                              value: 'table',
                              label: (
                                <Space size={6}>
                                  <Table2 size={14} aria-hidden />
                                  {t('projectDetails.tasksSection.viewTable')}
                                </Space>
                              ),
                            },
                          ]}
                        />
                        <CreateTaskButton onClick={openModal} />
                      </ToolbarActions>
                    </TasksToolbar>
                    {renderTasksContent()}
                  </>
                ) : (
                  renderTasksContent()
                )}
                <CreateTaskModal
                  open={isOpen}
                  onClose={closeModal}
                  onCreate={handleCreateTask}
                  projectId={project.id}
                />
                <TaskDrawerWidget
                  open={isDrawerOpen}
                  onClose={handleCloseDrawer}
                  onSave={handleSaveTask}
                  onTaskDeleted={handleTaskDeleted}
                  tasksQueryKey={projectId ?? ''}
                  task={selectedTask}
                />
                <EditProjectModal
                  project={projectToEdit}
                  open={isEditOpen}
                  onClose={closeEditModal}
                  onUpdate={handleUpdateProject}
                />
              </>
            ),
          },
          {
            key: 'timeline',
            label: t('projectDetails.tabs.timeline'),
            children: renderProjectTimeline(),
          },
        ]}
      />
    </Space>
  )
}
