import { useCreateProjectMutation, useProjectsQuery, useUpdateProjectMutation } from '@entities/project/api'
import type { Project } from '@entities/project/types'
import {
  CreateProjectModal,
  useCreateProjectModal,
} from '@features/project/create'
import { DeleteProjectButton } from '@features/project/delete'
import { EditProjectModal, useEditProjectModal } from '@features/project/edit'
import { routes } from '@shared/config/routes'
import { APP_CONTEXT_ACTION_EVENT, APP_CONTEXT_ACTIONS } from '@shared/config/appContextActions'
import { formatLocaleDate } from '@shared/lib/i18n'
import { useAppSelector } from '@shared/lib/store'
import { ContentState, GroupedSections } from '@shared/ui'
import { EditOutlined } from '@ant-design/icons'
import { Button, Skeleton, Space, Table, Tooltip, Typography } from 'antd'
import { CheckCircle2, Circle, Info, PauseCircle, PlayCircle, Plus } from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  BreadcrumbCurrent,
  ProjectsBreadcrumb,
  ProjectsHeaderLeft,
  ProjectsHeaderRight,
  ProjectsHeaderRow,
  ProjectsTableShell,
} from './ProjectsPage.styles'

const getUserInitials = (nameOrEmail: string | null | undefined): string => {
  const raw = (nameOrEmail ?? '').trim()
  if (!raw) return '?'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
}

const hasOpenCreateProjectFlag = (
  state: unknown
): state is { openCreateProject?: boolean } => {
  if (!state || typeof state !== 'object') return false
  if (!('openCreateProject' in state)) return false
  return typeof (state as { openCreateProject?: unknown }).openCreateProject === 'boolean'
}

const getProjectStatusHeaderMeta = (
  status: NonNullable<Project['status']>
): {
  color: string
  Icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
} => {
  if (status === 'active') return { color: 'var(--color-primary)', Icon: PlayCircle }
  if (status === 'paused') return { color: 'var(--color-warning)', Icon: PauseCircle }
  if (status === 'done') return { color: 'var(--color-success)', Icon: CheckCircle2 }
  return { color: 'var(--color-text-muted)', Icon: Circle }
}

export const ProjectsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAppSelector((s) => s.auth.user)
  const { data = [], isLoading, isError, refetch } = useProjectsQuery()
  const { mutateAsync: createProject } = useCreateProjectMutation()
  const { mutateAsync: updateProject } = useUpdateProjectMutation()
  const { isOpen, openModal, closeModal } = useCreateProjectModal()
  const {
    projectToEdit,
    isOpen: isEditOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useEditProjectModal()

  useEffect(() => {
    if (hasOpenCreateProjectFlag(location.state) && location.state.openCreateProject) {
      openModal()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, openModal])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ key: string }>
      const key = custom.detail?.key
      if (!key) return

      if (key === APP_CONTEXT_ACTIONS.projectsCreateProject) {
        openModal()
      }
    }

    window.addEventListener(APP_CONTEXT_ACTION_EVENT, handler as EventListener)
    return () => window.removeEventListener(APP_CONTEXT_ACTION_EVENT, handler as EventListener)
  }, [openModal])

  const handleCreateProject = async (project: Project) => {
    await createProject(project)
  }

  const handleUpdateProject = async (project: Project) => {
    await updateProject({ projectId: project.id, project })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
          <div>
            <Typography.Text strong>{t('projects.loading.title')}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              {t('projects.loading.description')}
            </Typography.Paragraph>
          </div>
          <Skeleton active title={{ width: '28%' }} paragraph={{ rows: 5 }} />
        </Space>
      )
    }

    if (isError) {
      return (
        <ContentState
          variant="error"
          title={t('projects.error.title')}
          description={t('projects.error.description')}
          action={
            <Button type="primary" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      )
    }

    if (data.length === 0) {
      return (
        <ContentState
          variant="empty"
          title={t('projects.empty.title')}
          description={t('projects.empty.description')}
        />
      )
    }

    const statusOrder: Array<NonNullable<Project['status']>> = ['active', 'paused', 'done']
    const statusGroups = statusOrder.map((status) => {
      const { color, Icon } = getProjectStatusHeaderMeta(status)
      return {
        key: status,
        label: t(`projects.status.${status}`),
        emptyText: t('projects.table.empty'),
        color,
        Icon,
      }
    })

    return (
      <ProjectsTableShell className="crm-projects-table-root">
        <GroupedSections<Project, NonNullable<Project['status']>>
          groups={statusGroups}
          items={data}
          groupBy={(project) => project.status ?? 'active'}
          renderGroupBody={({ groupItems, group }) =>
            groupItems.length === 0 ? (
              <div style={{ padding: '6px 0' }}>
                <Typography.Text type="secondary">{group.emptyText}</Typography.Text>
              </div>
            ) : (
              <Table<Project>
                rowKey="id"
                dataSource={groupItems}
                pagination={false}
                showHeader={false}
                size="middle"
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: null }}
                onRow={(record) => ({
                  onClick: () => navigate(routes.project(record.key)),
                  style: { cursor: 'pointer' },
                })}
                columns={[
                  {
                    title: t('projects.table.columns.project'),
                    dataIndex: 'name',
                    width: '100%',
                    className: 'crm-project-table-col-title',
                    render: (_, project) => (
                      <Space size={10} align="center">
                        <Typography.Text
                          style={{
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.02em',
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                            fontSize: 'var(--font-size-caption)',
                          }}
                        >
                          {project.key || '—'}
                        </Typography.Text>
                        <Typography.Text strong style={{ fontSize: 'var(--font-size-sm)' }}>
                          {project.name}
                        </Typography.Text>
                      </Space>
                    ),
                  },
                  {
                    title: t('projects.table.columns.actions'),
                    key: 'actions',
                    width: 120,
                    fixed: 'right',
                    className: 'crm-project-table-col-actions',
                    render: (_, record) => (
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Tooltip
                          title={
                            <Space orientation="vertical" size={2}>
                              <Typography.Text style={{ fontSize: 'var(--font-size-caption)' }}>
                                {t('projects.form.taskKeyPrefix')}: {record.taskKeyPrefix || '—'}
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: 'var(--font-size-caption)' }}>
                                {t('projects.table.columns.client')}:{' '}
                                {record.client ? record.client : '—'}
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: 'var(--font-size-caption)' }}>
                                {t('projects.table.columns.deadline')}:{' '}
                                {record.deadline ? formatLocaleDate(record.deadline) : '—'}
                              </Typography.Text>
                            </Space>
                          }
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<Info size={14} aria-hidden />}
                            aria-label={t('projects.table.columns.key')}
                          />
                        </Tooltip>
                        <Tooltip title={t('projects.actions.edit')}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            aria-label={t('projects.actions.edit')}
                            data-testid={`edit-project-${record.id}`}
                            onClick={() => openEditModal(record)}
                          />
                        </Tooltip>
                        <DeleteProjectButton project={record} />
                      </Space>
                    ),
                  },
                ]}
              />
            )
          }
        />
      </ProjectsTableShell>
    )
  }

  return (
    <div data-testid="projects-page-root">
      <Space orientation="vertical" size={24} style={{ display: 'flex', width: '100%' }}>
        <ProjectsHeaderRow>
          <ProjectsHeaderLeft>
            <ProjectsBreadcrumb
              items={[
                {
                  title: (
                    <Space size={6}>
                      <Link to={routes.projects}>{t('projects.breadcrumb.workspace')}</Link>
                    </Space>
                  ),
                },
                {
                  title: (
                    <BreadcrumbCurrent>
                      {t('projects.breadcrumb.current')}
                    </BreadcrumbCurrent>
                  ),
                },
              ]}
            />
          </ProjectsHeaderLeft>
          <ProjectsHeaderRight>
            <Button
              type="text"
              size="small"
              icon={<Plus size={14} aria-hidden />}
              aria-label={t('projects.actions.create')}
              onClick={() => openModal()}
            />
            <Button
              type="text"
              size="small"
              className="projects-page-user-button"
              aria-label={t('layout.openSettings')}
              onClick={() => navigate(routes.profile)}
            >
              <span className="projects-page-user-avatar" aria-hidden>
                {getUserInitials(currentUser?.name || currentUser?.email)}
              </span>
            </Button>
          </ProjectsHeaderRight>
        </ProjectsHeaderRow>
        {renderContent()}
        <CreateProjectModal
          open={isOpen}
          onClose={closeModal}
          onCreate={handleCreateProject}
        />
        <EditProjectModal
          project={projectToEdit}
          open={isEditOpen}
          onClose={closeEditModal}
          onUpdate={handleUpdateProject}
        />
      </Space>
    </div>
  )
}
