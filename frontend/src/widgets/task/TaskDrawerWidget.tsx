import type { Task } from '@entities/task/model/types'
import {
  useCommentsList,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '@entities/comment'
import { formatTaskDate, getTaskStatusLabel } from '@entities/task/lib/presentation'
import { DeleteTaskButton } from '@features/task/delete'
import {
  TaskDescriptionInlineEdit,
  TaskMetaForm,
  TaskTitleInlineEdit,
} from '@features/task/edit'
import { selectCurrentUser } from '@app/store/authSlice'
import { formatLocaleDateTime } from '@shared/lib/i18n'
import { useAppSelector } from '@shared/lib/store'
import { ContentState, notifyError, notifySuccess } from '@shared/ui'
import { Button, Drawer, List, Space, Spin, Tabs, Timeline, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommentForm } from './ui/CommentForm'
import { CommentItem } from './ui/CommentItem'

type TaskDrawerWidgetProps = {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (task: Task) => void | Promise<void>
  onTaskDeleted?: () => void
  tasksQueryKey: string
}

type TaskHistoryItem = {
  id: string
  title: string
  description?: string
  createdAt: string
}

export const TaskDrawerWidget = ({
  open,
  task,
  onClose,
  onSave,
  onTaskDeleted,
  tasksQueryKey,
}: TaskDrawerWidgetProps) => {
  const { t, i18n } = useTranslation()

  return task ? (
    <TaskDrawerContent
      key={`${task.id}-${i18n.resolvedLanguage ?? i18n.language}`}
      open={open}
      task={task}
      onClose={onClose}
      onSave={onSave}
      onTaskDeleted={onTaskDeleted}
      tasksQueryKey={tasksQueryKey}
    />
  ) : (
    <Drawer
      open={open}
      onClose={onClose}
      width={860}
      title={<Typography.Text strong>{t('tasks.drawer.title')}</Typography.Text>}
    >
      <ContentState
        variant="empty"
        title={t('tasks.drawer.emptyTitle')}
        description={t('tasks.drawer.emptyDescription')}
      />
    </Drawer>
  )
}

type TaskDrawerContentProps = {
  open: boolean
  task: Task
  onClose: () => void
  onSave: (task: Task) => void | Promise<void>
  onTaskDeleted?: () => void
  tasksQueryKey: string
}

const TaskDrawerContent = ({
  open,
  task,
  onClose,
  onSave,
  onTaskDeleted,
  tasksQueryKey,
}: TaskDrawerContentProps) => {
  const { t } = useTranslation()
  const currentUser = useAppSelector(selectCurrentUser)
  const currentUserId = currentUser?.id ?? ''

  const [draft, setDraft] = useState<Task>(task)
  const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([])

  const taskId = task.id
  const { data: comments = [], isLoading: commentsLoading } = useCommentsList(taskId)
  const createMutation = useCreateCommentMutation(taskId)
  const deleteMutation = useDeleteCommentMutation(taskId)

  const isSaveDisabled = useMemo(() => !draft.title?.trim(), [draft.title])

  const handleFocusCommentInput = () => {
    if (typeof document === 'undefined') return
    const el = document.querySelector<HTMLElement>('[data-testid="comment-form-input"]')
    el?.focus()
  }

  const handleSave = async () => {
    const now = new Date().toISOString()

    if (task.status !== draft.status) {
      setHistoryItems((prevHistory) => [
        ...prevHistory,
        {
          id: `${draft.id}-status-${now}`,
          title: t('tasks.historyEvent.statusChangedTitle'),
          description: getTaskStatusLabel(draft.status),
          createdAt: now,
        },
      ])
    }

    if (task.dueDate !== draft.dueDate && draft.dueDate) {
      setHistoryItems((prevHistory) => [
        ...prevHistory,
        {
          id: `${draft.id}-deadline-${now}`,
          title: t('tasks.historyEvent.deadlineChangedTitle'),
          description: formatTaskDate(draft.dueDate),
          createdAt: now,
        },
      ])
    }

    try {
      await Promise.resolve(
        onSave({
          ...draft,
          updatedAt: now,
          createdAt: draft.createdAt ?? now,
        })
      )
      notifySuccess(
        t('tasks.notifications.updatedTitle'),
        t('tasks.notifications.updatedDescription')
      )
      onClose()
    } catch {
      notifyError(
        t('tasks.notifications.updateErrorTitle'),
        t('tasks.notifications.updateErrorDescription')
      )
    }
  }

  const handleCreateComment = async (body: string) => {
    const now = new Date().toISOString()
    try {
      await createMutation.mutateAsync({ body })
    } catch {
      notifyError(t('tasks.comments.createError'), t('tasks.comments.createError'))
      throw new Error('create-comment-failed')
    }
    setHistoryItems((prevHistory) => [
      ...prevHistory,
      {
        id: `${draft.id}-history-comment-${now}`,
        title: t('tasks.historyEvent.commentAddedTitle'),
        description: t('tasks.historyEvent.commentAddedDescription'),
        createdAt: now,
      },
    ])
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteMutation.mutateAsync(commentId)
    } catch {
      notifyError(t('tasks.comments.deleteError'), t('tasks.comments.deleteError'))
      throw new Error('delete-comment-failed')
    }
  }

  const timelineItems = useMemo(
    () =>
      historyItems.map((item) => ({
        key: item.id,
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
              <Typography.Text strong>{item.title}</Typography.Text>
              <Typography.Text type="secondary">
                {formatLocaleDateTime(item.createdAt)}
              </Typography.Text>
              {item.description && (
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  {item.description}
                </Typography.Paragraph>
              )}
            </Space>
          </div>
        ),
      })),
    [historyItems]
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={860}
      title={
        <Space size={12}>
          {draft.key ? (
            <Typography.Text type="secondary" code copyable={{ text: draft.key }}>
              {draft.key}
            </Typography.Text>
          ) : null}
          <Typography.Text strong>{draft.title || t('tasks.form.titleEmpty')}</Typography.Text>
        </Space>
      }
      extra={
        <Button type="primary" onClick={handleSave} disabled={isSaveDisabled}>
          {t('common.save')}
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <TaskTitleInlineEdit
            value={draft.title}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, title: value }))
            }
          />
          <Typography.Text type="secondary">
            {t('tasks.drawer.descriptionSection')}
          </Typography.Text>
          <TaskDescriptionInlineEdit
            value={draft.description}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, description: value || undefined }))
            }
          />
        </div>
        <div>
          <Typography.Text type="secondary">
            {t('tasks.drawer.detailsSection')}
          </Typography.Text>
          <TaskMetaForm
            status={draft.status}
            priority={draft.priority}
            dueDate={draft.dueDate}
            labels={draft.labels}
            createdAt={draft.createdAt}
            updatedAt={draft.updatedAt}
            onChange={(payload) =>
              setDraft((prev) => ({ ...prev, ...payload }))
            }
          />
          <div style={{ marginTop: 4 }}>
            <DeleteTaskButton
              task={draft}
              tasksQueryKey={tasksQueryKey}
              onDeleted={() => {
                onClose()
                onTaskDeleted?.()
              }}
            />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <Tabs
          items={[
            {
              key: 'comments',
              label: t('tasks.drawer.tabs.comments'),
              children: (
                <Space direction="vertical" size={16} style={{ display: 'flex' }}>
                  <Spin spinning={commentsLoading}>
                    {comments.length > 0 ? (
                      <List
                        split={false}
                        dataSource={comments}
                        renderItem={(item) => (
                          <List.Item
                            style={{
                              padding: 0,
                              border: 'none',
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                padding: 'var(--space-4)',
                                border: '1px solid var(--color-border-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-surface-alt)',
                              }}
                            >
                              <CommentItem
                                comment={item}
                                currentUserId={currentUserId}
                                onDelete={handleDeleteComment}
                                isDeleting={
                                  deleteMutation.isPending &&
                                  deleteMutation.variables === item.id
                                }
                              />
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : !commentsLoading ? (
                      <ContentState
                        variant="empty"
                        title={t('tasks.comments.empty')}
                        description={t('tasks.drawer.commentsEmptyDescription')}
                      />
                    ) : null}
                  </Spin>
                  <CommentForm
                    onSubmit={handleCreateComment}
                    loading={createMutation.isPending}
                  />
                </Space>
              ),
            },
            {
              key: 'timeline',
              label: t('tasks.drawer.tabs.history'),
              children:
                timelineItems.length > 0 ? (
                  <Timeline items={timelineItems} />
                ) : (
                  <ContentState
                    variant="empty"
                    title={t('tasks.drawer.historyEmptyTitle')}
                    description={t('tasks.drawer.historyEmptyDescription')}
                    action={
                      <Button onClick={handleFocusCommentInput}>
                        {t('tasks.drawer.historyEmptyAction')}
                      </Button>
                    }
                  />
                ),
            },
          ]}
        />
      </div>
    </Drawer>
  )
}
