import { useState } from 'react'

import { AppShell } from '../components/layout/AppShell'
import { OverviewPage } from '../features/overview/pages/OverviewPage'

const navigation = ['Overview', 'District profile', 'Evidence', 'Methodology'] as const

type NavigationItem = (typeof navigation)[number]

export function App() {
  const [activePage, setActivePage] = useState<NavigationItem>('Overview')

  return (
    <AppShell
      activePage={activePage}
      navigation={navigation}
      onNavigate={setActivePage}
    >
      {activePage === 'Overview' && <OverviewPage />}
    </AppShell>
  )
}