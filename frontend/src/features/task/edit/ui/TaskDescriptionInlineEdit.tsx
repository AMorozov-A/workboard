import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'

type TaskDescriptionInlineEditProps = {
  value?: string
  onChange: (value: string) => void
}

export const TaskDescriptionInlineEdit = ({
  value,
  onChange,
}: TaskDescriptionInlineEditProps) => {
  const { t } = useTranslation()

  return (
    <Typography.Paragraph
      editable={{ onChange, triggerType: ['icon', 'text'], text: value ?? '' }}
      style={{ marginBottom: 0 }}
    >
      {value || t('tasks.form.descriptionEmpty')}
    </Typography.Paragraph>
  )
}
