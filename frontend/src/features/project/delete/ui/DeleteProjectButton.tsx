import { useDeleteProjectMutation } from '@entities/project/api'
import type { Project } from '@entities/project/types'
import { notifyError } from '@shared/ui'
import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'

type DeleteProjectButtonProps = {
  project: Project
}

export const DeleteProjectButton = ({ project }: DeleteProjectButtonProps) => {
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteProjectMutation()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: t('projects.delete.confirmTitle'),
      content: t('projects.delete.confirmDescription', { name: project.name }),
      okText: t('projects.delete.confirmOk'),
      cancelText: t('common.cancel'),
      wrapProps: { 'data-testid': 'delete-project-confirm' },
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await mutateAsync(project.id)
        } catch {
          notifyError(t('projects.delete.errorTitle'), t('projects.delete.errorDescription'))
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
      aria-label={t('projects.actions.delete')}
      data-testid={`delete-project-${project.id}`}
      onClick={handleClick}
    />
  )
}
