import { getProjectStatusOptions } from '@entities/project/lib/presentation'
import type { Project } from '@entities/project/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { getDateInputFormat } from '@shared/lib/i18n'
import { notifyError, notifySuccess } from '@shared/ui'
import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void | Promise<void>
}

const schema = z.object({
  name: z.string().min(1),
  keyPrefix: z.string(),
  client: z.string().min(1),
  status: z.enum(['active', 'paused', 'done']),
  budget: z.union([z.number().nonnegative(), z.null(), z.undefined()]),
  deadline: z.any().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const createProjectId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `project-${Date.now()}`

export const CreateProjectModal = ({
  open,
  onClose,
  onCreate,
}: CreateProjectModalProps) => {
  const { t } = useTranslation()
  const validationSchema = schema.extend({
    name: z.string().min(1, t('projects.validation.nameRequired')),
    keyPrefix: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .transform((s) => (s === '' ? 'proj' : s))
      .refine((s) => /^[a-z][a-z0-9-]{1,29}$/.test(s), {
        message: t('projects.validation.keyPrefix'),
      }),
    client: z.string().min(1, t('projects.validation.clientRequired')),
    budget: z.union([
      z.number().nonnegative(t('projects.validation.budgetNonNegative')),
      z.null(),
      z.undefined(),
    ]),
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
      keyPrefix: 'proj',
      client: '',
      status: 'active',
      budget: null,
      deadline: null,
      description: '',
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await Promise.resolve(
        onCreate({
          id: createProjectId(),
          key: '',
          keyPrefix: values.keyPrefix,
          name: values.name.trim(),
          client: values.client.trim(),
          status: values.status,
          budget: values.budget ?? undefined,
          deadline: values.deadline?.format ? values.deadline.format('YYYY-MM-DD') : undefined,
          description: values.description?.trim() || undefined,
        })
      )

      notifySuccess(
        t('projects.notifications.createdTitle'),
        t('projects.notifications.createdDescription')
      )
      handleClose()
    } catch {
      notifyError(
        t('projects.notifications.createErrorTitle'),
        t('projects.notifications.createErrorDescription')
      )
    }
  }

  return (
    <Modal
      open={open}
      title={t('projects.modal.title')}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      okText={t('projects.modal.submit')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !isValid, loading: isSubmitting }}
      destroyOnClose
    >
      <Form layout="vertical">
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
          label={t('projects.form.keyPrefix')}
          validateStatus={errors.keyPrefix ? 'error' : ''}
          help={errors.keyPrefix?.message ?? t('projects.form.keyPrefixHint')}
        >
          <Controller
            name="keyPrefix"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('projects.form.keyPrefixPlaceholder')}
                autoComplete="off"
              />
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
            render={({ field }) => (
              <Select {...field} options={getProjectStatusOptions()} />
            )}
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
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
