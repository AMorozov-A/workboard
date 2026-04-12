import { Breadcrumb, Card, Tabs } from 'antd'
import styled from 'styled-components'

export const ProjectBreadcrumb = styled(Breadcrumb)`
  .ant-breadcrumb-link {
    color: var(--color-text-muted);
  }

  .ant-breadcrumb-separator {
    color: var(--color-text-faint);
  }
`

export const BreadcrumbCurrent = styled.span.attrs(() => ({
  className: 'project-page-breadcrumb-current',
}))`
  color: var(--color-text-faint);
`

export const ProjectHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
`

export const ProjectTitleBlock = styled.div`
  flex: 1 1 280px;
  min-width: 0;
`

export const ProjectTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`

export const ProjectPageTitle = styled.h1`
  font-family: var(--font-display);
  font-size: var(--font-size-h2);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--color-text);
`

export const ProjectPageDescription = styled.p`
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 640px;
`

export const ProjectSummaryCard = styled(Card)`
  flex: 0 1 340px;
  min-width: 280px;

  &.ant-card {
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  .ant-card-body {
    padding: var(--space-4) !important;
  }
`

export const SummaryGrid = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  margin: 0;
  font-size: var(--font-size-body);
`

export const SummaryDt = styled.dt`
  margin: 0;
  color: var(--color-text-muted);
  font-weight: 500;
`

export const SummaryDd = styled.dd`
  margin: 0;
  color: var(--color-text);
`

export const ProjectTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: var(--space-4) !important;
  }

  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    font-weight: 600;
  }
`

export const TasksToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
`

export const TasksFilters = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`

export const FilterField = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

export const FilterLabel = styled.span`
  font-size: var(--font-size-body);
  color: var(--color-text-muted);
  white-space: nowrap;
`

export const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`

export const KanbanBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const KanbanColumn = styled.div<{ $isDropOver?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  background: ${({ $isDropOver }) =>
    $isDropOver ? 'var(--color-primary-bg)' : 'var(--color-surface-alt)'};
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  border: 1px solid var(--color-border-subtle);
  transition: background var(--duration-mid) var(--ease-default);
`

export const KanbanColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-subtle);
`

export const KanbanColumnTitle = styled.span`
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text);
`

export const KanbanColumnCount = styled.span`
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  min-width: 24px;
  text-align: center;
`

export const KanbanColumnBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 120px;
  flex: 1 1 auto;
`

export const TaskCardButton = styled.button<{ $selected?: boolean; $dragging?: boolean }>`
  display: block;
  width: 100%;
  margin: 0;
  padding: var(--space-3) var(--space-3) var(--space-2);
  text-align: left;
  cursor: grab;
  touch-action: none;
  border-radius: var(--radius-md);
  border: 1px solid
    ${({ $selected }) => ($selected ? 'var(--color-primary)' : 'var(--color-border)')};
  background: var(--color-surface);
  box-shadow: ${({ $selected }) => ($selected ? 'var(--shadow-sm)' : 'none')};
  opacity: ${({ $dragging }) => ($dragging ? 0.55 : 1)};
  transition:
    border-color var(--duration-mid) var(--ease-default),
    box-shadow var(--duration-mid) var(--ease-default),
    opacity var(--duration-fast) var(--ease-default);

  &:active {
    cursor: grabbing;
  }

  &:hover {
    border-color: var(--color-primary-border);
    box-shadow: var(--shadow-sm);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`

export const TaskCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
`

export const TaskCardKey = styled.span`
  font-family: var(--font-mono);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
`

export const TaskCardTitle = styled.div`
  font-weight: 600;
  font-size: var(--font-size-body);
  color: var(--color-text);
  line-height: 1.35;
  margin-bottom: var(--space-1);
`

export const TaskCardDesc = styled.p`
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

export const TaskCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-subtle);
`

export const TaskCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
`

export const TaskCardLabels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
`

export const TasksTableShell = styled.div`
  .ant-table-thead > tr > th {
    background: var(--color-primary-bg) !important;
    font-family: var(--font-body);
    font-size: var(--font-size-label);
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-muted) !important;
    border-bottom: 1px solid var(--color-border) !important;
  }

  .ant-table-thead > tr > th::before {
    display: none !important;
  }

  html[data-theme='dark'] & .ant-table-thead > tr > th {
    background: var(--color-primary-bg) !important;
  }
`
