import { loginSuccess } from '@app/store/authSlice'
import { fetchProjects, projectsQueryKey } from '@entities/project/api'
import { loginRequest } from '@features/auth/session'
import { zodResolver } from '@hookform/resolvers/zod'
import { rhfAntdOnFinish } from '@shared/lib/form/rhfAntdFormSubmit'
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

type LoginFormValues = {
  email: string
  password: string
}

export const LoginForm = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const schema = z.object({
    email: z.string().email(t('auth.validation.email')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  })
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginRequest(values.email, values.password),
    onSuccess: async (data) => {
      dispatch(
        loginSuccess({
          accessToken: data.accessToken,
          user: data.user,
        })
      )
      try {
        await queryClient.fetchQuery({
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
      const title = t('auth.errors.loginFailed')
      if (isApiError(error)) {
        if (error.status === 401) {
          notifyError(title, t('auth.validation.invalidCredentials'))
        } else {
          notifyError(title, error.message)
        }
      } else {
        notifyError(title, t('auth.errors.network'))
      }
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }

  const loading = isSubmitting || loginMutation.isPending

  return (
    <Form layout="vertical" onFinish={rhfAntdOnFinish(handleSubmit, onSubmit)}>
      <Form.Item
        label={t('auth.form.email')}
        validateStatus={errors.email ? 'error' : ''}
        help={errors.email?.message}
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={t('auth.form.emailPlaceholder')}
              autoComplete="email"
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label={t('auth.form.password')}
        validateStatus={errors.password ? 'error' : ''}
        help={errors.password?.message}
      >
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              placeholder={t('auth.form.passwordPlaceholder')}
              autoComplete="current-password"
            />
          )}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          {t('auth.form.submit')}
        </Button>
      </Form.Item>
    </Form>
  )
}
