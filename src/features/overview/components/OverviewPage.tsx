import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'

export function OverviewPage() {
  return (
    <div className="space-y-8">
      <OverviewHeader />

      <RwandaMapPanel />
    </div>
  )
}