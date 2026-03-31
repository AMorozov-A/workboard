import {
  getTaskDateInputFormat,
  getTaskLabelOptions,
  getTaskPriorityOptions,
  getTaskStatusOptions,
} from '@entities/task/lib/presentation'
import type { Task } from '@entities/task/model/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { notifyError, notifySuccess } from '@shared/ui'
import { DatePicker, Form, Input, Modal, Select } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

type CreateTaskModalProps = {
  open: boolean
  projectId: string
  onClose: () => void
  onCreate: (task: Task) => void | Promise<void>
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.any().optional(),
  labels: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

const createTaskId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}`

export const CreateTaskModal = ({
  open,
  projectId,
  onClose,
  onCreate,
}: CreateTaskModalProps) => {
  const { t } = useTranslation()
  const validationSchema = schema.extend({
    title: z.string().min(1, t('tasks.validation.titleRequired')),
  })
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      labels: [],
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const now = new Date().toISOString()
    const dueDate = values.dueDate?.format
      ? values.dueDate.format('YYYY-MM-DD')
      : undefined

    try {
      await Promise.resolve(
        onCreate({
          id: createTaskId(),
          key: '',
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          status: values.status,
          priority: values.priority,
          dueDate,
          labels: values.labels?.length ? values.labels : undefined,
          projectId,
          createdBy: 'freelancer',
          createdAt: now,
          updatedAt: now,
        })
      )

      notifySuccess(
        t('tasks.notifications.createdTitle'),
        t('tasks.notifications.createdDescription')
      )
      handleClose()
    } catch {
      notifyError(
        t('tasks.notifications.createErrorTitle'),
        t('tasks.notifications.createErrorDescription')
      )
    }
  }

  return (
    <Modal
      open={open}
      title={t('tasks.modal.title')}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      okText={t('tasks.modal.submit')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !isValid, loading: isSubmitting }}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item
          label={t('tasks.form.title')}
          required
          validateStatus={errors.title ? 'error' : ''}
          help={errors.title?.message}
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder={t('tasks.form.titlePlaceholder')} />
            )}
          />
        </Form.Item>
        <Form.Item label={t('tasks.form.description')}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder={t('tasks.form.descriptionPlaceholder')}
                rows={3}
              />
            )}
          />
        </Form.Item>
        <Form.Item label={t('tasks.form.status')}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select {...field} options={getTaskStatusOptions()} />
            )}
          />
        </Form.Item>
        <Form.Item label={t('tasks.form.priority')}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select {...field} options={getTaskPriorityOptions()} />
            )}
          />
        </Form.Item>
        <Form.Item label={t('tasks.form.deadline')}>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                style={{ width: '100%' }}
                format={getTaskDateInputFormat()}
                placeholder={t('tasks.form.deadlinePlaceholder')}
              />
            )}
          />
        </Form.Item>
        <Form.Item label={t('tasks.form.labels')}>
          <Controller
            name="labels"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                options={getTaskLabelOptions()}
                placeholder={t('tasks.form.labelsPlaceholder')}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
