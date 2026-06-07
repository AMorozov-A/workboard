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

export const getProjectPriorityOptions = (): Array<{
  value: NonNullable<Project['priority']>
  label: string
}> => [
  { value: 'low', label: i18n.t('projects.priority.low') },
  { value: 'medium', label: i18n.t('projects.priority.medium') },
  { value: 'high', label: i18n.t('projects.priority.high') },
  { value: 'critical', label: i18n.t('projects.priority.critical') },
]

export const getProjectPriorityTag = (value?: Project['priority']) => {
  if (value === 'critical') return <Tag color="red">{i18n.t('projects.priority.critical')}</Tag>
  if (value === 'high') return <Tag color="volcano">{i18n.t('projects.priority.high')}</Tag>
  if (value === 'medium') return <Tag color="gold">{i18n.t('projects.priority.medium')}</Tag>
  if (value === 'low') return <Tag color="default">{i18n.t('projects.priority.low')}</Tag>
  return <Tag>{i18n.t('common.notSpecified')}</Tag>
}

export const getProjectHealthOptions = (): Array<{
  value: NonNullable<Project['health']>
  label: string
}> => [
  { value: 'on_track', label: i18n.t('projects.health.on_track') },
  { value: 'at_risk', label: i18n.t('projects.health.at_risk') },
  { value: 'off_track', label: i18n.t('projects.health.off_track') },
]

export const getProjectHealthTag = (value?: Project['health']) => {
  if (value === 'on_track') return <Tag color="green">{i18n.t('projects.health.on_track')}</Tag>
  if (value === 'at_risk') return <Tag color="orange">{i18n.t('projects.health.at_risk')}</Tag>
  if (value === 'off_track') return <Tag color="red">{i18n.t('projects.health.off_track')}</Tag>
  return <Tag>{i18n.t('common.notSpecified')}</Tag>
}
