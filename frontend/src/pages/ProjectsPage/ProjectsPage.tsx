import { useCreateProjectMutation, useProjectsQuery, useUpdateProjectMutation } from '@entities/project/api'
import { getProjectStatusTag } from '@entities/project/lib/presentation'
import type { Project } from '@entities/project/types'
import {
  CreateProjectButton,
  CreateProjectModal,
  useCreateProjectModal,
} from '@features/project/create'
import { DeleteProjectButton } from '@features/project/delete'
import { EditProjectModal, useEditProjectModal } from '@features/project/edit'
import { routes } from '@shared/config/routes'
import { formatLocaleDate } from '@shared/lib/i18n'
import { ContentState } from '@shared/ui'
import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Skeleton, Space, Table, Tooltip, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export const ProjectsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  const handleCreateProject = async (project: Project) => {
    await createProject(project)
  }

  const handleUpdateProject = async (project: Project) => {
    await updateProject({ projectId: project.id, project })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
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
          action={
            <CreateProjectButton onClick={openModal} />
          }
        />
      )
    }

    return (
      <Table<Project>
        rowKey="id"
        dataSource={data}
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('projects.table.empty') }}
        onRow={(record) => ({
          onClick: () => navigate(routes.project(record.key)),
          style: { cursor: 'pointer' },
        })}
        columns={[
          {
            title: t('projects.table.columns.key'),
            dataIndex: 'key',
            width: 120,
            render: (value: string) => (
              <Typography.Text code copyable={{ text: value }}>
                {value}
              </Typography.Text>
            ),
          },
          {
            title: t('projects.table.columns.project'),
            dataIndex: 'name',
            render: (_, project) => (
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{project.name}</Typography.Text>
                <Typography.Text type="secondary">
                  {project.description ?? t('projects.table.descriptionFallback')}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: t('projects.table.columns.client'),
            dataIndex: 'client',
            render: (value?: string) => value ?? t('common.notSpecified'),
          },
          {
            title: t('projects.table.columns.status'),
            dataIndex: 'status',
            render: (value?: Project['status']) => getProjectStatusTag(value),
          },
          {
            title: t('projects.table.columns.deadline'),
            dataIndex: 'deadline',
            render: (value?: string) => formatLocaleDate(value),
          },
          {
            title: t('projects.table.columns.actions'),
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
              <Space onClick={(e) => e.stopPropagation()}>
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

  return (
    <Card data-testid="projects-page-root">
      <Space direction="vertical" size={24} style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {t('projects.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
              {t('projects.description')}
            </Typography.Paragraph>
          </div>
          <CreateProjectButton onClick={openModal} />
        </div>
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
    </Card>
  )
}
