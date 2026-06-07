import { Button, ColorPicker, Divider, Input, Select, Space, Tag as AntTag, Typography } from 'antd'
import type { InputRef } from 'antd/es/input'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TagBadge } from './TagBadge'
import type { CreateTagDto, Tag, TagColor } from '../types'
import { useCreateTagMutation, useTagsQuery } from '../api'

type Props = {
  value?: string[]
  onChange?: (tagIds: string[]) => void
  placeholder?: string
  disabled?: boolean
  ariaLabelledBy?: string
}

export const TagPicker = ({ value, onChange, placeholder, disabled, ariaLabelledBy }: Props) => {
  const { t } = useTranslation()
  const tagsQuery = useTagsQuery()
  const createTag = useCreateTagMutation()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<TagColor>('#8c8c8c')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const nameInputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const id = window.setTimeout(() => {
      nameInputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(id)
  }, [dropdownOpen])

  const options = useMemo(
    () =>
      (tagsQuery.data ?? []).map((t) => ({
        value: t.id,
        label: t.name,
        title: t.name,
        tag: t,
      })),
    [tagsQuery.data]
  )

  const createAndSelect = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const dto: CreateTagDto = { name: trimmed, color: newColor }
    const created = await createTag.mutateAsync(dto)
    setNewName('')
    setNewColor('#8c8c8c')
    onChange?.([...(value ?? []), created.id])
  }

  const dropdownRender = (menu: ReactNode) => (
    <div
      onMouseDown={(e) => {
        // Prevent Select from stealing focus / closing while interacting with custom inputs
        e.preventDefault()
      }}
    >
      {menu}
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ padding: '0 12px 12px' }}>
        <Space direction="vertical" size={8} style={{ display: 'flex' }}>
          <Typography.Text type="secondary">{t('tags.picker.createTitle')}</Typography.Text>
          <Input
            ref={nameInputRef}
            size="middle"
            placeholder={t('tags.picker.namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                void createAndSelect()
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={disabled || createTag.isPending}
          />
          <div onMouseDown={(e) => e.stopPropagation()}>
            <ColorPicker
              value={newColor}
              onChange={(c) => setNewColor(c.toHexString())}
              disabled={disabled || createTag.isPending}
              showText
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={() => void createAndSelect()}
              loading={createTag.isPending}
              disabled={disabled}
            >
              {t('tags.picker.createButton')}
            </Button>
          </div>
        </Space>
      </div>
    </div>
  )

  return (
    <Select
      mode="multiple"
      showSearch
      optionFilterProp="title"
      value={value}
      onChange={(ids) => onChange?.(ids)}
      options={options}
      placeholder={placeholder}
      loading={tagsQuery.isLoading}
      disabled={disabled}
      dropdownRender={dropdownRender}
      aria-labelledby={ariaLabelledBy}
      onDropdownVisibleChange={(open) => setDropdownOpen(open)}
      style={{ width: '100%' }}
      optionRender={(opt) => {
        const t = (opt.data as { tag?: Tag }).tag
        if (!t) return opt.label
        return <TagBadge tag={t} />
      }}
      tagRender={(props) => {
        const t = (tagsQuery.data ?? []).find((x) => x.id === props.value) as Tag | undefined
        if (!t) return props.label as React.ReactElement
        const color = t.color?.trim() ? t.color : 'default'
        return (
          <AntTag color={color} closable={props.closable} onClose={props.onClose} style={{ marginInlineEnd: 4 }}>
            {t.name}
          </AntTag>
        )
      }}
    />
  )
}

