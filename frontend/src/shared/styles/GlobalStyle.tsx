import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  :root {
    font-family: var(--font-body);
    line-height: 1.5;
    font-weight: 400;
    color: var(--color-text);
    background-color: var(--color-bg);
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    background: var(--app-bg-gradient);
    background-attachment: fixed;
  }

  #root {
    min-height: 100vh;
  }

  .crm-tag-fixed {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 76px;
    text-align: center;
  }

  :where(.css-dev-only-do-not-override-p45i5k).ant-popover.project-page-filters-popover-overlay .ant-popover-container {
    padding: 0 !important;
  }

  :where(.css-dev-only-do-not-override-p45i5k).ant-popover.project-page-filters-popover-overlay .ant-popover-inner {
    padding: 0 !important;
  }

  :where(.css-dev-only-do-not-override-p45i5k).ant-popover.project-page-filters-popover-overlay
    :where(.css-dev-only-do-not-override-p45i5k).ant-tabs
    .ant-tabs-nav {
    margin: 0 0 8px 0 !important;
  }

  :where(.css-dev-only-do-not-override-p45i5k).ant-popover.project-page-filters-popover-overlay
    :where(.css-dev-only-do-not-override-p45i5k).ant-tabs
    .ant-tabs-tab + .ant-tabs-tab {
    margin: 0 0 0 16px !important;
  }
`
