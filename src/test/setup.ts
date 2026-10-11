import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import {
  initializeNormalizedEvidenceRecords,
  initializeNisrDataInventory,
} from '../features/evidence/data/agriculturalEvidence'

initializeNormalizedEvidenceRecords(
  JSON.parse(
    readFileSync(
      resolve(cwd(), 'data', 'processed', 'agricultural-observations.json'),
      'utf8',
    ),
  ),
)
initializeNisrDataInventory(
  JSON.parse(
    readFileSync(
      resolve(cwd(), 'data', 'processed', 'agricultural-data-inventory.json'),
      'utf8',
    ),
  ),
)
