import { Avatar, Breadcrumb, Card } from 'antd'
import styled from 'styled-components'

export const PageHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
`

export const PageTitle = styled.h1`
  font-family: var(--font-display);
  font-size: var(--font-size-h2);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--color-text);
`

export const PageDescription = styled.p`
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--color-text-muted);
`

export const ProjectsBreadcrumb = styled(Breadcrumb)`
  .ant-breadcrumb-link {
    color: var(--color-text-muted);
  }

  .ant-breadcrumb-separator {
    color: var(--color-text-faint);
  }
`

export const BreadcrumbCurrent = styled.span.attrs(() => ({
  className: 'crm-breadcrumb-current',
}))`
  color: var(--color-text-faint);
`

export const ProjectsTableShell = styled.div`
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

export const KeyCell = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

export const KeyAvatar = styled(Avatar)`
  flex-shrink: 0;

  && {
    font-size: 11px !important;
    font-weight: 600;
    background: var(--color-surface-alt) !important;
    color: var(--color-text-muted) !important;
    border: 1px solid var(--color-border-subtle);
  }
`

export const ProjectsCard = styled(Card)`
  &.ant-card {
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }
`
