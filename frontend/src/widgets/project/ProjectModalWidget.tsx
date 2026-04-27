import { getProjectStatusOptions } from '@entities/project/lib/presentation'
import type { Project } from '@entities/project/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { rhfAntdOnFinish, textAreaCtrlEnterSubmit } from '@shared/lib/form/rhfAntdFormSubmit'
import { getDateInputFormat } from '@shared/lib/i18n'
import { notifyError, notifySuccess } from '@shared/ui'
import { CloseOutlined } from '@ant-design/icons'
import { DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  CloseIconButton,
  ContentGrid,
  DescriptionTextArea,
  HeaderActions,
  HeaderSaveButton,
  HeaderTitleBlock,
  MainColumn,
  MetaField,
  MetaFieldLabel,
  ModalBody,
  ModalHeader,
  ModalShell,
  Section,
  SectionHeadingRow,
  SectionLabel,
  SectionUnderline,
  SideColumn,
  TaskDrawerStyled,
  TaskMeta,
  TitleInput,
} from '../task/TaskModalWidget.styles'

const PANEL_HEIGHT = '72vh'

const CREATE_PROJECT_FORM_ID = 'workboard-form-create-project'
const EDIT_PROJECT_FORM_ID = 'workboard-form-edit-project'

const createProjectId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `project-${Date.now()}`

const buildCreateSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t('projects.validation.nameRequired')),
    keyPrefix: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .transform((s) => (s === '' ? 'proj' : s))
      .refine((s) => /^[a-z][a-z0-9-]{1,29}$/.test(s), {
        message: t('projects.validation.keyPrefix'),
      }),
    taskKeyPrefix: z
      .string()
      .transform((s) => s.trim().toUpperCase())
      .transform((s) => (s === '' ? 'T' : s))
      .refine((s) => /^[A-Z][A-Z0-9]{0,9}$/.test(s), {
        message: t('projects.validation.taskKeyPrefix'),
      }),
    client: z.string().min(1, t('projects.validation.clientRequired')),
    status: z.enum(['active', 'paused', 'done']),
    budget: z.union([
      z.number().nonnegative(t('projects.validation.budgetNonNegative')),
      z.null(),
      z.undefined(),
    ]),
    deadline: z
      .custom<Dayjs | null>((value) => value == null || dayjs.isDayjs(value))
      .optional(),
    description: z.string().optional(),
  })

type CreateFormValues = z.infer<ReturnType<typeof buildCreateSchema>>

const buildEditSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t('projects.validation.nameRequired')),
    client: z.string().min(1, t('projects.validation.clientRequired')),
    status: z.enum(['active', 'paused', 'done']),
    budget: z.union([
      z.number().nonnegative(t('projects.validation.budgetNonNegative')),
      z.null(),
      z.undefined(),
    ]),
    deadline: z
      .custom<Dayjs | null>((value) => value == null || dayjs.isDayjs(value))
      .optional(),
    description: z.string().optional(),
  })

type EditFormValues = z.infer<ReturnType<typeof buildEditSchema>>

type ProjectCreateModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void | Promise<void>
}

const ProjectCreateBody = ({ open, onClose, onCreate }: ProjectCreateModalProps) => {
  const { t } = useTranslation()
  const formDomId = CREATE_PROJECT_FORM_ID

  const createSchema = buildCreateSchema(t)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      keyPrefix: 'proj',
      taskKeyPrefix: 'T',
      client: '',
      status: 'active',
      budget: null,
      deadline: null,
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset()
    }
  }, [open, reset])

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: CreateFormValues) => {
    try {
      await Promise.resolve(
        onCreate({
          id: createProjectId(),
          key: '',
          keyPrefix: values.keyPrefix,
          taskKeyPrefix: values.taskKeyPrefix,
          name: values.name.trim(),
          client: values.client.trim(),
          status: values.status,
          budget: values.budget ?? undefined,
          deadline: values.deadline?.format ? values.deadline.format('YYYY-MM-DD') : undefined,
          description: values.description?.trim() || undefined,
        })
      )
      notifySuccess(
        t('projects.notifications.createdTitle'),
        t('projects.notifications.createdDescription')
      )
      close()
    } catch {
      notifyError(
        t('projects.notifications.createErrorTitle'),
        t('projects.notifications.createErrorDescription')
      )
    }
  }

  const isSaveDisabled = !isValid || isSubmitting

  return (
    <TaskDrawerStyled
      aria-label={t('projects.modal.title')}
      data-testid="create-project-modal"
      open={open}
      onClose={close}
      placement="bottom"
      height={PANEL_HEIGHT}
      closable={false}
      destroyOnClose
      maskClosable={!isSubmitting}
      keyboard
      rootClassName="project-detail-modal"
    >
      <ModalShell>
        <ModalHeader>
          <HeaderTitleBlock>
            <TaskMeta>{t('projects.modal.title')}</TaskMeta>
          </HeaderTitleBlock>
          <HeaderActions>
            <HeaderSaveButton
              type="primary"
              form={formDomId}
              htmlType="submit"
              disabled={isSaveDisabled}
              loading={isSubmitting}
            >
              {t('projects.modal.submit')}
            </HeaderSaveButton>
            <CloseIconButton
              type="text"
              icon={<CloseOutlined />}
              aria-label={t('tasks.detailModal.closeAria')}
              onClick={close}
            />
          </HeaderActions>
        </ModalHeader>
        <Form
          id={formDomId}
          layout="vertical"
          onFinish={rhfAntdOnFinish(handleSubmit, onSubmit)}
        >
          <ModalBody>
            <ContentGrid>
              <MainColumn>
                <Section>
                  <SectionHeadingRow>
                    <div>
                      <SectionLabel>{t('projects.form.name')}</SectionLabel>
                      <SectionUnderline />
                    </div>
                  </SectionHeadingRow>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    validateStatus={errors.name ? 'error' : ''}
                    help={errors.name?.message}
                  >
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TitleInput
                          {...field}
                          placeholder={t('projects.form.namePlaceholder')}
                          autoFocus
                          aria-label={t('projects.form.name')}
                        />
                      )}
                    />
                  </Form.Item>
                </Section>
                <Section>
                  <SectionHeadingRow>
                    <div>
                      <SectionLabel>{t('projects.form.description')}</SectionLabel>
                      <SectionUnderline />
                    </div>
                  </SectionHeadingRow>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <DescriptionTextArea
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder={t('projects.form.descriptionPlaceholder')}
                        autoSize={{ minRows: 4, maxRows: 14 }}
                        aria-label={t('projects.form.description')}
                        onKeyDown={textAreaCtrlEnterSubmit(handleSubmit, onSubmit)}
                      />
                    )}
                  />
                </Section>
              </MainColumn>
              <SideColumn>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-keyPrefix`}>
                    {t('projects.form.keyPrefix')}
                  </MetaFieldLabel>
                  <Form.Item
                    validateStatus={errors.keyPrefix ? 'error' : ''}
                    help={errors.keyPrefix?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="keyPrefix"
                      control={control}
                      render={({ field }) => (
                        <Input
                          aria-labelledby={`${formDomId}-keyPrefix`}
                          placeholder={t('projects.form.keyPrefixPlaceholder')}
                          autoComplete="off"
                          {...field}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-tkp`}>
                    {t('projects.form.taskKeyPrefix')}
                  </MetaFieldLabel>
                  <Form.Item
                    required
                    validateStatus={errors.taskKeyPrefix ? 'error' : ''}
                    help={errors.taskKeyPrefix?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="taskKeyPrefix"
                      control={control}
                      render={({ field }) => (
                        <Input
                          aria-labelledby={`${formDomId}-tkp`}
                          placeholder={t('projects.form.taskKeyPrefixPlaceholder')}
                          autoComplete="off"
                          {...field}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-client`}>{t('projects.form.client')}</MetaFieldLabel>
                  <Form.Item
                    required
                    validateStatus={errors.client ? 'error' : ''}
                    help={errors.client?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="client"
                      control={control}
                      render={({ field }) => (
                        <Input
                          aria-labelledby={`${formDomId}-client`}
                          placeholder={t('projects.form.clientPlaceholder')}
                          {...field}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-st`}>{t('projects.form.status')}</MetaFieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        aria-labelledby={`${formDomId}-st`}
                        {...field}
                        options={getProjectStatusOptions()}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-bud`}>{t('projects.form.budget')}</MetaFieldLabel>
                  <Form.Item
                    validateStatus={errors.budget ? 'error' : ''}
                    help={errors.budget?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="budget"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          aria-labelledby={`${formDomId}-bud`}
                          value={field.value ?? null}
                          onChange={field.onChange}
                          style={{ width: '100%' }}
                          min={0}
                          controls={false}
                          placeholder={t('projects.form.budgetPlaceholder')}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-dl`}>{t('projects.form.deadline')}</MetaFieldLabel>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        aria-labelledby={`${formDomId}-dl`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        style={{ width: '100%' }}
                        format={getDateInputFormat()}
                        placeholder={t('projects.form.deadlinePlaceholder')}
                      />
                    )}
                  />
                </MetaField>
              </SideColumn>
            </ContentGrid>
          </ModalBody>
        </Form>
      </ModalShell>
    </TaskDrawerStyled>
  )
}

type ProjectEditBodyProps = {
  project: Project
  open: boolean
  onClose: () => void
  onUpdate: (project: Project) => void | Promise<void>
}

const ProjectEditBody = ({ project, open, onClose, onUpdate }: ProjectEditBodyProps) => {
  const { t } = useTranslation()
  const formDomId = EDIT_PROJECT_FORM_ID

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditFormValues>({
    resolver: zodResolver(buildEditSchema(t)),
    mode: 'onChange',
    defaultValues: {
      name: project.name,
      client: project.client ?? '',
      status: project.status ?? 'active',
      budget: project.budget ?? null,
      deadline: project.deadline ? dayjs(project.deadline) : null,
      description: project.description ?? '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: project.name,
      client: project.client ?? '',
      status: project.status ?? 'active',
      budget: project.budget ?? null,
      deadline: project.deadline ? dayjs(project.deadline) : null,
      description: project.description ?? '',
    })
  }, [open, project, reset])

  const close = () => {
    onClose()
  }

  const onSubmit = async (values: EditFormValues) => {
    try {
      await Promise.resolve(
        onUpdate({
          ...project,
          name: values.name.trim(),
          client: values.client.trim(),
          status: values.status,
          budget: values.budget ?? undefined,
          deadline: values.deadline?.format ? values.deadline.format('YYYY-MM-DD') : undefined,
          description: values.description?.trim() || undefined,
        })
      )
      notifySuccess(
        t('projects.notifications.updatedTitle'),
        t('projects.notifications.updatedDescription')
      )
      close()
    } catch {
      notifyError(
        t('projects.notifications.updateErrorTitle'),
        t('projects.notifications.updateErrorDescription')
      )
    }
  }

  const isSaveDisabled = !isValid || isSubmitting

  return (
    <TaskDrawerStyled
      aria-label={t('projects.editModal.title')}
      data-testid="edit-project-modal"
      open={open}
      onClose={close}
      placement="bottom"
      height={PANEL_HEIGHT}
      closable={false}
      destroyOnClose
      maskClosable={!isSubmitting}
      keyboard
      rootClassName="project-detail-modal"
    >
      <ModalShell>
        <ModalHeader>
          <HeaderTitleBlock>
            <TaskMeta>{t('projects.editModal.title')}</TaskMeta>
          </HeaderTitleBlock>
          <HeaderActions>
            <HeaderSaveButton
              type="primary"
              form={formDomId}
              htmlType="submit"
              disabled={isSaveDisabled}
              loading={isSubmitting}
            >
              {t('projects.editModal.submit')}
            </HeaderSaveButton>
            <CloseIconButton
              type="text"
              icon={<CloseOutlined />}
              aria-label={t('tasks.detailModal.closeAria')}
              onClick={close}
            />
          </HeaderActions>
        </ModalHeader>
        <Form
          id={formDomId}
          layout="vertical"
          onFinish={rhfAntdOnFinish(handleSubmit, onSubmit)}
        >
          <ModalBody>
            <ContentGrid>
              <MainColumn>
                <Section>
                  <SectionHeadingRow>
                    <div>
                      <SectionLabel>{t('projects.form.name')}</SectionLabel>
                      <SectionUnderline />
                    </div>
                  </SectionHeadingRow>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    validateStatus={errors.name ? 'error' : ''}
                    help={errors.name?.message}
                  >
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TitleInput
                          {...field}
                          placeholder={t('projects.form.namePlaceholder')}
                          aria-label={t('projects.form.name')}
                        />
                      )}
                    />
                  </Form.Item>
                </Section>
                <Section>
                  <SectionHeadingRow>
                    <div>
                      <SectionLabel>{t('projects.form.description')}</SectionLabel>
                      <SectionUnderline />
                    </div>
                  </SectionHeadingRow>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <DescriptionTextArea
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder={t('projects.form.descriptionPlaceholder')}
                        autoSize={{ minRows: 4, maxRows: 14 }}
                        aria-label={t('projects.form.description')}
                        onKeyDown={textAreaCtrlEnterSubmit(handleSubmit, onSubmit)}
                      />
                    )}
                  />
                </Section>
              </MainColumn>
              <SideColumn>
                <MetaField>
                  <MetaFieldLabel>{t('projects.editModal.keyLabel')}</MetaFieldLabel>
                  <Typography.Text code copyable={{ text: project.key }}>
                    {project.key}
                  </Typography.Text>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel>{t('projects.form.taskKeyPrefix')}</MetaFieldLabel>
                  <Typography.Text code copyable={{ text: project.taskKeyPrefix }}>
                    {project.taskKeyPrefix}
                  </Typography.Text>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-e-cl`}>{t('projects.form.client')}</MetaFieldLabel>
                  <Form.Item
                    required
                    validateStatus={errors.client ? 'error' : ''}
                    help={errors.client?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="client"
                      control={control}
                      render={({ field }) => (
                        <Input
                          aria-labelledby={`${formDomId}-e-cl`}
                          placeholder={t('projects.form.clientPlaceholder')}
                          {...field}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-e-st`}>{t('projects.form.status')}</MetaFieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        aria-labelledby={`${formDomId}-e-st`}
                        {...field}
                        options={getProjectStatusOptions()}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-e-bud`}>{t('projects.form.budget')}</MetaFieldLabel>
                  <Form.Item
                    validateStatus={errors.budget ? 'error' : ''}
                    help={errors.budget?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name="budget"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          aria-labelledby={`${formDomId}-e-bud`}
                          value={field.value ?? null}
                          onChange={field.onChange}
                          style={{ width: '100%' }}
                          min={0}
                          controls={false}
                          placeholder={t('projects.form.budgetPlaceholder')}
                        />
                      )}
                    />
                  </Form.Item>
                </MetaField>
                <MetaField>
                  <MetaFieldLabel id={`${formDomId}-e-dl`}>{t('projects.form.deadline')}</MetaFieldLabel>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        aria-labelledby={`${formDomId}-e-dl`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        style={{ width: '100%' }}
                        format={getDateInputFormat()}
                        placeholder={t('projects.form.deadlinePlaceholder')}
                      />
                    )}
                  />
                </MetaField>
              </SideColumn>
            </ContentGrid>
          </ModalBody>
        </Form>
      </ModalShell>
    </TaskDrawerStyled>
  )
}

type ProjectModalWidgetProps =
  | (ProjectCreateModalProps & { mode: 'create' })
  | ({
      mode: 'edit'
      project: Project | null
      open: boolean
      onClose: () => void
      onUpdate: (project: Project) => void | Promise<void>
    })

export const ProjectModalWidget = (props: ProjectModalWidgetProps) => {
  if (props.mode === 'create') {
    return (
      <ProjectCreateBody
        open={props.open}
        onClose={props.onClose}
        onCreate={props.onCreate}
      />
    )
  }

  if (!props.project) {
    return null
  }

  return (
    <ProjectEditBody
      project={props.project}
      open={props.open}
      onClose={props.onClose}
      onUpdate={props.onUpdate}
    />
  )
}
