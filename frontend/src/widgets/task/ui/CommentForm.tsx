import { commentTextAreaCtrlEnter } from '@shared/lib/form/rhfAntdFormSubmit'
import { Button, Input, Space } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export type CommentFormProps = {
  onSubmit: (body: string) => Promise<void>
  loading: boolean
}

export const CommentForm = ({ onSubmit, loading }: CommentFormProps) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const trimmed = value.trim()
  const disabled = !trimmed || loading

  const handleSubmit = async () => {
    if (!trimmed) return
    try {
      await onSubmit(trimmed)
      setValue('')
    } catch {
      void 0
    }
  }

  return (
    <Space direction="vertical" size={12} style={{ display: 'flex', width: '100%' }}>
      <Input.TextArea
        data-testid="comment-form-input"
        rows={3}
        maxLength={1000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('tasks.comments.placeholder')}
        onKeyDown={commentTextAreaCtrlEnter(() => void handleSubmit(), !disabled)}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button
          data-testid="comment-form-submit"
          type="primary"
          onClick={() => void handleSubmit()}
          disabled={disabled}
          loading={loading}
        >
          {t('tasks.comments.add')}
        </Button>
      </div>
    </Space>
  )
}
