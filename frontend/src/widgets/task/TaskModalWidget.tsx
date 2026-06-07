import {
  useCreateTaskNoteMutation,
  useDeleteTaskNoteMutation,
  useTaskNotesList,
  useUpdateTaskNoteMutation,
} from '@entities/task-note'
import {
  formatTaskDate,
  getTaskDateInputFormat,
  getTaskPriorityOptions,
  getTaskStatusOptions,
} from '@entities/task/lib/presentation'
import type { Task, TaskPriority, TaskStatus } from '@entities/task/model/types'
import { TagPicker } from '@entities/tag'
import { DeleteTaskButton } from '@features/task/delete'
import { formatLocaleDateTime } from '@shared/lib/i18n'
import { notifyError, notifySuccess } from '@shared/ui'
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, DatePicker, Select, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChecklistSection } from './ChecklistSection'

import {
  CloseIconButton,
  ContentGrid,
  DeleteAction,
  DescriptionTextArea,
  FileRemoveButton,
  HeaderActions,
  HeaderSaveButton,
  HeaderTitleBlock,
  LabelsRow,
  MainColumn,
  MetaDivider,
  MetaField,
  MetaFieldLabel,
  MetaRow,
  ModalBody,
  ModalHeader,
  ModalShell,
  NoteBody,
  NoteCard,
  NoteHeadLeft,
  NoteKey,
  NoteTitleInput,
  NoteComposer,
  NoteEditActions,
  NoteEditArea,
  NoteFooterRow,
  NoteHeadRow,
  NoteEditorWrap,
  NoteTextArea,
  NoteTime,
  NoteTitle,
  NotesList,
  Section,
  SectionHeadingRow,
  SectionLabel,
  SectionUnderline,
  SideColumn,
  StatusDot,
  StatusOptionRow,
  TaskDrawerStyled,
  TaskMeta,
  TitleInput,
} from './TaskModalWidget.styles'

type TaskModalWidgetProps = {
  open: boolean
  mode: 'create' | 'edit'
  task?: Task | null
  projectId: string
  tasksQueryKey: string
  onClose: () => void
  onCreate?: (task: Task) => void | Promise<void>
  onSave?: (task: Task) => void | Promise<void>
  onTaskDeleted?: () => void
}

const NOTE_BODY_MAX_LEN = 4000
const NOTE_TITLE_MAX_LEN = 160
const TASK_MODAL_HEIGHT = '72vh'

const createTaskId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}`

const buildEmptyDraft = (projectId: string): Task => ({
  id: '',
  key: '',
  title: '',
  description: undefined,
  status: 'todo',
  priority: 'medium',
  dueDate: undefined,
  labels: undefined,
  tagIds: [],
  projectId,
  createdBy: 'freelancer',
  createdAt: undefined,
  updatedAt: undefined,
})

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-text-faint)',
  in_progress: 'var(--color-primary)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)',
}

const PRIORITY_TAG_COLOR: Record<TaskPriority, string> = {
  low: 'default',
  medium: 'gold',
  high: 'red',
}

const getSubmitErrorTexts = (
  mode: 'create' | 'edit',
  t: (key: string) => string
) => {
  if (mode === 'create') {
    return {
      title: t('tasks.notifications.createErrorTitle'),
      description: t('tasks.notifications.createErrorDescription'),
    }
  }
  return {
    title: t('tasks.notifications.updateErrorTitle'),
    description: t('tasks.notifications.updateErrorDescription'),
  }
}

type EditingNoteState = {
  noteId: string
  text: string
  title: string
  originalText: string
  originalTitle: string
}

export const TaskModalWidget = ({
  open,
  mode,
  task,
  projectId,
  tasksQueryKey,
  onClose,
  onCreate,
  onSave,
  onTaskDeleted,
}: TaskModalWidgetProps) => {
  const { t } = useTranslation()

  const [draft, setDraft] = useState<Task>(() =>
    mode === 'edit' && task ? task : buildEmptyDraft(projectId),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [noteDraftText, setNoteDraftText] = useState('')
  const [editingNote, setEditingNote] = useState<EditingNoteState | null>(null)

  const skipNoteBlurRef = useRef(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && task) {
      setDraft(task)
    } else {
      setDraft(buildEmptyDraft(projectId))
    }
    setNoteDraftText('')
    setEditingNote(null)
  }, [open, mode, task, projectId])

  const taskIdForQueries = mode === 'edit' ? task?.id ?? '' : ''

  const { data: notes = [] } = useTaskNotesList(taskIdForQueries)
  const createNoteMutation = useCreateTaskNoteMutation(taskIdForQueries)
  const updateNoteMutation = useUpdateTaskNoteMutation(taskIdForQueries)
  const deleteNoteMutation = useDeleteTaskNoteMutation(taskIdForQueries)

  const statusOptions = getTaskStatusOptions()
  const priorityOptions = getTaskPriorityOptions()

  const isSaveDisabled = !draft.title?.trim() || isSubmitting

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleSubmit = async () => {
    if (isSaveDisabled) return
    const now = new Date().toISOString()

    try {
      setIsSubmitting(true)
      if (mode === 'create') {
        await Promise.resolve(
          onCreate?.({
            ...draft,
            id: draft.id || createTaskId(),
            title: draft.title.trim(),
            description: draft.description?.trim() || undefined,
            projectId,
            createdAt: now,
            updatedAt: now,
          }),
        )
        notifySuccess(
          t('tasks.notifications.createdTitle'),
          t('tasks.notifications.createdDescription'),
        )
      } else {
        await Promise.resolve(
          onSave?.({
            ...draft,
            title: draft.title.trim(),
            description: draft.description?.trim() || undefined,
            updatedAt: now,
            createdAt: draft.createdAt ?? now,
          }),
        )
        notifySuccess(
          t('tasks.notifications.updatedTitle'),
          t('tasks.notifications.updatedDescription'),
        )
      }
      onClose()
    } catch {
      const { title, description } = getSubmitErrorTexts(mode, t)
      notifyError(title, description)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitNewNote = async (rawText: string) => {
    const text = rawText.trim()
    if (!text || mode !== 'edit' || !taskIdForQueries) return
    try {
      await createNoteMutation.mutateAsync({ body: text })
      setNoteDraftText('')
    } catch {
      notifyError(
        t('tasks.notifications.updateErrorTitle'),
        t('tasks.notifications.updateErrorDescription'),
      )
    }
  }

  const handleNoteBlur = () => {
    if (skipNoteBlurRef.current) {
      skipNoteBlurRef.current = false
      return
    }
    if (noteDraftText.trim()) {
      void submitNewNote(noteDraftText)
    }
  }

  const startEditingNote = (note: {
    id: string
    body: string
    title: string | null
  }) => {
    setEditingNote({
      noteId: note.id,
      text: note.body,
      title: note.title ?? '',
      originalText: note.body,
      originalTitle: note.title ?? '',
    })
  }

  const cancelEditingNote = () => {
    setEditingNote(null)
  }

  const handleSaveEditedNote = async () => {
    if (!editingNote) return
    const text = editingNote.text.trim()
    const title = editingNote.title.trim()
    if (!text) return
    const bodyChanged = text !== editingNote.originalText.trim()
    const titleChanged = title !== editingNote.originalTitle.trim()
    if (!bodyChanged && !titleChanged) {
      cancelEditingNote()
      return
    }
    try {
      await updateNoteMutation.mutateAsync({
        noteId: editingNote.noteId,
        dto: { body: text, title: title.length > 0 ? title : null },
      })
      cancelEditingNote()
    } catch {
      notifyError(
        t('tasks.notifications.updateErrorTitle'),
        t('tasks.notifications.updateErrorDescription'),
      )
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (mode !== 'edit' || !taskIdForQueries) return
    try {
      await deleteNoteMutation.mutateAsync(noteId)
    } catch {
      notifyError(
        t('tasks.notifications.updateErrorTitle'),
        t('tasks.notifications.updateErrorDescription'),
      )
    }
  }

  const renderStatusOption = (status: TaskStatus, label: string) => (
    <StatusOptionRow>
      <StatusDot aria-hidden $color={STATUS_COLORS[status]} />
      {label}
    </StatusOptionRow>
  )

  const renderHeader = () => {
    const isCreate = mode === 'create'

    const metaLabel = !isCreate && (draft.key || draft.id) ? `${draft.key || draft.id}` : null

    return (
      <ModalHeader>
        <HeaderTitleBlock>{metaLabel ? <TaskMeta>{metaLabel}</TaskMeta> : null}</HeaderTitleBlock>
        <HeaderActions>
          <HeaderSaveButton
            type="primary"
            onClick={() => void handleSubmit()}
            disabled={isSaveDisabled}
            loading={isSubmitting}
          >
            {isCreate ? t('tasks.modal.submit') : t('common.save')}
          </HeaderSaveButton>
          <CloseIconButton
            type="text"
            icon={<CloseOutlined />}
            aria-label={t('tasks.detailModal.closeAria')}
            onClick={handleClose}
          />
        </HeaderActions>
      </ModalHeader>
    )
  }

  const renderNotesSection = () => {
    const canManage = mode === 'edit' && !!taskIdForQueries

    return (
      <Section>
        <SectionHeadingRow>
          <div>
            <SectionLabel>{t('tasks.detailModal.sections.notes')}</SectionLabel>
            <SectionUnderline />
          </div>
        </SectionHeadingRow>

        {canManage && notes.length > 0 ? (
          <NotesList>
            {notes.map((note) => {
              const isEditing = editingNote?.noteId === note.id
              const canSubmit =
                isEditing &&
                editingNote &&
                editingNote.text.trim().length > 0 &&
                (editingNote.text.trim() !== editingNote.originalText.trim() ||
                  editingNote.title.trim() !== editingNote.originalTitle.trim())
              return (
                <NoteCard
                  key={note.id}
                  $editing={isEditing}
                  $clickable={!isEditing}
                  onClick={() => {
                    if (!isEditing) startEditingNote(note)
                  }}
                >
                  <NoteHeadRow>
                    <NoteHeadLeft>
                      <NoteKey>{note.key}</NoteKey>
                      {isEditing ? (
                        <NoteTitleInput
                          value={editingNote?.title ?? ''}
                          onChange={(e) =>
                            setEditingNote((prev) =>
                              prev ? { ...prev, title: e.target.value } : prev,
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t('tasks.detailModal.notes.titlePlaceholder')}
                          maxLength={NOTE_TITLE_MAX_LEN}
                          disabled={updateNoteMutation.isPending}
                          aria-label={t('tasks.detailModal.notes.titlePlaceholder')}
                        />
                      ) : (
                        <NoteTitle>
                          {note.title?.trim() || t('tasks.detailModal.notes.untitled')}
                        </NoteTitle>
                      )}
                    </NoteHeadLeft>
                    <NoteTime>{formatLocaleDateTime(note.createdAt)}</NoteTime>
                  </NoteHeadRow>
                  {isEditing ? (
                    <>
                      <NoteEditorWrap onClick={(e) => e.stopPropagation()}>
                        <NoteEditArea
                          value={editingNote?.text ?? ''}
                          onChange={(e) =>
                            setEditingNote((prev) =>
                              prev ? { ...prev, text: e.target.value } : prev,
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              cancelEditingNote()
                              return
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              void handleSaveEditedNote()
                            }
                          }}
                          autoSize={{ minRows: 2, maxRows: 10 }}
                          maxLength={NOTE_BODY_MAX_LEN}
                          disabled={updateNoteMutation.isPending}
                          aria-label={t('tasks.detailModal.sections.notes')}
                        />
                      </NoteEditorWrap>
                      <NoteEditActions onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          onClick={cancelEditingNote}
                          disabled={updateNoteMutation.isPending}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => void handleSaveEditedNote()}
                          disabled={!canSubmit || updateNoteMutation.isPending}
                          loading={updateNoteMutation.isPending}
                        >
                          {t('common.save')}
                        </Button>
                      </NoteEditActions>
                    </>
                  ) : (
                    <>
                      <NoteBody>{note.body}</NoteBody>
                      <NoteFooterRow onClick={(e) => e.stopPropagation()}>
                        <FileRemoveButton
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={t('tasks.detailModal.notes.removeAria')}
                          onClick={() => void handleDeleteNote(note.id)}
                          loading={
                            deleteNoteMutation.isPending &&
                            deleteNoteMutation.variables === note.id
                          }
                        />
                      </NoteFooterRow>
                    </>
                  )}
                </NoteCard>
              )
            })}
          </NotesList>
        ) : null}

        {canManage ? (
          <NoteComposer>
            <NoteEditorWrap onBlur={handleNoteBlur}>
              <NoteTextArea
                value={noteDraftText}
                onChange={(e) => setNoteDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    skipNoteBlurRef.current = true
                    setNoteDraftText('')
                    return
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    skipNoteBlurRef.current = true
                    void submitNewNote(noteDraftText)
                  }
                }}
                placeholder={t('tasks.detailModal.notes.addPlaceholder')}
                autoSize={{ minRows: 2, maxRows: 10 }}
                maxLength={NOTE_BODY_MAX_LEN}
                disabled={createNoteMutation.isPending}
                aria-label={t('tasks.detailModal.sections.notes')}
              />
            </NoteEditorWrap>
          </NoteComposer>
        ) : null}
      </Section>
    )
  }

  const renderSideColumn = () => (
    <SideColumn aria-label={t('tasks.detailModal.sections.details')}>
      <MetaField>
        <MetaFieldLabel id="task-status-label">{t('tasks.form.status')}</MetaFieldLabel>
        <Select<TaskStatus>
          aria-labelledby="task-status-label"
          value={draft.status}
          onChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}
          options={statusOptions.map((opt) => ({
            value: opt.value,
            label: renderStatusOption(opt.value, opt.label),
          }))}
        />
      </MetaField>

      <MetaField>
        <MetaFieldLabel id="task-priority-label">{t('tasks.form.priority')}</MetaFieldLabel>
        <Select<TaskPriority>
          aria-labelledby="task-priority-label"
          value={draft.priority}
          onChange={(value) => setDraft((prev) => ({ ...prev, priority: value }))}
          options={priorityOptions.map((opt) => ({
            value: opt.value,
            label: <Tag color={PRIORITY_TAG_COLOR[opt.value]}>{opt.label}</Tag>,
          }))}
        />
      </MetaField>

      <MetaField>
        <MetaFieldLabel id="task-deadline-label">{t('tasks.form.deadline')}</MetaFieldLabel>
        <DatePicker
          aria-labelledby="task-deadline-label"
          value={draft.dueDate ? dayjs(draft.dueDate) : null}
          onChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              dueDate: value ? value.format('YYYY-MM-DD') : undefined,
            }))
          }
          format={getTaskDateInputFormat()}
          placeholder={t('tasks.form.deadlinePlaceholder')}
          style={{ width: '100%' }}
        />
      </MetaField>

      <MetaField>
        <MetaFieldLabel id="task-tags-label">{t('tasks.form.tags')}</MetaFieldLabel>
        <LabelsRow>
          <TagPicker
            ariaLabelledBy="task-tags-label"
            value={draft.tagIds ?? []}
            onChange={(tagIds) => setDraft((prev) => ({ ...prev, tagIds }))}
            placeholder={t('tasks.form.tagsPlaceholder')}
            disabled={isSubmitting}
          />
        </LabelsRow>
      </MetaField>

      <MetaDivider />

      <MetaField>
        <MetaRow>
          <span>{t('tasks.form.createdAt')}</span>
          <span>{formatTaskDate(draft.createdAt)}</span>
        </MetaRow>
        <MetaRow>
          <span>{t('tasks.form.updatedAt')}</span>
          <span>{formatTaskDate(draft.updatedAt)}</span>
        </MetaRow>
      </MetaField>

      {mode === 'edit' && task ? (
        <DeleteAction>
          <DeleteTaskButton
            task={task}
            tasksQueryKey={tasksQueryKey}
            onDeleted={() => {
              onClose()
              onTaskDeleted?.()
            }}
          />
        </DeleteAction>
      ) : null}
    </SideColumn>
  )

  return (
    <TaskDrawerStyled
      open={open}
      onClose={handleClose}
      placement="bottom"
      height={TASK_MODAL_HEIGHT}
      closable={false}
      destroyOnClose
      maskClosable={!isSubmitting}
      keyboard
      rootClassName="task-detail-modal"
    >
      <ModalShell>
        {renderHeader()}
        <ModalBody>
          <ContentGrid>
            <MainColumn>
              <Section>
                <TitleInput
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('tasks.detailModal.sections.title')}
                  autoFocus={mode === 'create'}
                  aria-label={t('tasks.form.title')}
                  bordered={false}
                />
              </Section>

              <Section>
                <DescriptionTextArea
                  value={draft.description ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: e.target.value || undefined,
                    }))
                  }
                  placeholder={t('tasks.detailModal.sections.description')}
                  autoSize={{ minRows: 4, maxRows: 14 }}
                  aria-label={t('tasks.form.description')}
                  bordered={false}
                />
              </Section>

              {mode === 'edit' && taskIdForQueries ? (
                <Section>
                  <ChecklistSection taskId={taskIdForQueries} />
                </Section>
              ) : null}

              {renderNotesSection()}
            </MainColumn>

            {renderSideColumn()}
          </ContentGrid>
        </ModalBody>
      </ModalShell>
    </TaskDrawerStyled>
  )
}
