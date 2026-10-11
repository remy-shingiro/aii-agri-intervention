import agriculturalObservationsUrl from '../../../../data/processed/agricultural-observations.json?url'
import agriculturalInventoryUrl from '../../../../data/processed/agricultural-data-inventory.json?url'
import {
  initializeNormalizedEvidenceRecords,
  initializeNisrDataInventory,
  nisrDataInventoryLoaded,
} from './agriculturalEvidence'

async function fetchJson(url: string, label: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Unable to load ${label} (HTTP ${response.status}).`)
  }

  return response.json()
}

export async function loadAgriculturalObservations(): Promise<void> {
  const observations = await fetchJson(
    agriculturalObservationsUrl,
    'agricultural observations',
  )
  initializeNormalizedEvidenceRecords(observations)
}

export async function loadAgriculturalDataInventory(): Promise<void> {
  if (nisrDataInventoryLoaded) return

  const inventory = await fetchJson(
    agriculturalInventoryUrl,
    'agricultural data inventory',
  )
  initializeNisrDataInventory(inventory)
}
