import { useProjectQuery } from '@entities/project/api'
import { getProjectStatusTag } from '@entities/project/lib/presentation'
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
import type { Task } from '@entities/task/model/types'
import type { TimelineEvent } from '@entities/timeline/types'
import { CreateTaskButton, CreateTaskModal, useCreateTaskModal } from '@features/task/create'
import { formatLocaleCurrency, formatLocaleDate, formatLocaleDateTime } from '@shared/lib/i18n'
import { ContentState } from '@shared/ui'
import {
  Button,
  Card,
  Descriptions,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Timeline,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { TaskDrawerWidget } from '@widgets/task/TaskDrawerWidget'

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

  const createTaskMutation = useCreateTaskMutation(projectId ?? '')
  const updateTaskMutation = useUpdateTaskMutation(projectId ?? '')

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all')
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

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const isStatusMatched = statusFilter === 'all' || task.status === statusFilter
        const isPriorityMatched =
          priorityFilter === 'all' || task.priority === priorityFilter

        return isStatusMatched && isPriorityMatched
      }),
    [priorityFilter, statusFilter, tasks]
  )
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all'

  const timeline: TimelineEvent[] = []

  const renderTasksContent = () => {
    if (isTasksLoading) {
      return (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
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

    return (
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
              <Space direction="vertical" size={2}>
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
    )
  }

  if (!projectId) {
    return null
  }

  if (isProjectLoading) {
    return (
      <Card>
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
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
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#fafafa',
              }}
            >
              <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                <Typography.Text strong>{event.title}</Typography.Text>
                <Typography.Text type="secondary">
                  {formatLocaleDateTime(event.time)}
                </Typography.Text>
                {event.description && (
                  <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                    {event.description}
                  </Typography.Paragraph>
                )}
              </Space>
            </div>
          ),
        }))}
      />
    )
  }

  return (
    <Card>
      <Space direction="vertical" size={24} style={{ display: 'flex' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {project.name}
          </Typography.Title>
          {project.description ? (
            <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
              {project.description}
            </Typography.Paragraph>
          ) : null}
        </div>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label={t('projectDetails.fields.key')}>
            <Typography.Text code copyable={{ text: project.key }}>
              {project.key}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('projectDetails.fields.client')}>
            {project.client}
          </Descriptions.Item>
          <Descriptions.Item label={t('projectDetails.fields.status')}>
            {getProjectStatusTag(project.status)}
          </Descriptions.Item>
          <Descriptions.Item label={t('projectDetails.fields.budget')}>
            {formatLocaleCurrency(project.budget)}
          </Descriptions.Item>
          <Descriptions.Item label={t('projectDetails.fields.deadline')}>
            {formatLocaleDate(project.deadline)}
          </Descriptions.Item>
        </Descriptions>
        <Tabs
          items={[
            {
              key: 'tasks',
              label: t('projectDetails.tabs.tasks'),
              children: (
                <>
                  <Space direction="vertical" size={16} style={{ display: 'flex' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {t('projectDetails.tasksSection.title')}
                        </Typography.Title>
                        <Typography.Paragraph
                          type="secondary"
                          style={{ margin: '8px 0 0' }}
                        >
                          {t('projectDetails.tasksSection.description')}
                        </Typography.Paragraph>
                      </div>
                      <CreateTaskButton onClick={openModal} />
                    </div>
                    <Space size={12} wrap>
                      <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        style={{ width: 220 }}
                        options={[
                          { value: 'all', label: t('projectDetails.tasksSection.allStatuses') },
                          ...getTaskStatusOptions(),
                        ]}
                      />
                      <Select
                        value={priorityFilter}
                        onChange={(value) => setPriorityFilter(value)}
                        style={{ width: 220 }}
                        options={[
                          {
                            value: 'all',
                            label: t('projectDetails.tasksSection.allPriorities'),
                          },
                          ...getTaskPriorityOptions(),
                        ]}
                      />
                      {hasActiveFilters && (
                        <Button onClick={handleResetFilters}>
                          {t('common.resetFilters')}
                        </Button>
                      )}
                    </Space>
                    {renderTasksContent()}
                  </Space>
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
    </Card>
  )
}
