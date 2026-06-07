import { Tag as AntTag } from 'antd'
import type { Tag as TagType } from '../types'

export const TagBadge = ({ tag }: { tag: TagType }) => {
  const color = tag.color?.trim() ? tag.color : 'default'
  return (
    <AntTag color={color} style={{ marginInlineEnd: 0 }}>
      {tag.name}
    </AntTag>
  )
}

