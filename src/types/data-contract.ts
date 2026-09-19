/**
 * Provisional boundary for verified NISR data.
 *
 * This intentionally contains no analytical fields. The canonical contract
 * must be derived from inspected AHS 2024 and SAS 2024/2025 source files.
 */
export type DataReadiness = 'awaiting-source-inspection'

export interface DataContractStatus {
  readonly readiness: DataReadiness
  readonly datasets: readonly string[]
}

export const dataContractStatus: DataContractStatus = {
  readiness: 'awaiting-source-inspection',
  datasets: ['AHS 2024', 'SAS 2024', 'SAS 2025'],
}
