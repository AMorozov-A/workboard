import { changePasswordRequest } from '@features/auth/session'
import { zodResolver } from '@hookform/resolvers/zod'
import { isApiError } from '@shared/api/errors'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Modal } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

type ChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
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
    formState: { errors, isSubmitting },
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
      onClose()
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

  const onSubmit = (values: ChangePasswordFormValues) => {
    mutation.mutate(values)
  }

  const loading = isSubmitting || mutation.isPending

  const handleCancel = () => {
    if (!loading) {
      reset()
      onClose()
    }
  }

  return (
    <Modal
      title={t('auth.changePassword.title')}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      afterClose={() => reset()}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
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
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('auth.changePassword.submit')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
