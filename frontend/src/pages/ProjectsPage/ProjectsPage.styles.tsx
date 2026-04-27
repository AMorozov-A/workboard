import { Breadcrumb } from 'antd'
import styled from 'styled-components'

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

export const ProjectsHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: nowrap;
  min-width: 0;
`

export const ProjectsHeaderLeft = styled.div`
  flex: 1 1 auto;
  min-width: 0;

  .ant-breadcrumb {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const ProjectsHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;

  .projects-page-user-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 28px;
    height: 28px;
  }

  .projects-page-user-avatar {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-primary-bg) 55%, var(--color-surface));
    border: 1px solid var(--color-border-subtle);
    user-select: none;
  }
`

export const ProjectsTableShell = styled.div`
  .ant-table {
    background: transparent;
  }

  .ant-table-cell-fix,
  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background: transparent !important;
  }

  .ant-table-tbody > tr.ant-table-measure-row {
    height: 0 !important;
    pointer-events: none;
  }

  .ant-table-tbody > tr.ant-table-measure-row > td {
    padding: 0 !important;
    border: 0 !important;
    height: 0 !important;
    background: transparent !important;
  }

  .ant-table-tbody > tr.ant-table-measure-row:hover > td {
    background: transparent !important;
  }

  .ant-table-tbody > tr + tr > td {
    border-top: 2px solid transparent;
    background-clip: padding-box;
  }

  .ant-table-tbody > tr > td {
    background: transparent;
  }

  .ant-table-tbody > tr:hover > td {
    background: var(--color-surface-alt) !important;
  }

  .ant-table-tbody > tr:hover > td.ant-table-cell-fix,
  .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left,
  .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
    background: var(--color-surface-alt) !important;
  }

  .ant-table-tbody > tr:hover .crm-project-table-col-actions .ant-btn {
    color: var(--color-text) !important;
    background: transparent !important;
  }

  .ant-table-thead {
    display: none;
  }

  .ant-table-tbody > tr > td {
    padding: 4px 4px !important;
    border-bottom: none !important;
  }

  .ant-table-cell {
    vertical-align: middle;
  }

  .ant-table-tbody > tr > td:first-child {
    padding-left: 4px !important;
    border-top-left-radius: var(--radius-md);
    border-bottom-left-radius: var(--radius-md);
  }

  .ant-table-tbody > tr > td:last-child {
    padding-right: 4px !important;
    border-top-right-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  .ant-table-tbody > tr > td.crm-project-table-col-title {
    padding-right: 12px !important;
    min-width: 220px;
  }

  .ant-table-tbody > tr > td.crm-project-table-col-actions {
    padding-left: 6px !important;
    padding-right: 4px !important;
    white-space: nowrap;
  }
`

