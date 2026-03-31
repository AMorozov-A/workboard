import { Button } from 'antd'
import { useTranslation } from 'react-i18next'

type CreateTaskButtonProps = {
  onClick: () => void
}

export const CreateTaskButton = ({ onClick }: CreateTaskButtonProps) => {
  const { t } = useTranslation()

  return (
    <Button type="primary" onClick={onClick}>
      {t('tasks.actions.create')}
    </Button>
  )
}
