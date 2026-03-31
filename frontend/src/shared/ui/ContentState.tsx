import type { ReactNode } from 'react'
import { Empty, Result, Space, Typography } from 'antd'

type ContentStateProps = {
  variant: 'empty' | 'error'
  title: string
  description: string
  action?: ReactNode
}

export const ContentState = ({
  variant,
  title,
  description,
  action,
}: ContentStateProps) => {
  if (variant === 'error') {
    return (
      <Result
        status="error"
        title={title}
        subTitle={description}
        extra={action}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
      }}
    >
      <Space direction="vertical" size={8} align="center">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ margin: 0, maxWidth: 420, textAlign: 'center' }}
        >
          {description}
        </Typography.Paragraph>
        {action}
      </Space>
    </div>
  )
}
