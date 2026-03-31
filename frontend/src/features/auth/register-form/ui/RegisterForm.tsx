import { loginSuccess } from '@app/store/authSlice'
import { fetchProjects, projectsQueryKey } from '@entities/project/api'
import { registerRequest } from '@features/auth/session'
import { zodResolver } from '@hookform/resolvers/zod'
import { routes } from '@shared/config/routes'
import { isApiError } from '@shared/api/errors'
import { useAppDispatch } from '@shared/lib/store'
import { notifyError } from '@shared/ui/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

type RegisterFormValues = {
  email: string
  password: string
  passwordConfirmation: string
  name: string
}

export const RegisterForm = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const schema = z
    .object({
      email: z.string().email(t('auth.validation.email')),
      password: z.string().min(8, t('auth.validation.passwordMin8')),
      passwordConfirmation: z.string().min(1, t('auth.validation.passwordConfirmationRequired')),
      name: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: t('auth.validation.passwordMismatch'),
      path: ['passwordConfirmation'],
    })

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
      name: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerRequest({
        email: values.email,
        password: values.password,
        name: values.name.trim() || undefined,
      }),
    onSuccess: async (data) => {
      dispatch(
        loginSuccess({
          accessToken: data.accessToken,
          user: data.user,
        })
      )
      try {
        await queryClient.prefetchQuery({
          queryKey: projectsQueryKey,
          queryFn: fetchProjects,
        })
        void navigate(routes.projects)
      } catch {
        notifyError(
          t('auth.errors.projectsLoadFailed'),
          t('auth.errors.projectsLoadFailedDescription')
        )
      }
    },
    onError: (error: unknown) => {
      const title = t('auth.errors.registerFailed')
      if (isApiError(error)) {
        if (error.status === 409) {
          notifyError(title, t('auth.errors.emailTaken'))
        } else if (error.status === 400) {
          notifyError(title, error.message)
        } else {
          notifyError(title, error.message)
        }
      } else {
        notifyError(title, t('auth.errors.network'))
      }
    },
  })

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values)
  }

  const loading = isSubmitting || registerMutation.isPending

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item
        label={t('auth.registerForm.email')}
        validateStatus={errors.email ? 'error' : ''}
        help={errors.email?.message}
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={t('auth.registerForm.emailPlaceholder')}
              autoComplete="email"
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label={t('auth.registerForm.name')}
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={t('auth.registerForm.namePlaceholder')}
              autoComplete="name"
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label={t('auth.registerForm.password')}
        validateStatus={errors.password ? 'error' : ''}
        help={errors.password?.message}
      >
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              placeholder={t('auth.registerForm.passwordPlaceholder')}
              autoComplete="new-password"
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label={t('auth.registerForm.passwordConfirmation')}
        validateStatus={errors.passwordConfirmation ? 'error' : ''}
        help={errors.passwordConfirmation?.message}
      >
        <Controller
          name="passwordConfirmation"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              placeholder={t('auth.registerForm.passwordConfirmationPlaceholder')}
              autoComplete="new-password"
            />
          )}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          {t('auth.registerForm.submit')}
        </Button>
      </Form.Item>
    </Form>
  )
}
