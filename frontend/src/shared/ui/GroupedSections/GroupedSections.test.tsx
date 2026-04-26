import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GroupedSections } from './GroupedSections'

type Item = { id: string; status: 'a' | 'b'; title: string }

describe('GroupedSections', () => {
  it('renders all groups and groups items by key', () => {
    render(
      <GroupedSections<Item, 'a' | 'b'>
        groups={[
          { key: 'a', label: 'Group A', emptyText: 'Empty A' },
          { key: 'b', label: 'Group B', emptyText: 'Empty B' },
        ]}
        items={[
          { id: '1', status: 'a', title: 'A1' },
          { id: '2', status: 'a', title: 'A2' },
          { id: '3', status: 'b', title: 'B1' },
        ]}
        groupBy={(x) => x.status}
        getItemKey={(x) => x.id}
        renderItem={(x) => <div>{x.title}</div>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Group A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Group B' })).toBeInTheDocument()

    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('A2')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('collapses and expands group content', async () => {
    const user = userEvent.setup()

    render(
      <GroupedSections<Item, 'a' | 'b'>
        groups={[
          { key: 'a', label: 'Group A', emptyText: 'Empty A' },
          { key: 'b', label: 'Group B', emptyText: 'Empty B' },
        ]}
        items={[{ id: '1', status: 'a', title: 'A1' }]}
        groupBy={(x) => x.status}
        getItemKey={(x) => x.id}
        renderItem={(x) => <div>{x.title}</div>}
        defaultCollapsedKeys={['a']}
      />,
    )

    expect(screen.queryByText('A1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Group A' }))
    expect(screen.getByText('A1')).toBeInTheDocument()
  })

  it('renders empty text for empty groups when no custom body renderer provided', () => {
    render(
      <GroupedSections<Item, 'a' | 'b'>
        groups={[
          { key: 'a', label: 'Group A', emptyText: 'Empty A' },
          { key: 'b', label: 'Group B', emptyText: 'Empty B' },
        ]}
        items={[]}
        groupBy={(x) => x.status}
        renderItem={(x) => <div>{x.title}</div>}
      />,
    )

    expect(screen.getByText('Empty A')).toBeInTheDocument()
    expect(screen.getByText('Empty B')).toBeInTheDocument()
  })
})

