import { Outlet } from 'react-router-dom'

import {
  AppContent,
  ContentShell,
  MainColumn,
  ShellLayout,
} from './AppLayout.styles'

export const AppLayout = () => (
  <ShellLayout>
    <MainColumn>
      <AppContent>
        <ContentShell>
          <Outlet />
        </ContentShell>
      </AppContent>
    </MainColumn>
  </ShellLayout>
)
