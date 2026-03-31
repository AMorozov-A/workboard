import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'

type TaskTitleInlineEditProps = {
  value: string
  onChange: (value: string) => void
}

export const TaskTitleInlineEdit = ({
  value,
  onChange,
}: TaskTitleInlineEditProps) => {
  const { t } = useTranslation()

  return (
    <Typography.Title
      level={4}
      style={{ marginTop: 0 }}
      editable={{ onChange, triggerType: ['icon', 'text'] }}
    >
      {value || t('tasks.form.titleEmpty')}
    </Typography.Title>
  )
}
