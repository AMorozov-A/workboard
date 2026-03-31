import { Button } from 'antd'
import { useTranslation } from 'react-i18next'

type CreateProjectButtonProps = {
  onClick: () => void
}

export const CreateProjectButton = ({ onClick }: CreateProjectButtonProps) => {
  const { t } = useTranslation()

  return (
    <Button type="primary" onClick={onClick}>
      {t('projects.actions.create')}
    </Button>
  )
}
