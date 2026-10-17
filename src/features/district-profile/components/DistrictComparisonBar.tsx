interface DistrictComparisonBarProps {
  label: string
  districtName: string
  districtValue?: number
  nationalValue?: number
  unit: string
  difference?: number
  differenceUnit?: string
  scaleMaximum?: number
}

function isObserved(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0
}

function formatValue(value: number | undefined, unit: string): string {
  if (!isObserved(value)) return 'Unavailable'

  return `${value.toLocaleString('en-RW', { maximumFractionDigits: 2 })} ${unit}`
}

function formatDifference(
  difference: number | undefined,
  unit: string,
): string {
  if (difference === undefined || !Number.isFinite(difference)) {
    return 'Unavailable'
  }

  return `${difference.toLocaleString('en-RW', {
    maximumFractionDigits: 2,
    signDisplay: 'always',
  })} ${unit}`
}

function formatBarWidth(value: number | undefined, scale: number): string {
  if (!isObserved(value)) return '0%'

  return `${Number(((value / scale) * 100).toFixed(2))}%`
}

export function DistrictComparisonBar({
  label,
  districtName,
  districtValue,
  nationalValue,
  unit,
  difference,
  differenceUnit = unit,
  scaleMaximum,
}: DistrictComparisonBarProps) {
  const hasDistrictValue = isObserved(districtValue)
  const hasNationalValue = isObserved(nationalValue)
  const hasDifference = difference !== undefined && Number.isFinite(difference)
  const hasComparablePair =
    hasDistrictValue && hasNationalValue && hasDifference
  const scale = Math.max(
    scaleMaximum ?? 0,
    hasDistrictValue ? districtValue : 0,
    hasNationalValue ? nationalValue : 0,
    1,
  )
  const districtWidth = formatBarWidth(districtValue, scale)
  const nationalWidth = formatBarWidth(nationalValue, scale)

  return (
    <div
      aria-label={`${label}: district and national comparison`}
      className="min-w-0"
      role="group"
    >
      {hasComparablePair ? (
        <>
          <dl className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
            <dt className="min-w-0 break-words text-xs font-medium text-slate-600">
              District: {districtName} (observed)
            </dt>
            <dd className="text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatValue(districtValue, unit)}
            </dd>
            <dd
              aria-hidden="true"
              className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <span
                className="block h-full rounded-full bg-agri-700"
                data-series="district"
                style={{ width: districtWidth }}
              />
            </dd>

            <dt className="min-w-0 break-words text-xs font-medium text-slate-600">
              National reference: Rwanda (observed)
            </dt>
            <dd className="text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatValue(nationalValue, unit)}
            </dd>
            <dd
              aria-hidden="true"
              className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <span
                className="block h-full rounded-full bg-slate-400"
                data-series="national"
                style={{ width: nationalWidth }}
              />
            </dd>
          </dl>
          <dl className="mt-3 border-t border-slate-100 pt-2">
            <dt className="text-xs text-slate-500">
              Difference (district minus national, derived)
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
              {formatDifference(difference, differenceUnit)}
            </dd>
          </dl>
          <p className="mt-2 text-[11px] text-slate-500">
            Shared bar scale: 0 to {scale.toLocaleString('en-RW')} {unit}
          </p>
        </>
      ) : (
        <>
          <dl className="grid min-w-0 gap-x-3 gap-y-2 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">
                District: {districtName} (observed)
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
                {formatValue(districtValue, unit)}
              </dd>
            </div>
            <div className="min-w-0 border-t border-slate-100 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
              <dt className="text-xs text-slate-500">
                National reference: Rwanda (observed)
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
                {formatValue(nationalValue, unit)}
              </dd>
            </div>
            <div className="border-t border-slate-100 pt-2 sm:col-span-2">
              <dt className="text-xs text-slate-500">
                Difference (district minus national, derived)
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
                {formatDifference(difference, differenceUnit)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs leading-5 text-slate-600" role="status">
            A shared-scale chart needs observed, comparable district and
            national values with a derived difference.
          </p>
        </>
      )}
    </div>
  )
}
