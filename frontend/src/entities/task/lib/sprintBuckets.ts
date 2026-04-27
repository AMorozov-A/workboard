import dayjs, { type Dayjs } from 'dayjs'
import type { Task } from '@entities/task/model/types'

export const SPRINT_DAYS = 14 as const

export type SprintBucketKey = 'overdue' | 'this_week' | 'next_week' | 'later_or_no_date'

export const SPRINT_BUCKET_ORDER: SprintBucketKey[] = [
  'overdue',
  'this_week',
  'next_week',
  'later_or_no_date',
]

type BucketArgs = {
  todayStart: Dayjs
  due: Dayjs | null
}

const getBucket = ({ todayStart, due }: BucketArgs): SprintBucketKey => {
  if (!due) return 'later_or_no_date'

  const dueStart = due.startOf('day')
  if (dueStart.isBefore(todayStart)) return 'overdue'

  const startNextWeek = todayStart.add(7, 'day')
  const startAfterSprint = todayStart.add(SPRINT_DAYS, 'day')

  if (dueStart.isBefore(startNextWeek)) return 'this_week'
  if (dueStart.isBefore(startAfterSprint)) return 'next_week'
  return 'later_or_no_date'
}

export const getTaskSprintBucket = (
  task: Pick<Task, 'dueDate'>,
  referenceDate: Dayjs = dayjs(),
): SprintBucketKey => {
  const todayStart = referenceDate.startOf('day')
  const due = task.dueDate ? dayjs(task.dueDate) : null
  const dueValid = due && due.isValid() ? due : null

  return getBucket({ todayStart, due: dueValid })
}

