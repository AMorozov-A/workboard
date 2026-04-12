import i18n from '@shared/lib/i18n'
import { Tag } from 'antd'
import type { Project } from '../types'

export const getProjectStatusOptions = (): Array<{
  value: NonNullable<Project['status']>
  label: string
}> => [
  { value: 'active', label: i18n.t('projects.status.active') },
  { value: 'paused', label: i18n.t('projects.status.paused') },
  { value: 'done', label: i18n.t('projects.status.done') },
]

export const getProjectStatusLabel = (status?: Project['status']) =>
  getProjectStatusOptions().find((option) => option.value === status)?.label ??
  i18n.t('projects.status.empty')

export const getProjectStatusTag = (status?: Project['status']) => {
  if (status === 'active') return <Tag color="cyan">{i18n.t('projects.status.active')}</Tag>
  if (status === 'paused') return <Tag color="orange">{i18n.t('projects.status.paused')}</Tag>
  if (status === 'done') return <Tag color="default">{i18n.t('projects.status.done')}</Tag>

  return <Tag>{i18n.t('projects.status.empty')}</Tag>
}
