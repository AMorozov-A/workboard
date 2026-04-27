import { changePasswordRequest } from '@features/auth/session'
import { zodResolver } from '@hookform/resolvers/zod'
import { isApiError } from '@shared/api/errors'
import { rhfAntdOnFinish } from '@shared/lib/form/rhfAntdFormSubmit'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Space } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

type ChangePasswordFormProps = {
  onSuccess?: () => void
  submitLabel?: string
}

export function ChangePasswordForm({ onSuccess, submitLabel }: ChangePasswordFormProps) {
  const { t } = useTranslation()

  const schema = z
    .object({
      currentPassword: z.string().min(1, t('auth.validation.passwordRequired')),
      newPassword: z.string().min(8, t('auth.validation.passwordMin8')),
      newPasswordConfirm: z.string().min(1, t('auth.validation.passwordConfirmationRequired')),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
      message: t('auth.validation.passwordMismatch'),
      path: ['newPasswordConfirm'],
    })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      notifySuccess(
        t('auth.changePassword.successTitle'),
        t('auth.changePassword.successDescription')
      )
      reset()
      onSuccess?.()
    },
    onError: (error: unknown) => {
      const title = t('auth.changePassword.errors.title')
      if (isApiError(error)) {
        if (error.status === 401) {
          notifyError(title, t('auth.changePassword.errors.wrongCurrent'))
          return
        }
        if (error.status === 400) {
          notifyError(title, t('auth.changePassword.errors.validation'))
          return
        }
        notifyError(title, error.message)
      } else {
        notifyError(title, t('auth.changePassword.errors.network'))
      }
    },
  })

  const loading = isSubmitting || mutation.isPending

  const onSubmit = (values: ChangePasswordFormValues) => {
    mutation.mutate(values)
  }

  return (
    <Form
      layout="vertical"
      onFinish={rhfAntdOnFinish(handleSubmit, onSubmit)}
      style={{ width: 420, maxWidth: '100%' }}
    >
      <Form.Item
        label={t('auth.changePassword.currentPassword')}
        validateStatus={errors.currentPassword ? 'error' : ''}
        help={errors.currentPassword?.message}
      >
        <Controller
          name="currentPassword"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              autoComplete="current-password"
              placeholder={t('auth.form.passwordPlaceholder')}
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label={t('auth.changePassword.newPassword')}
        validateStatus={errors.newPassword ? 'error' : ''}
        help={errors.newPassword?.message}
      >
        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              autoComplete="new-password"
              placeholder={t('auth.registerForm.passwordPlaceholder')}
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label={t('auth.changePassword.newPasswordConfirm')}
        validateStatus={errors.newPasswordConfirm ? 'error' : ''}
        help={errors.newPasswordConfirm?.message}
      >
        <Controller
          name="newPasswordConfirm"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              autoComplete="new-password"
              placeholder={t('auth.registerForm.passwordConfirmationPlaceholder')}
            />
          )}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => reset()} disabled={!isDirty || loading}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitLabel ?? t('auth.changePassword.submit')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

