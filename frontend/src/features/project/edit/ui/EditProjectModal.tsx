import { getProjectStatusOptions } from '@entities/project/lib/presentation'
import type { Project } from '@entities/project/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { rhfAntdOnFinish, textAreaCtrlEnterSubmit } from '@shared/lib/form/rhfAntdFormSubmit'
import { getDateInputFormat } from '@shared/lib/i18n'
import { notifyError, notifySuccess } from '@shared/ui'
import { DatePicker, Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

type EditProjectModalProps = {
  project: Project | null
  open: boolean
  onClose: () => void
  onUpdate: (project: Project) => void | Promise<void>
}

type FormValues = {
  name: string
  client: string
  status: 'active' | 'paused' | 'done'
  budget: number | null | undefined
  deadline?: Dayjs | null
  description?: string
}

export const EditProjectModal = ({
  project,
  open,
  onClose,
  onUpdate,
}: EditProjectModalProps) => {
  const { t } = useTranslation()

  const validationSchema = z.object({
    name: z.string().min(1, t('projects.validation.nameRequired')),
    client: z.string().min(1, t('projects.validation.clientRequired')),
    status: z.enum(['active', 'paused', 'done']),
    budget: z.union([
      z.number().nonnegative(t('projects.validation.budgetNonNegative')),
      z.null(),
      z.undefined(),
    ]),
    deadline: z
      .custom<Dayjs | null>((value) => value == null || dayjs.isDayjs(value))
      .optional(),
    description: z.string().optional(),
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
      name: '',
      client: '',
      status: 'active',
      budget: null,
      deadline: null,
      description: '',
    },
  })

  useEffect(() => {
    if (!open || !project) {
      return
    }
    reset({
      name: project.name,
      client: project.client ?? '',
      status: project.status ?? 'active',
      budget: project.budget ?? null,
      deadline: project.deadline ? dayjs(project.deadline) : null,
      description: project.description ?? '',
    })
  }, [open, project, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    if (!project) {
      return
    }
    try {
      await Promise.resolve(
        onUpdate({
          ...project,
          name: values.name.trim(),
          client: values.client.trim(),
          status: values.status,
          budget: values.budget ?? undefined,
          deadline: values.deadline?.format
            ? values.deadline.format('YYYY-MM-DD')
            : undefined,
          description: values.description?.trim() || undefined,
        })
      )

      notifySuccess(
        t('projects.notifications.updatedTitle'),
        t('projects.notifications.updatedDescription')
      )
      handleClose()
    } catch {
      notifyError(
        t('projects.notifications.updateErrorTitle'),
        t('projects.notifications.updateErrorDescription')
      )
    }
  }

  if (!project) {
    return null
  }

  return (
    <Modal
      data-testid="edit-project-modal"
      open={open}
      title={t('projects.editModal.title')}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      okText={t('projects.editModal.submit')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !isValid, loading: isSubmitting }}
      destroyOnClose
    >
      <Form layout="vertical" onFinish={rhfAntdOnFinish(handleSubmit, onSubmit)}>
        <Form.Item label={t('projects.editModal.keyLabel')}>
          <Typography.Text code copyable={{ text: project.key }}>
            {project.key}
          </Typography.Text>
        </Form.Item>

        <Form.Item label={t('projects.form.taskKeyPrefix')}>
          <Typography.Text code copyable={{ text: project.taskKeyPrefix }}>
            {project.taskKeyPrefix}
          </Typography.Text>
        </Form.Item>

        <Form.Item
          label={t('projects.form.name')}
          required
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder={t('projects.form.namePlaceholder')} />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('projects.form.client')}
          required
          validateStatus={errors.client ? 'error' : ''}
          help={errors.client?.message}
        >
          <Controller
            name="client"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder={t('projects.form.clientPlaceholder')} />
            )}
          />
        </Form.Item>

        <Form.Item label={t('projects.form.status')}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => <Select {...field} options={getProjectStatusOptions()} />}
          />
        </Form.Item>

        <Form.Item
          label={t('projects.form.budget')}
          validateStatus={errors.budget ? 'error' : ''}
          help={errors.budget?.message}
        >
          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onChange={field.onChange}
                style={{ width: '100%' }}
                min={0}
                controls={false}
                placeholder={t('projects.form.budgetPlaceholder')}
                onPressEnter={() => void handleSubmit(onSubmit)()}
              />
            )}
          />
        </Form.Item>

        <Form.Item label={t('projects.form.deadline')}>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                style={{ width: '100%' }}
                format={getDateInputFormat()}
                placeholder={t('projects.form.deadlinePlaceholder')}
              />
            )}
          />
        </Form.Item>

        <Form.Item label={t('projects.form.description')}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={4}
                placeholder={t('projects.form.descriptionPlaceholder')}
                onKeyDown={textAreaCtrlEnterSubmit(handleSubmit, onSubmit)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
