import type { AgriculturalSeason } from './data-contract'

export type AgriculturalSignalType =
  | 'productivity_gap'
  | 'productivity_trend'
  | 'irrigation_investigation'

export interface AgriculturalSignalPeriod {
  readonly year: string
  readonly season: AgriculturalSeason
}

export interface AgriculturalSignalBase {
  readonly id: string
  readonly signalType: AgriculturalSignalType
  readonly district: string
  readonly crop: string
  readonly period: AgriculturalSignalPeriod
  readonly title: string
  readonly summary: string
  readonly rationale: readonly string[]
  readonly limitations: readonly string[]
  readonly observedEvidenceIds: readonly string[]
  readonly derivedEvidenceIds: readonly string[]
  readonly sourceRecordIds: readonly string[]
  /** All evidence records needed to inspect this result, including derived rows. */
  readonly evidenceIds: readonly string[]
}

export type ProductivityGapStatus =
  | 'below_reference'
  | 'at_reference'
  | 'above_reference'
  | 'insufficient_evidence'

export interface ProductivityGapSignal extends AgriculturalSignalBase {
  readonly signalType: 'productivity_gap'
  readonly status: ProductivityGapStatus
  readonly districtYield?: number
  readonly nationalYield?: number
  readonly absoluteGap?: number
  readonly relativeGapPct?: number
  readonly unit?: string
}

export type ProductivityTrendStatus =
  | 'improving'
  | 'declining'
  | 'relatively_stable'
  | 'insufficient_evidence'

export interface ProductivityTrendSignal extends AgriculturalSignalBase {
  readonly signalType: 'productivity_trend'
  readonly status: ProductivityTrendStatus
  readonly periodsUsed: readonly string[]
  readonly netChange?: number
  readonly unit?: string
}

export type IrrigationInvestigationStatus =
  | 'supported'
  | 'conditions_not_met'
  | 'insufficient_evidence'

export interface IrrigationInvestigationSignal extends AgriculturalSignalBase {
  readonly signalType: 'irrigation_investigation'
  readonly status: IrrigationInvestigationStatus
  readonly intervention: 'irrigation'
  readonly period: AgriculturalSignalPeriod & { readonly crop: string }
}

export type AgriculturalSignal =
  | ProductivityGapSignal
  | ProductivityTrendSignal
  | IrrigationInvestigationSignal
