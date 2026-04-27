import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../../../../../tests/test-utils'
import { RegisterForm } from './RegisterForm'
import * as sessionApi from '@entities/session'
import { ApiError } from '@shared/api/errors'
import * as notifyModule from '@shared/ui/notify'

const navigateMock = vi.fn()

const { fetchProjectsMock } = vi.hoisted(() => ({
  fetchProjectsMock: vi.fn().mockResolvedValue([]),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...mod,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@entities/session', () => ({
  registerRequest: vi.fn(),
}))

vi.mock('@entities/project/api', () => ({
  projectsQueryKey: ['projects'] as const,
  fetchProjects: fetchProjectsMock,
}))

vi.mock('@shared/ui/notify', () => ({
  initNotifications: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  showErrorMessage: vi.fn(),
}))

const registerRequestMock = vi.mocked(sessionApi.registerRequest)
const notifyErrorMock = vi.mocked(notifyModule.notifyError)

function successResponse() {
  return {
    ok: true as const,
    accessToken: 'test-token',
    tokenType: 'Bearer',
    expiresIn: '7d',
    user: {
      id: 'user-1',
      email: 'new@example.com',
      name: 'Alex',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerRequestMock.mockResolvedValue(successResponse())
    fetchProjectsMock.mockReset()
    fetchProjectsMock.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders registration fields and submit button', () => {
    renderWithProviders(<RegisterForm />)

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Alex')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repeat your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows validation when password confirmation is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Confirm your password')).toBeInTheDocument()
    })
    expect(registerRequestMock).not.toHaveBeenCalled()
  })

  it('показывает ошибку валидации email при невалидном адресе', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    })
    expect(registerRequestMock).not.toHaveBeenCalled()
  })

  it('показывает ошибку при пароле короче 8 символов', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.co')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'short1')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'short1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    })
    expect(registerRequestMock).not.toHaveBeenCalled()
  })

  it('показывает ошибку при несовпадении паролей', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password99')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(registerRequestMock).not.toHaveBeenCalled()
  })

  it('успешный сабмит вызывает registerRequest и navigate', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(registerRequestMock).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password12',
        name: 'Alex',
      })
    })
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/projects')
    })
  })

  it('пустое имя не передаётся в registerRequest', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'only@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(registerRequestMock).toHaveBeenCalledWith({
        email: 'only@example.com',
        password: 'password12',
      })
    })
  })

  it('shows notifyError with server message for 500 ApiError', async () => {
    registerRequestMock.mockRejectedValueOnce(new ApiError(500, 'Internal Server Error'))
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(notifyErrorMock).toHaveBeenCalledWith('Registration failed', 'Internal Server Error')
    })
  })

  it('при 409 показывает notifyError с текстом занятого email', async () => {
    registerRequestMock.mockRejectedValueOnce(
      new ApiError(409, 'Этот email уже зарегистрирован')
    )
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'taken@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(notifyErrorMock).toHaveBeenCalledWith(
        'Registration failed',
        'This email is already registered'
      )
    })
  })

  it('при 400 от API показывает сообщение из ошибки', async () => {
    registerRequestMock.mockRejectedValueOnce(new ApiError(400, 'Укажите корректный email'))
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'ok@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(notifyErrorMock).toHaveBeenCalledWith(
        'Registration failed',
        'Укажите корректный email'
      )
    })
  })

  it('при сетевой ошибке показывает auth.errors.network', async () => {
    registerRequestMock.mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(notifyErrorMock).toHaveBeenCalledWith(
        'Registration failed',
        'Cannot reach the server. Make sure the backend is running and the API URL is correct.'
      )
    })
  })

  it('при ошибке prefetch проектов показывает notifyError про проекты', async () => {
    fetchProjectsMock.mockRejectedValueOnce(new Error('fail'))

    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'pf@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(notifyErrorMock).toHaveBeenCalledWith(
        'Could not load projects',
        'Try again or check your connection to the server.'
      )
    })
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('кнопка в состоянии loading пока запрос не завершился', async () => {
    let finishRegister!: () => void
    const registerPromise = new Promise<ReturnType<typeof successResponse>>((resolve) => {
      finishRegister = () => resolve(successResponse())
    })
    registerRequestMock.mockImplementation(() => registerPromise)

    const user = userEvent.setup()
    const { container } = renderWithProviders(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'slow@example.com')
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password12')
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password12')
    await user.click(container.querySelector('form button[type="submit"]')!)

    await waitFor(() => {
      const btn = container.querySelector('form button[type="submit"]')
      expect(btn).toBeTruthy()
      expect(btn).toHaveClass('ant-btn-loading')
    })

    finishRegister!()

    await waitFor(() => {
      const btn = container.querySelector('form button[type="submit"]')
      expect(btn).not.toHaveClass('ant-btn-loading')
    })
  })
})
