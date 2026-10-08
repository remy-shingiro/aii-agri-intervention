import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { InterventionSignal } from '../../../types/intervention'
import { calculateAgriculturalSignals } from '../../intelligence/agriculturalSignalEngine'
import type { AgriculturalSignalContext } from '../../intelligence/agriculturalSignalEngine'

/**
 * Compatibility adapter for the existing irrigation trail. All signal rules
 * are owned by the shared Agricultural Intelligence registry.
 */
export function calculateInterventionSignals(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): readonly InterventionSignal[] {
  const [, , irrigationSignal] = calculateAgriculturalSignals(records, context)
  return [irrigationSignal]
}
