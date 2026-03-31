import { useDeleteTaskMutation } from '@entities/task/api'
import type { Task } from '@entities/task/model/types'
import { notifyError } from '@shared/ui'
import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'

type DeleteTaskButtonProps = {
  task: Task
  /** Как в `useProjectTasksQuery` — сегмент из URL, не `task.projectId` из ответа API. */
  tasksQueryKey: string
  onDeleted?: () => void
}

export const DeleteTaskButton = ({ task, tasksQueryKey, onDeleted }: DeleteTaskButtonProps) => {
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteTaskMutation()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: t('tasks.delete.confirmTitle'),
      content: t('tasks.delete.confirmDescription', { title: task.title }),
      okText: t('tasks.delete.confirmOk'),
      cancelText: t('common.cancel'),
      wrapProps: { 'data-testid': 'delete-task-confirm' },
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await mutateAsync({ taskId: task.id, tasksQueryKey })
          onDeleted?.()
        } catch {
          notifyError(t('tasks.delete.errorTitle'), t('tasks.delete.errorDescription'))
          throw new Error('delete failed')
        }
      },
    })
  }

  return (
    <Button
      type="text"
      danger
      size="small"
      icon={<DeleteOutlined />}
      aria-label={t('tasks.actions.delete')}
      data-testid={`delete-task-${task.id}`}
      onClick={handleClick}
    />
  )
}
