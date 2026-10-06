import { useEffect, useMemo, useRef, useState } from 'react'
import { Map } from 'maplibre-gl'
import type {
  DataDrivenPropertyValueSpecification,
  MapLayerMouseEvent,
} from 'maplibre-gl'

import 'maplibre-gl/dist/maplibre-gl.css'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../../types/data-contract'
import {
  createDistrictMapEvidenceLookup,
  type DistrictMapEvidenceSummary,
} from '../data/districtMapEvidence'
import { districtInsights } from '../data/districtInsights'
import { getInterventionSignalLevel } from '../utils/calculateInterventionSignal'
import { AttentionLegend } from './AttentionLegend'
import { RwandaMapControls } from './RwandaMapControls'
import { RwandaMapNorthIndicator } from './RwandaMapNorthIndicator'

const RWANDA_CENTER: [number, number] = [29.8739, -1.9441]

const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [28.8, -2.9],
  [31.0, -1.0],
]

const DISTRICT_SOURCE_URL = '/data/rwanda-districts.geojson'
const SOURCE_ID = 'rwanda-districts'
const FILL_LAYER_ID = 'rwanda-district-fills'
const OUTLINE_LAYER_ID = 'rwanda-district-outlines'
const DISTRICT_LABEL_LAYER_ID = 'rwanda-district-labels'
const COUNTRY_LABEL_SOURCE_ID = 'neighboring-country-labels'
const COUNTRY_LABEL_LAYER_ID = 'neighboring-country-labels-layer'

interface RwandaMapPanelProps {
  crop: string
  districtSearch: string
  season: string
  selectedDistrict?: string
  year: string
  onDistrictSelect?: (districtName: string) => void
}

function getInsightFilters(crop: string, season: string, year: string) {
  const cropLabel = getCropLabel(crop)
  const seasonLabel = getSeasonLabel(season)
  const yearLabel = getYearLabel(year)

  return districtInsights.filter(
    (district) =>
      district.crop.toLowerCase() === cropLabel.toLowerCase() &&
      district.season.toLowerCase() === seasonLabel.toLowerCase() &&
      district.year === yearLabel,
  )
}

function getCropLabel(value: string): string {
  const labels: Record<string, string> = {
    maize: 'Maize',
    beans: 'Beans',
    rice: 'Rice',
    wheat: 'Wheat',
  }

  return labels[value] ?? value
}

function getSeasonLabel(value: string): string {
  const labels: Record<string, string> = {
    'season-a': 'Season A',
    'season-b': 'Season B',
    'season-c': 'Season C',
  }

  return labels[value] ?? value
}

function getYearLabel(value: string): string {
  const labels: Record<string, string> = {
    '2024-25': '2024/25',
    '2023-24': '2023/24',
    '2022-23': '2022/23',
  }

  return labels[value] ?? value
}

function getSeasonCode(value: string): AgriculturalSeason | undefined {
  if (value === 'season-a') return 'A'
  if (value === 'season-b') return 'B'
  if (value === 'season-c') return 'C'
  return undefined
}

function getObservedValue(record: EvidenceRecord | undefined): number | undefined {
  return record?.status === 'observed' && record.value !== null
    ? record.value
    : undefined
}

function formatYield(value: number): string {
  return `${(value / 1000).toFixed(2)} t/ha`
}

function formatSigned(value: number, fractionDigits = 1): string {
  const sign = value < 0 ? '−' : value > 0 ? '+' : ''
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}`
}

function getDistrictAttentionColor(yieldGapPct: number): string {
  switch (getInterventionSignalLevel(yieldGapPct)) {
    case 'attention':
      return '#ef6a4a'
    case 'moderate':
      return '#f3a35c'
    case 'near-reference':
      return '#63b36b'
  }
}

function createDistrictFillColorExpression(
  crop: string,
  season: string,
  year: string,
): DataDrivenPropertyValueSpecification<string> {
  const matchingInsights = getInsightFilters(crop, season, year)

  if (matchingInsights.length === 0) {
    return '#dbe5df'
  }

  const expression: unknown[] = [
    'match',
    ['downcase', ['to-string', ['get', 'district']]],
  ]

  for (const district of matchingInsights) {
    const yieldGapPct = district.yieldGapPct

    const color = Number.isFinite(yieldGapPct)
      ? getDistrictAttentionColor(yieldGapPct)
      : '#dbe5df'

    expression.push(district.district.toLowerCase(), color)
  }

  expression.push('#dbe5df')

  return expression as DataDrivenPropertyValueSpecification<string>
}

export function RwandaMapPanel({
  crop,
  districtSearch,
  season,
  selectedDistrict,
  year,
  onDistrictSelect,
}: RwandaMapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const onDistrictSelectRef = useRef(onDistrictSelect)
  const filtersRef = useRef({ crop, season, year })
  const hoveredFeatureIdRef = useRef<string | number | undefined>(undefined)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    district: string
    province: string
  } | null>(null)
  const hasObservations = getInsightFilters(crop, season, year).length > 0
  const seasonCode = getSeasonCode(season)
  const summaryLookup = useMemo(
    () =>
      seasonCode
        ? createDistrictMapEvidenceLookup(evidenceRecords, {
            crop: getCropLabel(crop),
            year: getYearLabel(year),
            season: seasonCode,
          })
        : new globalThis.Map<string, DistrictMapEvidenceSummary>(),
    [crop, seasonCode, year],
  )
  const hoveredSummary = hoveredDistrict
    ? summaryLookup.get(hoveredDistrict.district.trim().toLowerCase())
    : undefined

  const districtYield = getObservedValue(hoveredSummary?.districtYield)
  const nationalYield = getObservedValue(hoveredSummary?.nationalYield)
  const districtIrrigation = getObservedValue(
    hoveredSummary?.districtIrrigation,
  )
  const nationalIrrigation = getObservedValue(
    hoveredSummary?.nationalIrrigation,
  )

  useEffect(() => {
    onDistrictSelectRef.current = onDistrictSelect
  }, [onDistrictSelect])

  useEffect(() => {
    filtersRef.current = { crop, season, year }
  }, [crop, season, year])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    setMapError(null)
    setMapReady(false)

    const map = new Map({
      container: mapContainerRef.current,
      center: RWANDA_CENTER,
      zoom: 7.5,
      minZoom: 6.5,
      maxZoom: 11,
      maxBounds: RWANDA_BOUNDS,
      attributionControl: {},
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f8faf9',
            },
          },
        ],
      },
    })

    mapRef.current = map

    const handleMapLoad = () => {
      if (mapRef.current !== map) {
        return
      }

      try {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: DISTRICT_SOURCE_URL,
          promoteId: 'code_dist',
        })

        map.addSource(COUNTRY_LABEL_SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { label: 'UGANDA' },
                geometry: { type: 'Point', coordinates: [30.04, -1.04] },
              },
              {
                type: 'Feature',
                properties: { label: 'DEMOCRATIC REPUBLIC OF THE CONGO' },
                geometry: { type: 'Point', coordinates: [28.88, -1.9] },
              },
              {
                type: 'Feature',
                properties: { label: 'TANZANIA' },
                geometry: { type: 'Point', coordinates: [30.98, -2.15] },
              },
              {
                type: 'Feature',
                properties: { label: 'BURUNDI' },
                geometry: { type: 'Point', coordinates: [29.8, -2.82] },
              },
            ],
          },
        })

        map.addLayer({
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': createDistrictFillColorExpression(
              filtersRef.current.crop,
              filtersRef.current.season,
              filtersRef.current.year,
            ),
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              0.98,
              [
                'case',
                ['boolean', ['feature-state', 'search-active'], false],
                [
                  'case',
                  ['boolean', ['feature-state', 'search-match'], false],
                  0.9,
                  0.18,
                ],
                0.78,
              ],
            ],
          },
        })

        map.addLayer({
          id: COUNTRY_LABEL_LAYER_ID,
          type: 'symbol',
          source: COUNTRY_LABEL_SOURCE_ID,
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Semibold'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6.5,
              9,
              8.5,
              10,
              10.5,
              11,
            ],
            'text-max-width': 10,
            'text-line-height': 1.15,
            'text-padding': 8,
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#526158',
            'text-halo-color': '#f8faf9',
            'text-halo-width': 1.5,
            'text-opacity': 0.82,
          },
        })

        map.addLayer({
          id: OUTLINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#14532d',
              [
                'case',
                ['boolean', ['feature-state', 'hovered'], false],
                '#b45309',
                '#ffffff',
              ],
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3,
              [
                'case',
                ['boolean', ['feature-state', 'hovered'], false],
                2.2,
                1.1,
              ],
            ],
          },
        })

        map.addLayer({
          id: DISTRICT_LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 7,
          layout: {
            'text-field': ['to-string', ['get', 'district']],
            'text-font': ['Open Sans Semibold'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7,
              9,
              8.5,
              11,
              10.5,
              13,
            ],
            'text-anchor': 'center',
            'text-max-width': 8,
            'text-padding': 2,
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#24372e',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.6,
          },
        })

        map.getCanvas().setAttribute(
          'aria-label',
          'Interactive Rwanda district map. Use district search above for keyboard-accessible selection.',
        )

        setMapReady(true)
      } catch (error) {
        console.error('Failed to initialize Rwanda district map:', error)

        setMapError('The Rwanda district map could not be initialized.')
      }
    }

    const handleMapError = (event: {
      error?: {
        message?: string
      }
    }) => {
      const message = event.error?.message

      if (message) {
        console.error('MapLibre error:', message)
      }
    }

    const supportsHover =
      window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false

    const handleDistrictClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]

      if (!feature) {
        return
      }

      const districtName = String(feature.properties?.district ?? '')

      if (districtName) {
        onDistrictSelectRef.current?.(districtName)
      }
    }

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const clearDistrictHover = () => {
      const featureId = hoveredFeatureIdRef.current
      if (featureId !== undefined) {
        map.setFeatureState(
          { source: SOURCE_ID, id: featureId },
          { hovered: false },
        )
      }
      hoveredFeatureIdRef.current = undefined
      setHoveredDistrict(null)
      map.getCanvas().style.cursor = ''
    }

    const handleDistrictHover = (event: MapLayerMouseEvent) => {
      if (!supportsHover) {
        return
      }

      const feature = event.features?.[0]
      const districtName = String(feature?.properties?.district ?? '')
      const featureId = feature?.id

      if (!feature || !districtName || featureId === undefined) {
        return
      }

      if (hoveredFeatureIdRef.current === featureId) {
        return
      }

      const previousFeatureId = hoveredFeatureIdRef.current
      if (previousFeatureId !== undefined) {
        map.setFeatureState(
          { source: SOURCE_ID, id: previousFeatureId },
          { hovered: false },
        )
      }

      map.setFeatureState(
        { source: SOURCE_ID, id: featureId },
        { hovered: true },
      )
      hoveredFeatureIdRef.current = featureId
      setHoveredDistrict({
        district: districtName,
        province: String(
          feature.properties?.prov_engl ??
            feature.properties?.province ??
            'Province unavailable',
        ),
      })
    }

    map.on('load', handleMapLoad)
    map.on('error', handleMapError)
    map.on('click', FILL_LAYER_ID, handleDistrictClick)
    map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter)
    map.on('mousemove', FILL_LAYER_ID, handleDistrictHover)
    map.on('mouseleave', FILL_LAYER_ID, clearDistrictHover)

    return () => {
      setMapReady(false)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !mapReady) {
      return
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      return
    }

    map.setPaintProperty(
      FILL_LAYER_ID,
      'fill-color',
      createDistrictFillColorExpression(crop, season, year),
    )
  }, [crop, season, year, mapReady])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !mapReady) {
      return
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      return
    }

    const searchTerm = districtSearch.trim().toLowerCase()
    const features = map.querySourceFeatures(SOURCE_ID)

    for (const feature of features) {
      if (feature.id === undefined) {
        continue
      }

      const districtName = String(feature.properties?.district ?? '').toLowerCase()

      map.setFeatureState(
        {
          source: SOURCE_ID,
          id: feature.id,
        },
        {
          'search-active': Boolean(searchTerm),
          'search-match': Boolean(searchTerm) && districtName.includes(searchTerm),
        },
      )
    }
  }, [districtSearch, mapReady])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !mapReady) {
      return
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      return
    }

    const clearSelection = () => {
      const features = map.querySourceFeatures(SOURCE_ID)

      for (const feature of features) {
        if (feature.id === undefined) {
          continue
        }

        map.setFeatureState(
          {
            source: SOURCE_ID,
            id: feature.id,
          },
          {
            selected: false,
          },
        )
      }
    }

    clearSelection()

    if (!selectedDistrict) {
      return
    }

    const features = map.querySourceFeatures(SOURCE_ID)

    const selectedFeature = features.find((feature) => {
      const districtName = String(feature.properties?.district ?? '')

      return districtName.toLowerCase() === selectedDistrict.toLowerCase()
    })

    if (selectedFeature?.id === undefined) {
      return
    }

    map.setFeatureState(
      {
        source: SOURCE_ID,
        id: selectedFeature.id,
      },
      {
        selected: true,
      },
    )
  }, [selectedDistrict, mapReady])

  const zoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const zoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const resetView = () => {
    mapRef.current?.fitBounds(RWANDA_BOUNDS, {
      padding: 40,
      duration: 600,
    })
  }

  return (
    <section
      aria-label="Rwanda district agricultural attention map"
      aria-describedby="district-map-help"
      className="relative h-[clamp(380px,58vh,620px)] min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-50 sm:h-[min(68vh,680px)]"
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ position: 'absolute' }}
      />

      {hoveredDistrict && (
        <aside
          aria-label={`Map preview for ${hoveredDistrict.district}`}
          className="pointer-events-none absolute right-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-[min(19rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:right-4 sm:top-4"
          role="tooltip"
        >
          <header className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              {hoveredDistrict.district}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {hoveredDistrict.province} · {getCropLabel(crop)} ·{' '}
              {getSeasonLabel(season)} {getYearLabel(year)}
            </p>
          </header>

          <section className="border-b border-slate-200 py-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-green-800">
              {getCropLabel(crop)} yield
            </h4>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-500">District</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {districtYield !== undefined
                  ? formatYield(districtYield)
                  : 'Data unavailable'}
              </dd>
              <dt className="text-slate-500">National</dt>
              <dd className="font-medium tabular-nums text-slate-700">
                {nationalYield !== undefined
                  ? formatYield(nationalYield)
                  : 'Data unavailable'}
              </dd>
              <dt className="text-slate-500">Yield gap · derived</dt>
              <dd className="font-medium tabular-nums text-slate-700">
                {districtYield !== undefined && nationalYield !== undefined
                  ? `${formatSigned((districtYield - nationalYield) / 1000, 2)} t/ha`
                  : 'Data unavailable'}
              </dd>
            </dl>
            {hoveredSummary?.districtYield && (
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {hoveredSummary.districtYield.dataset} ·{' '}
                {hoveredSummary.districtYield.sourceReference.table.split(':')[0]}{' '}
                · observed
              </p>
            )}
          </section>

          <section className="pt-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-green-800">
              Irrigation practice
            </h4>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              District-wide estimate across crop activity
            </p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-500">District</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {districtIrrigation !== undefined
                  ? `${districtIrrigation.toFixed(1)}%`
                  : 'Data unavailable'}
              </dd>
              <dt className="text-slate-500">National</dt>
              <dd className="font-medium tabular-nums text-slate-700">
                {nationalIrrigation !== undefined
                  ? `${nationalIrrigation.toFixed(1)}%`
                  : 'Data unavailable'}
              </dd>
              <dt className="text-slate-500">Difference · derived</dt>
              <dd className="font-medium tabular-nums text-slate-700">
                {districtIrrigation !== undefined &&
                nationalIrrigation !== undefined
                  ? `${formatSigned(districtIrrigation - nationalIrrigation)} pp`
                  : 'Data unavailable'}
              </dd>
            </dl>
            {hoveredSummary?.districtIrrigation && (
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {hoveredSummary.districtIrrigation.dataset} · Table 64 · observed
              </p>
            )}
          </section>
        </aside>
      )}

      <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
        <AttentionLegend hasObservations={hasObservations} />
      </div>

      <RwandaMapControls
        onResetView={resetView}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      <RwandaMapNorthIndicator />

      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Loading Rwanda district map…</p>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Unable to load the district map
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Check the district boundary source connection and try again.
            </p>
          </div>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {selectedDistrict ? `${selectedDistrict} selected` : ''}
      </p>
    </section>
  )
}
