import type { TaskPriority, TaskStatus } from '@entities/task/model/types'
import { formatLocaleDate, getCurrentLanguage, getDateInputFormat } from '@shared/lib/i18n'
import i18n from '@shared/lib/i18n'
import { Tag } from 'antd'

export const getTaskStatusOptions = (): Array<{ value: TaskStatus; label: string }> => [
  { value: 'todo', label: i18n.t('tasks.status.todo') },
  { value: 'in_progress', label: i18n.t('tasks.status.in_progress') },
  { value: 'review', label: i18n.t('tasks.status.review') },
  { value: 'done', label: i18n.t('tasks.status.done') },
]

export const getTaskPriorityOptions = (): Array<{ value: TaskPriority; label: string }> => [
  { value: 'low', label: i18n.t('tasks.priority.low') },
  { value: 'medium', label: i18n.t('tasks.priority.medium') },
  { value: 'high', label: i18n.t('tasks.priority.high') },
]

export const getTaskLabelOptions = () => [
  { value: 'frontend', label: i18n.t('tasks.labels.frontend') },
  { value: 'backend', label: i18n.t('tasks.labels.backend') },
  { value: 'design', label: i18n.t('tasks.labels.design') },
]

export const getTaskStatusLabel = (status?: TaskStatus) =>
  getTaskStatusOptions().find((option) => option.value === status)?.label ??
  i18n.t('common.notSpecified')

export const getTaskPriorityLabel = (priority?: TaskPriority) =>
  getTaskPriorityOptions().find((option) => option.value === priority)?.label ??
  i18n.t('common.notSpecified')

export const getTaskStatusTag = (status?: TaskStatus) => {
  if (status === 'todo') return <Tag>{i18n.t('tasks.status.todo')}</Tag>
  if (status === 'in_progress') return <Tag color="blue">{i18n.t('tasks.status.in_progress')}</Tag>
  if (status === 'review') return <Tag color="gold">{i18n.t('tasks.status.review')}</Tag>
  if (status === 'done') return <Tag color="green">{i18n.t('tasks.status.done')}</Tag>

  return <Tag>{i18n.t('common.notSpecified')}</Tag>
}

export const getTaskPriorityTag = (priority?: TaskPriority) => {
  if (priority === 'low') return <Tag>{i18n.t('tasks.priority.low')}</Tag>
  if (priority === 'medium') return <Tag color="gold">{i18n.t('tasks.priority.medium')}</Tag>
  if (priority === 'high') return <Tag color="red">{i18n.t('tasks.priority.high')}</Tag>

  return <Tag>{i18n.t('common.notSpecified')}</Tag>
}

export const formatTaskDate = (value?: string) =>
  formatLocaleDate(value)

export const getTaskDateInputFormat = () => getDateInputFormat(getCurrentLanguage())
