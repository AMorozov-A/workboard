import { Avatar, Button, Layout, Menu } from 'antd'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const ShellLayout = styled(Layout)`
  height: 100vh;
  overflow: hidden;
`

export const AppSider = styled(Layout.Sider)`
  &.ant-layout-sider {
    height: 100vh;
    position: sticky;
    top: 0;
    left: 0;
    overflow: hidden;
    border-inline-end: 1px solid var(--color-border);
  }
`

export const SiderInner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
`

export const LogoRow = styled.div`
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-2);
`

export const LogoMark = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
`

export const LogoSquare = styled.span`
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--color-primary);
`

export const LogoText = styled.span`
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SiderScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;

  .ant-menu {
    border-inline-end: none !important;
  }
`

export const SiderMenu = styled(Menu)`
  height: 100%;
  border-inline-end: none !important;

  .ant-menu-item-divider {
    border-block-start: none !important;
    margin: var(--space-2) var(--space-4) !important;
    height: 0 !important;
    background: transparent !important;
  }

  .layout-menu-section-header.ant-menu-item {
    height: auto !important;
    line-height: 1.4 !important;
    padding-block: var(--space-2) !important;
    padding-inline: var(--space-4) !important;
    cursor: default !important;
    opacity: 1 !important;
    color: var(--color-text) !important;
  }

  .layout-menu-section-header.ant-menu-item-disabled:hover {
    background: transparent !important;
  }
`

export const MenuSectionTitle = styled.span`
  font-size: var(--font-size-label);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-faint);
`

export const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  pointer-events: auto;
`

export const SidebarProjectLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
  color: inherit;
  text-decoration: none;

  &:hover {
    color: inherit;
  }
`

export const SidebarProjectAvatar = styled(Avatar)`
  flex-shrink: 0;

  && {
    font-size: 10px !important;
    font-weight: 600;
    background: var(--color-surface-alt) !important;
    color: var(--color-text-muted) !important;
    border: 1px solid var(--color-border-subtle);
  }
`

export const ProjectMenuName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SiderProfile = styled.div`
  flex-shrink: 0;
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
`

export const SiderProfileMeta = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`

export const SiderProfileName = styled.div`
  font-weight: 600;
  font-size: var(--font-size-body);
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const SiderProfileSub = styled.div`
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  line-height: 1.3;
`

export const MainColumn = styled(Layout)`
  min-width: 0;
  height: 100vh;
  overflow: hidden;
`

export const AppHeader = styled(Layout.Header)`
  background: var(--color-surface) !important;
  padding: 0 24px !important;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  flex: 0 0 auto;
  border-bottom: 1px solid var(--color-border);
  min-height: 56px;
  height: auto;
  line-height: 1.5;
`

export const AppContent = styled(Layout.Content)`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  background: var(--app-bg-gradient);
`

export const ContentShell = styled.div`
  max-width: var(--content-max-width);
  margin: 0 auto;
  width: 100%;
`

export const ProfileAvatar = styled(Avatar)`
  && {
    flex-shrink: 0;
    background: var(--color-primary-bg) !important;
    color: var(--color-primary) !important;
    font-weight: 600;
  }
`

export const SettingsGearButton = styled(Button)`
  flex-shrink: 0;

  &&.ant-btn.ant-btn-text {
    color: var(--color-text-muted);
  }

  &&.ant-btn.ant-btn-text:not(:disabled):hover {
    color: var(--color-primary);
    background: var(--color-surface-alt);
  }

  &&.ant-btn.ant-btn-text:not(:disabled):active {
    color: var(--color-primary-hover);
    background: var(--color-primary-bg);
  }
`
