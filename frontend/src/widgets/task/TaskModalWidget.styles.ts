import { Button, Drawer, Input } from 'antd'
import styled, { css } from 'styled-components'

const COMPACT_BREAKPOINT = '960px'
const MOBILE_BREAKPOINT = '640px'

const controlSurface = css`
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  transition: border-color var(--duration-mid) var(--ease-default),
    box-shadow var(--duration-mid) var(--ease-default);

  &:hover {
    border-color: var(--color-primary-border);
  }
  &:focus-within,
  &.ant-select-focused,
  &.ant-picker-focused {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-bg);
  }
`

export const TaskDrawerStyled = styled(Drawer)`
  && .ant-drawer-content-wrapper {
    left: 0;
    right: 0;
    margin: 0 auto;
    width: min(600px, 100vw) !important;
    max-width: 600px !important;
    box-shadow: 0 -16px 48px rgba(40, 37, 29, 0.12);
    border-radius: 20px 20px 0 0;
    overflow: hidden;

    @media (max-width: ${MOBILE_BREAKPOINT}) {
      border-radius: 16px 16px 0 0;
    }
  }

  && .ant-drawer-content {
    background: var(--color-surface);
    border-radius: inherit;
  }

  && .ant-drawer-header {
    display: none;
  }

  && .ant-drawer-body {
    padding: 0;
    overflow: hidden;
    background: var(--color-surface);
  }

  /* AntD controls inside the drawer */
  && .ant-picker,
  && .ant-select:not(.ant-select-customize-input) .ant-select-selector {
    ${controlSurface}
  }

  && .ant-select:not(.ant-select-customize-input) .ant-select-selector {
    padding: 4px 12px;
  }

  && .ant-picker {
    padding: 10px 12px;
  }
`

export const ModalShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
`

export const ModalHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--color-surface);
  padding: 14px 28px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 12px 18px;
  }
`

export const HeaderTitleBlock = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const TaskMeta = styled.div`
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  display: inline-flex;
  gap: 6px;
  align-items: center;

  > .ant-typography {
    font-size: var(--font-size-caption) !important;
    color: var(--color-text-muted);
    margin: 0;
  }
`

export const TaskTitleHeading = styled.h2`
  margin: 0;
  font-family: var(--font-display, var(--font-body));
  font-size: 28px;
  line-height: 1.2;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;

  @media (max-width: ${COMPACT_BREAKPOINT}) {
    font-size: 24px;
  }
`

export const CloseIconButton = styled(Button)`
  && {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--color-text-muted);
    border: 1px solid transparent;
  }
  &&:hover {
    background: var(--color-surface-alt);
    color: var(--color-text);
    border-color: var(--color-border-subtle);
  }
`

export const ModalBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 28px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 18px 18px 24px;
  }
`

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 32px;
  align-items: start;

  @media (max-width: ${COMPACT_BREAKPOINT}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
`

export const MainColumn = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

export const SideColumn = styled.aside`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;

  @media (max-width: ${COMPACT_BREAKPOINT}) {
    order: 2;
  }
`

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const SectionLabel = styled.span`
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
`

export const SectionHeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

export const SectionUnderline = styled.div`
  height: 2px;
  width: 28px;
  background: var(--color-primary);
  border-radius: 2px;
`

export const TitleInput = styled(Input)`
  &&.ant-input {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
    min-height: auto;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    color: var(--color-text);
    cursor: text;
  }
  &&.ant-input::placeholder {
    color: var(--color-text-faint);
    font-weight: 600;
  }
  &&.ant-input:hover,
  &&.ant-input:focus {
    border: 0;
    box-shadow: none;
    outline: none;
  }

  @media (max-width: ${COMPACT_BREAKPOINT}) {
    &&.ant-input {
      font-size: 24px;
    }
  }
`

export const DescriptionTextArea = styled(Input.TextArea)`
  && {
    padding: 0;
    line-height: 1.65;
    font-size: var(--font-size-body);
    color: var(--color-text);
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    resize: none;
    cursor: text;
  }
  && textarea.ant-input {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  && textarea.ant-input::placeholder {
    color: var(--color-text-muted);
  }
  &&:hover,
  &&:focus,
  &&.ant-input-focused,
  && textarea.ant-input:hover,
  && textarea.ant-input:focus {
    border: 0;
    box-shadow: none;
    outline: none;
  }
`

export const NoteTextArea = styled(Input.TextArea)`
  && {
    padding: 0;
    line-height: 1.55;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    resize: none;
  }
  && textarea.ant-input {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  && textarea.ant-input::placeholder {
    color: var(--color-text-muted);
  }
  &&:hover,
  &&:focus,
  &&.ant-input-focused,
  && textarea.ant-input:hover,
  && textarea.ant-input:focus {
    border: 0;
    box-shadow: none;
    outline: none;
  }
`

export const FileRemoveButton = styled(Button)`
  && {
    color: var(--color-text-muted);
    border-radius: 8px;
  }
  &&:hover {
    color: var(--color-error);
    background: var(--color-surface-alt);
  }
`

export const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const NoteCard = styled.article<{ $editing?: boolean; $clickable?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-mid) var(--ease-default);

  ${({ $clickable }) =>
    $clickable
      ? css`
          cursor: text;
          &:hover {
            border-color: var(--color-primary-border);
          }
        `
      : ''}

  ${({ $editing }) =>
    $editing
      ? css`
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-bg);
        `
      : ''}
`

export const NoteEditArea = styled(Input.TextArea)`
  && {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: var(--font-size-sm);
    line-height: 1.55;
    color: var(--color-text);
    resize: none;
  }
  && textarea.ant-input {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  && textarea.ant-input::placeholder {
    color: var(--color-text-muted);
  }
  &&:hover,
  &&:focus,
  &&.ant-input-focused,
  && textarea.ant-input:hover,
  && textarea.ant-input:focus {
    border: 0;
    box-shadow: none;
    outline: none;
  }
`

export const NoteEditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`

export const NoteHeadRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`

export const NoteHeadLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`

export const NoteKey = styled.span`
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  text-transform: lowercase;
`

export const NoteTitle = styled.h4`
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: anywhere;
`

export const NoteTitleInput = styled(Input)`
  && {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }
  && .ant-input {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }
  && .ant-input::placeholder {
    color: var(--color-text-muted);
    font-weight: 500;
  }
  &&:hover,
  &&:focus,
  &&.ant-input-focused,
  && .ant-input:hover,
  && .ant-input:focus {
    border: 0;
    box-shadow: none;
    outline: none;
  }
`

export const NoteTime = styled.span`
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  white-space: nowrap;
`

export const NoteBody = styled.div`
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.55;
  color: var(--color-text);
  white-space: pre-wrap;
`

export const NoteFooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
`

export const NoteComposer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
`

export const NoteEditorWrap = styled.div`
  > * {
    width: 100%;
  }
`

export const NoteComposerActions = styled.div`
  display: flex;
  justify-content: flex-end;
`

export const NoteBottomBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 28px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-subtle);

  > :first-child {
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 12px 18px;
  }
`

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

export const HeaderSaveButton = styled(Button)`
  && {
    height: 36px;
    padding: 0 16px;
    border-radius: 10px;
    font-weight: 500;
  }
`

export const MetaField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const MetaFieldLabel = styled.span`
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
`

export const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: var(--font-size-sm);

  > :first-child {
    color: var(--color-text-muted);
  }
  > :last-child {
    color: var(--color-text);
    text-align: right;
  }
`

export const MetaDivider = styled.div`
  height: 1px;
  background: var(--color-border-subtle);
  margin: 4px 0;
`

export const StatusDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

export const StatusOptionRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`

export const LabelsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`

export const AddLabelButton = styled(Button)`
  && {
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px dashed var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-caption);
  }
  &&:hover {
    color: var(--color-primary);
    border-color: var(--color-primary-border);
    background: var(--color-primary-bg);
  }
`

export const DeleteAction = styled.div`
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 14px;
  display: flex;
`

export const DeleteButton = styled(Button)`
  && {
    padding: 0;
    height: auto;
    color: var(--color-text-muted);
    font-weight: 500;
  }
  &&:hover {
    color: var(--color-error);
    background: transparent;
  }
`

export const ModalFooter = styled.footer`
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--color-surface);
  padding: 16px 28px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 14px 18px;
  }
`
