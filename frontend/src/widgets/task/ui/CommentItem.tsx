import type { Comment } from '@entities/comment/types'
import { formatLocaleDateTime } from '@shared/lib/i18n'
import { Button, Popconfirm, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

export type CommentItemProps = {
  comment: Comment
  currentUserId: string
  onDelete: (id: string) => void | Promise<void>
  isDeleting: boolean
}

export const CommentItem = ({
  comment,
  currentUserId,
  onDelete,
  isDeleting,
}: CommentItemProps) => {
  const { t } = useTranslation()
  const canDelete = comment.author.id === currentUserId

  return (
    <div data-testid="comment-item">
      <Space direction="vertical" size={8} style={{ display: 'flex', width: '100%' }}>
        <Space
          size={12}
          style={{
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <Typography.Text strong>{comment.author.email}</Typography.Text>
          <Typography.Text type="secondary">
            {formatLocaleDateTime(comment.createdAt)}
          </Typography.Text>
        </Space>
        <Space
          align="start"
          style={{ justifyContent: 'space-between', width: '100%' }}
        >
          <Typography.Paragraph style={{ margin: 0, flex: 1 }}>
            {comment.body}
          </Typography.Paragraph>
          {canDelete ? (
            <Popconfirm
              title={t('tasks.comments.deleteConfirm')}
              okButtonProps={{ loading: isDeleting }}
              onConfirm={() => Promise.resolve(onDelete(comment.id))}
            >
              <Button
                danger
                type="text"
                size="small"
                loading={isDeleting}
                data-testid="delete-comment-btn"
              >
                {t('tasks.comments.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      </Space>
    </div>
  )
}
