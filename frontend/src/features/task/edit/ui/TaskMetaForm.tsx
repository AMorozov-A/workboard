import type { Task, TaskPriority, TaskStatus } from '@entities/task/model/types'
import {
  formatTaskDate,
  getTaskDateInputFormat,
  getTaskLabelOptions,
  getTaskPriorityOptions,
  getTaskStatusOptions,
  getTaskPriorityTag,
  getTaskStatusTag,
} from '@entities/task/lib/presentation'
import { DatePicker, Form, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

type TaskMetaFormProps = {
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  labels?: string[]
  createdAt?: string
  updatedAt?: string
  onChange: (payload: Partial<Task>) => void
}

export const TaskMetaForm = ({
  status,
  priority,
  dueDate,
  labels,
  createdAt,
  updatedAt,
  onChange,
}: TaskMetaFormProps) => {
  const { t } = useTranslation()

  return (
    <Form layout="vertical">
      <Form.Item
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t('tasks.form.status')} {getTaskStatusTag(status)}
          </span>
        }
      >
        <Select
          value={status}
          options={getTaskStatusOptions()}
          onChange={(value) => onChange({ status: value })}
        />
      </Form.Item>
      <Form.Item
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t('tasks.form.priority')} {getTaskPriorityTag(priority)}
          </span>
        }
      >
        <Select
          value={priority}
          options={getTaskPriorityOptions()}
          onChange={(value) => onChange({ priority: value })}
        />
      </Form.Item>
      <Form.Item label={t('tasks.form.deadline')}>
        <DatePicker
          value={dueDate ? dayjs(dueDate) : null}
          onChange={(value) =>
            onChange({
              dueDate: value ? value.format('YYYY-MM-DD') : undefined,
            })
          }
          style={{ width: '100%' }}
        format={getTaskDateInputFormat()}
        />
      </Form.Item>
      <Form.Item label={t('tasks.form.labels')}>
        <Select
          mode="multiple"
          value={labels}
          options={getTaskLabelOptions()}
          onChange={(value) => onChange({ labels: value })}
          placeholder={t('tasks.form.labelsPlaceholder')}
        />
      </Form.Item>
      <Form.Item label={t('tasks.form.createdAt')}>
        <Typography.Text type="secondary">{formatTaskDate(createdAt)}</Typography.Text>
      </Form.Item>
      <Form.Item label={t('tasks.form.updatedAt')}>
        <Typography.Text type="secondary">{formatTaskDate(updatedAt)}</Typography.Text>
      </Form.Item>
    </Form>
  )
}
