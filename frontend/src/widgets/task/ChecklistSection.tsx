import type { ChecklistItem } from '@entities/checklist-item'
import {
  useChecklist,
  useCreateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useUpdateChecklistItemMutation,
} from '@entities/checklist-item'
import { closestCenter, DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button, Checkbox, Input, Progress, Space, Typography } from 'antd'
import { GripVertical, Trash2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function ChecklistRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type: 'checklistItem', itemId: item.id } as const,
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: item.id })

  const style: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.65 : 1,
    outline: isOver ? '2px solid var(--color-primary-border)' : '2px solid transparent',
    outlineOffset: 2,
    borderRadius: 10,
    transition: 'outline var(--duration-mid) var(--ease-default)',
  }

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      style={style}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 10,
          alignItems: 'center',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid var(--ant-color-border)',
          background: 'var(--ant-color-bg-container)',
        }}
      >
        <Button
          type="text"
          size="small"
          aria-label="Drag"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          icon={<GripVertical size={16} aria-hidden />}
          {...listeners}
          {...attributes}
        />
        <Checkbox checked={item.done} onChange={(e) => onToggle(item.id, e.target.checked)}>
          <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
        </Checkbox>
        <Button
          type="text"
          danger
          size="small"
          aria-label="Delete"
          icon={<Trash2 size={16} aria-hidden />}
          onClick={() => onDelete(item.id)}
        />
      </div>
    </div>
  )
}

export const ChecklistSection = ({ taskId }: { taskId: string }) => {
  const { t } = useTranslation()
  const checklistQuery = useChecklist(taskId)
  const createMutation = useCreateChecklistItemMutation(taskId)
  const updateMutation = useUpdateChecklistItemMutation(taskId)
  const deleteMutation = useDeleteChecklistItemMutation(taskId)

  const [newText, setNewText] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const items = useMemo(() => {
    const list = checklistQuery.data ?? []
    return [...list].sort((a, b) => a.position - b.position)
  }, [checklistQuery.data])

  const doneCount = items.filter((i) => i.done).length
  const total = items.length
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const createItem = async () => {
    const text = newText.trim()
    if (!text) return
    await createMutation.mutateAsync({ text })
    setNewText('')
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const from = items.findIndex((x) => x.id === String(active.id))
    const to = items.findIndex((x) => x.id === String(over.id))
    if (from < 0 || to < 0 || from === to) return

    const next = arrayMove(items, from, to)
    await Promise.all(
      next.map((item, idx) =>
        updateMutation.mutateAsync({ itemId: item.id, dto: { position: idx } })
      )
    )
  }

  const isBusy =
    checklistQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div>
      <Space direction="vertical" size={10} style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Typography.Text strong>{t('tasks.checklist.title')}</Typography.Text>
          <Typography.Text type="secondary">
            {total > 0 ? `${doneCount}/${total}` : t('tasks.checklist.emptyMeta')}
          </Typography.Text>
        </div>
        {total > 0 ? (
          <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
        ) : null}

        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={newText}
            placeholder={t('tasks.checklist.newPlaceholder')}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void createItem()
              }
            }}
            disabled={isBusy}
          />
          <Button type="primary" onClick={() => void createItem()} disabled={isBusy || !newText.trim()}>
            {t('tasks.checklist.add')}
          </Button>
        </Space.Compact>

        {items.length === 0 ? (
          <Typography.Text type="secondary">{t('tasks.checklist.empty')}</Typography.Text>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={(ev) => void handleDragEnd(ev)}
          >
            <Space direction="vertical" size={8} style={{ display: 'flex' }}>
              {items.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onToggle={(id, done) => updateMutation.mutate({ itemId: id, dto: { done } })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </Space>
            {activeId ? (
              <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden>
                {activeId}
              </div>
            ) : null}
          </DndContext>
        )}
      </Space>
    </div>
  )
}

