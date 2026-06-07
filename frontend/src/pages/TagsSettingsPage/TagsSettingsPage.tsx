import type { TagColor } from '@entities/tag'
import { useCreateTagMutation, useDeleteTagMutation, useTagsQuery, useUpdateTagMutation } from '@entities/tag'
import { routes } from '@shared/config/routes'
import { Breadcrumb, Button, ColorPicker, Form, Input, Modal, Popconfirm, Space, Spin, Typography } from 'antd'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

type EditState =
  | { mode: 'create' }
  | { mode: 'edit'; tagId: string; initial: { name: string; color: string } }
  | null

export const TagsSettingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const tagsQuery = useTagsQuery()
  const createTag = useCreateTagMutation()
  const updateTag = useUpdateTagMutation()
  const deleteTag = useDeleteTagMutation()

  const [edit, setEdit] = useState<EditState>(null)
  const [form] = Form.useForm<{ name: string; color: TagColor }>()

  const tags = tagsQuery.data ?? []

  const openCreate = () => {
    form.setFieldsValue({ name: '', color: '#8c8c8c' })
    setEdit({ mode: 'create' })
  }

  const openEdit = (tagId: string) => {
    const tag = tags.find((x) => x.id === tagId)
    if (!tag) return
    form.setFieldsValue({ name: tag.name, color: tag.color })
    setEdit({ mode: 'edit', tagId, initial: { name: tag.name, color: tag.color } })
  }

  const close = () => {
    setEdit(null)
    form.resetFields()
  }

  const submit = async () => {
    const values = await form.validateFields()
    if (!values.name.trim()) return

    if (edit?.mode === 'create') {
      await createTag.mutateAsync({ name: values.name.trim(), color: values.color })
      close()
      return
    }

    if (edit?.mode === 'edit') {
      await updateTag.mutateAsync({
        tagId: edit.tagId,
        dto: { name: values.name.trim(), color: values.color },
      })
      close()
    }
  }

  const isBusy =
    tagsQuery.isLoading ||
    createTag.isPending ||
    updateTag.isPending ||
    deleteTag.isPending

  return (
    <div style={{ width: '100%' }}>
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Breadcrumb
          items={[
            { title: <Link to={routes.projects}>{t('projects.breadcrumb.workspace')}</Link> },
            { title: <span className="crm-breadcrumb-current">{t('tags.title')}</span> },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {t('tags.title')}
            </Typography.Title>
            <Typography.Text type="secondary">{t('tags.subtitle')}</Typography.Text>
          </div>
          <Space>
            <Button onClick={() => navigate(routes.profile)}>{t('layout.profile')}</Button>
            <Button type="primary" icon={<Plus size={16} aria-hidden />} onClick={openCreate}>
              {t('tags.actions.create')}
            </Button>
          </Space>
        </div>

        {tagsQuery.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin size="large" tip={t('tags.loading')} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {tags.length === 0 ? (
              <Typography.Text type="secondary">{t('tags.empty')}</Typography.Text>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid var(--ant-color-border)',
                  }}
                >
                  <Space>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: tag.color === 'gray' ? 'var(--ant-color-text-quaternary)' : undefined,
                      }}
                    />
                    <Typography.Text strong>{tag.name}</Typography.Text>
                    <Typography.Text type="secondary">{tag.color}</Typography.Text>
                  </Space>
                  <Space>
                    <Button onClick={() => openEdit(tag.id)}>{t('tags.actions.edit')}</Button>
                    <Popconfirm
                      title={t('tags.delete.confirmTitle')}
                      description={t('tags.delete.confirmDescription', { name: tag.name })}
                      okText={t('tags.delete.confirmOk')}
                      cancelText={t('common.cancel')}
                      onConfirm={() => deleteTag.mutate(tag.id)}
                    >
                      <Button danger>{t('tags.actions.delete')}</Button>
                    </Popconfirm>
                  </Space>
                </div>
              ))
            )}
          </div>
        )}
      </Space>

      <Modal
        open={Boolean(edit)}
        title={edit?.mode === 'edit' ? t('tags.modal.editTitle') : t('tags.modal.createTitle')}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        onOk={() => void submit()}
        onCancel={close}
        confirmLoading={createTag.isPending || updateTag.isPending}
        okButtonProps={{ disabled: isBusy }}
        cancelButtonProps={{ disabled: isBusy }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('tags.form.name')}
            name="name"
            rules={[{ required: true, message: t('tags.validation.nameRequired') }]}
          >
            <Input placeholder={t('tags.form.namePlaceholder')} autoFocus />
          </Form.Item>
          <Form.Item
            label={t('tags.form.color')}
            name="color"
            rules={[{ required: true }]}
            getValueFromEvent={(c) => c.toHexString()}
          >
            <ColorPicker
              showText
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

