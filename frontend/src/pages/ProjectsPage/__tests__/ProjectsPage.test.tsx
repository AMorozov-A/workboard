import type { Project } from '@entities/project/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  renderWithProviders,
  screen,
  testI18n,
  userEvent,
  within,
} from '../../../../tests/test-utils'
import { ProjectsPage } from '../ProjectsPage'

const mockUseProjectsQuery = vi.fn()
const mockUseCreateProjectMutation = vi.fn()
const mockMutateAsync = vi.fn()

vi.mock('@entities/project/api', () => ({
  projectsQueryKey: ['projects'] as const,
  projectDetailQueryKey: (id: string) => ['project', id] as const,
  useProjectsQuery: () => mockUseProjectsQuery(),
  useCreateProjectMutation: () => mockUseCreateProjectMutation(),
  useDeleteProjectMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
  useUpdateProjectMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
  fetchProjects: vi.fn(),
  fetchProjectById: vi.fn(),
}))

const sampleProject: Project = {
  id: 'p1',
  key: 'proj-1',
  name: 'Alpha CRM',
  client: 'Bright Agency',
  status: 'active',
  budget: 12_500,
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateProjectMutation.mockReturnValue({
      mutateAsync: mockMutateAsync.mockResolvedValue(undefined),
    })
  })

  it('корневой контейнер помечен data-testid для сценариев e2e и регрессии', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByTestId('projects-page-root')).toBeInTheDocument()
  })

  it('показывает loading — заголовок и описание загрузки', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText(testI18n.t('projects.loading.title'))).toBeInTheDocument()
    expect(screen.getByText(testI18n.t('projects.loading.description'))).toBeInTheDocument()
  })

  it('показывает empty — текст пустого состояния и кнопка создания', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText(testI18n.t('projects.empty.title'))).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: testI18n.t('projects.actions.create') })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('в шапке есть кнопка создания при непустом списке', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [sampleProject],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<ProjectsPage />)

    const buttons = screen.getAllByRole('button', { name: testI18n.t('projects.actions.create') })
    expect(buttons.length).toBe(1)
    expect(screen.getByText('Alpha CRM')).toBeInTheDocument()
    expect(screen.getByText('Bright Agency')).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: testI18n.t('projects.table.columns.budget') })
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation')).getByText(testI18n.t('projects.breadcrumb.current'))
    ).toHaveClass('crm-breadcrumb-current')
  })

  it('в строке таблицы есть действия редактирования и удаления', () => {
    mockUseProjectsQuery.mockReturnValue({
      data: [sampleProject],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByTestId('edit-project-p1')).toBeInTheDocument()
    expect(screen.getByTestId('delete-project-p1')).toBeInTheDocument()
  })

  it('ошибка запроса — Retry вызывает refetch', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    mockUseProjectsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText(testI18n.t('projects.error.title'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: testI18n.t('common.retry') }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
