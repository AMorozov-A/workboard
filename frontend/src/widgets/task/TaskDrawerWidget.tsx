import type { Task } from '@entities/task/model/types'
import { formatTaskDate, getTaskStatusLabel } from '@entities/task/lib/presentation'
import {
  TaskDescriptionInlineEdit,
  TaskMetaForm,
  TaskTitleInlineEdit,
} from '@features/task/edit'
import { formatLocaleDateTime } from '@shared/lib/i18n'
import { ContentState, notifyError, notifySuccess } from '@shared/ui'
import { Button, Drawer, Input, List, Space, Tabs, Timeline, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TaskDrawerWidgetProps = {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (task: Task) => void | Promise<void>
}

type TaskComment = {
  id: string
  author: string
  content: string
  createdAt: string
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
}: TaskDrawerWidgetProps) => {
  const { t, i18n } = useTranslation()

  return (
    task ? (
      <TaskDrawerContent
        key={`${task.id}-${i18n.resolvedLanguage ?? i18n.language}`}
        open={open}
        task={task}
        onClose={onClose}
        onSave={onSave}
      />
    ) : (
      <Drawer
        open={open}
        onClose={onClose}
        width={860}
        title={<Typography.Text strong>{t('tasks.drawer.title')}</Typography.Text>}
        extra={
          <Space>
            <Button onClick={onClose}>{t('common.close')}</Button>
          </Space>
        }
      >
        <ContentState
          variant="empty"
          title={t('tasks.drawer.emptyTitle')}
          description={t('tasks.drawer.emptyDescription')}
        />
      </Drawer>
    )
  )
}

type TaskDrawerContentProps = {
  open: boolean
  task: Task
  onClose: () => void
  onSave: (task: Task) => void | Promise<void>
}

const TaskDrawerContent = ({
  open,
  task,
  onClose,
  onSave,
}: TaskDrawerContentProps) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Task>(task)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([])
  const [commentInput, setCommentInput] = useState('')

  const commentInputId = `task-comment-input-${task.id}`
  const isSaveDisabled = useMemo(() => !draft.title?.trim(), [draft.title])

  const handleFocusCommentInput = () => {
    if (typeof document === 'undefined') return

    const input = document.getElementById(commentInputId)
    input?.focus()
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

  const handleAddComment = () => {
    const content = commentInput.trim()
    if (!content) return

    const now = new Date().toISOString()

    setComments((prevComments) => [
      ...prevComments,
      {
        id: `${draft.id}-comment-${prevComments.length + 1}`,
        author: t('common.you'),
        content,
        createdAt: now,
      },
    ])
    setHistoryItems((prevHistory) => [
      ...prevHistory,
      {
        id: `${draft.id}-history-comment-${prevHistory.length + 1}`,
        title: t('tasks.historyEvent.commentAddedTitle'),
        description: t('tasks.historyEvent.commentAddedDescription'),
        createdAt: now,
      },
    ])
    setCommentInput('')
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
        <Space>
          <Button onClick={onClose}>{t('common.close')}</Button>
          <Button type="primary" onClick={handleSave} disabled={isSaveDisabled}>
            {t('common.save')}
          </Button>
        </Space>
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
                              padding: 16,
                              border: '1px solid #f0f0f0',
                              borderRadius: 12,
                              background: '#fafafa',
                            }}
                          >
                            <Space direction="vertical" size={8} style={{ display: 'flex' }}>
                              <Space
                                size={12}
                                style={{
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography.Text strong>{item.author}</Typography.Text>
                                <Typography.Text type="secondary">
                                  {formatLocaleDateTime(item.createdAt)}
                                </Typography.Text>
                              </Space>
                              <Typography.Paragraph style={{ margin: 0 }}>
                                {item.content}
                              </Typography.Paragraph>
                            </Space>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <ContentState
                      variant="empty"
                      title={t('tasks.drawer.commentsEmptyTitle')}
                      description={t('tasks.drawer.commentsEmptyDescription')}
                      action={
                        <Button type="primary" onClick={handleFocusCommentInput}>
                          {t('tasks.drawer.commentsEmptyAction')}
                        </Button>
                      }
                    />
                  )}
                  <Input.TextArea
                    id={commentInputId}
                    rows={3}
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    placeholder={t('tasks.drawer.commentPlaceholder')}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      onClick={handleAddComment}
                      disabled={!commentInput.trim()}
                    >
                      {t('tasks.actions.addComment')}
                    </Button>
                  </div>
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
