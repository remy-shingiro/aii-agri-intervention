import {
  BookOpenCheck,
  Bug,
  ChartNoAxesColumnIncreasing,
  Droplets,
  LandPlot,
  Leaf,
  Mountain,
  PawPrint,
  ShieldAlert,
  Sprout,
  Tractor,
  TreePine,
  UsersRound,
} from 'lucide-react'

import type { EvidenceIndicator } from '../types/evidence.types'

interface EvidenceIndicatorIconProps {
  indicator: EvidenceIndicator
  className?: string
}

export function EvidenceIndicatorIcon({
  indicator,
  className = 'size-4 shrink-0',
}: EvidenceIndicatorIconProps) {
  switch (indicator) {
    case 'average_yield':
    case 'yield_gap':
    case 'improved_seed_use':
    case 'kitchen_garden_use':
    case 'crop_household_prevalence':
      return (
        <Sprout aria-hidden="true" className={className} data-icon="sprout" />
      )
    case 'crop_production':
      return (
        <ChartNoAxesColumnIncreasing
          aria-hidden="true"
          className={className}
          data-icon="production"
        />
      )
    case 'cultivated_area':
    case 'irrigated_plot_share':
      return (
        <LandPlot
          aria-hidden="true"
          className={className}
          data-icon="land-plot"
        />
      )
    case 'irrigation_practice':
    case 'irrigation_technique_use':
    case 'irrigation_water_source_use':
    case 'not_irrigated_reason_share':
      return (
        <Droplets
          aria-hidden="true"
          className={className}
          data-icon="droplets"
        />
      )
    case 'mechanical_equipment_use':
      return (
        <Tractor aria-hidden="true" className={className} data-icon="tractor" />
      )
    case 'organic_fertilizer_use':
    case 'inorganic_fertilizer_use':
    case 'inorganic_fertilizer_source_use':
      return <Leaf aria-hidden="true" className={className} data-icon="leaf" />
    case 'pesticide_use':
    case 'beekeeping':
      return <Bug aria-hidden="true" className={className} data-icon="bug" />
    case 'fertilizer_risk_awareness':
    case 'pesticide_risk_awareness':
      return (
        <ShieldAlert
          aria-hidden="true"
          className={className}
          data-icon="shield-alert"
        />
      )
    case 'erosion_control_practice':
    case 'erosion_control_measure_use':
      return (
        <Mountain
          aria-hidden="true"
          className={className}
          data-icon="mountain"
        />
      )
    case 'agroforestry_practice':
    case 'fruit_tree_presence':
      return (
        <TreePine
          aria-hidden="true"
          className={className}
          data-icon="tree-pine"
        />
      )
    case 'agricultural_association_membership':
      return (
        <UsersRound
          aria-hidden="true"
          className={className}
          data-icon="users-round"
        />
      )
    case 'agricultural_extension_use':
    case 'extension_service_use':
      return (
        <BookOpenCheck
          aria-hidden="true"
          className={className}
          data-icon="book-open-check"
        />
      )
    case 'livestock_ownership':
      return (
        <PawPrint
          aria-hidden="true"
          className={className}
          data-icon="paw-print"
        />
      )
  }
}
