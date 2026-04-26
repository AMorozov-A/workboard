import styled from 'styled-components'

export const SectionsRoot = styled.div`
  display: block;
`

export const Section = styled.section`
  display: block;
  padding: 1px 0;
`

export const SectionHeaderButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 6px 4px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface-alt) 72%, transparent);
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--color-surface-alt);
  }

  &:active {
    background: var(--color-surface-alt);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }
`

export const HeaderLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

export const HeaderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--color-text-muted);
`

export const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: var(--font-size-body);
  line-height: 1.2;
  white-space: nowrap;
`

export const Chevron = styled.span<{ $collapsed?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--color-text-muted);
  transition: transform var(--duration-fast) var(--ease-default);
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  flex: 0 0 auto;
`

export const SectionBody = styled.div`
  display: block;
  margin-top: 2px;
`

export const EmptyRow = styled.div`
  padding: 6px 0;
`

