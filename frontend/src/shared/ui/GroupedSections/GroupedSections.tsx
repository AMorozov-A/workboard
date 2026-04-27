import { stableColorFromKey } from '@shared/lib/colors/stableColorFromKey'
import { Typography } from 'antd'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  Chevron,
  EmptyRow,
  HeaderIcon,
  HeaderLeft,
  HeaderTitle,
  Section,
  SectionBody,
  SectionHeaderButton,
  SectionsRoot,
} from './GroupedSections.styles'

export type GroupDef<GroupKey extends string> = {
  key: GroupKey
  label: string
  Icon?: React.ComponentType<{
    size?: number
    className?: string
    'aria-hidden'?: boolean
  }>
  color?: string
  emptyText?: string
  ariaLabel?: string
}

export type GroupedSectionsProps<TItem, GroupKey extends string> = {
  groups: GroupDef<GroupKey>[]
  items: TItem[]
  groupBy: (item: TItem) => GroupKey

  renderGroupBody?: (args: { group: GroupDef<GroupKey>; groupItems: TItem[] }) => ReactNode
  renderItem?: (item: TItem) => ReactNode
  getItemKey?: (item: TItem) => React.Key

  collapsible?: boolean
  defaultCollapsedKeys?: GroupKey[]
  collapsedKeys?: GroupKey[]
  onCollapsedKeysChange?: (keys: GroupKey[]) => void
}

const toKeySet = <K extends string>(keys: K[] | undefined) => new Set(keys ?? [])

export function GroupedSections<TItem, GroupKey extends string>({
  groups,
  items,
  groupBy,
  renderGroupBody,
  renderItem,
  getItemKey,
  collapsible = true,
  defaultCollapsedKeys,
  collapsedKeys,
  onCollapsedKeysChange,
}: GroupedSectionsProps<TItem, GroupKey>) {
  const isControlled = Array.isArray(collapsedKeys)
  const [internalCollapsedKeys, setInternalCollapsedKeys] = useState<GroupKey[]>(
    defaultCollapsedKeys ?? [],
  )

  const currentCollapsedKeys = useMemo(
    () => (isControlled ? (collapsedKeys ?? []) : internalCollapsedKeys),
    [collapsedKeys, internalCollapsedKeys, isControlled],
  )

  const grouped = useMemo(() => {
    const map = new Map<GroupKey, TItem[]>()
    for (const g of groups) {
      map.set(g.key, [])
    }
    for (const item of items) {
      const k = groupBy(item)
      const list = map.get(k)
      if (list) list.push(item)
    }
    return map
  }, [groups, groupBy, items])

  const collapsedSet = useMemo(() => toKeySet(currentCollapsedKeys), [currentCollapsedKeys])

  const setCollapsedKeys = (next: GroupKey[]) => {
    if (!isControlled) setInternalCollapsedKeys(next)
    onCollapsedKeysChange?.(next)
  }

  const toggle = (key: GroupKey) => {
    if (!collapsible) return
    const next = new Set(currentCollapsedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCollapsedKeys(Array.from(next))
  }

  return (
    <SectionsRoot>
      {groups.map((group) => {
        const groupItems = grouped.get(group.key) ?? []
        const isCollapsed = collapsible ? collapsedSet.has(group.key) : false
        const Icon = group.Icon
        const titleColor = group.color ?? stableColorFromKey(group.key)

        return (
          <Section key={group.key}>
            <SectionHeaderButton
              type="button"
              onClick={() => toggle(group.key)}
              aria-expanded={collapsible ? !isCollapsed : undefined}
              aria-label={group.ariaLabel ?? group.label}
            >
              <HeaderLeft>
                {Icon ? (
                  <HeaderIcon>
                    <Icon size={16} aria-hidden />
                  </HeaderIcon>
                ) : null}
                <HeaderTitle style={{ color: titleColor }}>{group.label}</HeaderTitle>
              </HeaderLeft>
              {collapsible ? (
                <Chevron $collapsed={isCollapsed}>
                  <ChevronDown size={16} aria-hidden />
                </Chevron>
              ) : null}
            </SectionHeaderButton>

            {!isCollapsed && (
              <SectionBody>
                {renderGroupBody ? (
                  renderGroupBody({ group, groupItems })
                ) : groupItems.length === 0 ? (
                  group.emptyText ? (
                    <EmptyRow>
                      <Typography.Text type="secondary">{group.emptyText}</Typography.Text>
                    </EmptyRow>
                  ) : null
                ) : renderItem ? (
                  groupItems.map((item, idx) => (
                    <div key={getItemKey ? getItemKey(item) : `${group.key}-${idx}`}>
                      {renderItem(item)}
                    </div>
                  ))
                ) : null}
              </SectionBody>
            )}
          </Section>
        )
      })}
    </SectionsRoot>
  )
}

