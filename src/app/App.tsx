import { useState } from 'react'

import { AppShell } from '../components/layout/AppShell'
import {
  navigationItems,
  type NavigationItem,
} from '../components/navigation/navigation.types'
import { OverviewPage } from '../features/overview/pages/OverviewPage'

export function App() {
  const [activePage, setActivePage] = useState<NavigationItem>('Overview')

  return (
    <AppShell
      activePage={activePage}
      navigation={navigationItems}
      onNavigate={setActivePage}
    >
      {activePage === 'Overview' && <OverviewPage />}
    </AppShell>
  )
}