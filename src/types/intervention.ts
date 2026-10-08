import type { AgriculturalSignalPeriod, IrrigationInvestigationSignal } from './agricultural-signal'

/** Existing navigation and evidence-trail type for the supported irrigation signal. */
export type InterventionStatus = IrrigationInvestigationSignal['status']

/** Intervention domains remain catalogued, but only irrigation is implemented. */
export type InterventionType = 'irrigation'

export interface InterventionPeriod extends AgriculturalSignalPeriod {
  readonly crop: string
}

export type InterventionSignal = IrrigationInvestigationSignal
