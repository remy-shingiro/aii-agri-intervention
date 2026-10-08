import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, setWorkerUrl } from 'maplibre-gl'
import type {
  DataDrivenPropertyValueSpecification,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import 'maplibre-gl/dist/maplibre-gl.css'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../../types/data-contract'
import type { ProductivityGapStatus } from '../../../types/agricultural-signal'
import {
  createDistrictMapEvidenceLookup,
  type DistrictMapEvidenceSummary,
} from '../data/districtMapEvidence'
import {
  createDistrictLabelAnchors,
  type DistrictLabelAnchor,
  type DistrictLabelFeature,
} from '../data/districtLabelAnchors'
import { getDistrictInsights } from '../data/districtInsights'
import { AttentionLegend } from './AttentionLegend'
import { RwandaMapControls } from './RwandaMapControls'
import { RwandaMapNorthIndicator } from './RwandaMapNorthIndicator'

const RWANDA_CENTER: [number, number] = [29.8739, -1.9441]

const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [28.8, -2.9],
  [31.0, -1.0],
]
const NARROW_MAP_BOUNDS: [[number, number], [number, number]] = [
  [28.1, -3.55],
  [31.65, -0.3],
]

const DISTRICT_SOURCE_URL = '/data/rwanda-districts.geojson'
const SOURCE_ID = 'rwanda-districts'
const FILL_LAYER_ID = 'rwanda-district-fills'
const OUTLINE_LAYER_ID = 'rwanda-district-outlines'

setWorkerUrl(maplibreWorkerUrl)

const PROVINCE_LABELS: Readonly<Record<string, string>> = {
  East: 'Eastern Province',
  Kigali: 'Kigali City',
  'Kigali City': 'Kigali City',
  North: 'Northern Province',
  South: 'Southern Province',
  West: 'Western Province',
}

interface NeighborCountryLabel {
  readonly id: string
  readonly lines: readonly string[]
  readonly coordinates: readonly [number, number]
  readonly horizontalAnchor: 'left' | 'center' | 'right'
  readonly verticalAnchor: 'above' | 'center' | 'below'
}

const NEIGHBOR_COUNTRY_LABELS: readonly NeighborCountryLabel[] = [
  {
    id: 'uganda',
    lines: ['UGANDA'],
    coordinates: [30.85, -1.04],
    horizontalAnchor: 'center',
    verticalAnchor: 'above',
  },
  {
    id: 'drc',
    lines: ['DEMOCRATIC', 'REPUBLIC OF', 'THE CONGO'],
    coordinates: [29.15, -1.9],
    horizontalAnchor: 'right',
    verticalAnchor: 'center',
  },
  {
    id: 'tanzania',
    lines: ['TANZANIA'],
    coordinates: [30.85, -2.15],
    horizontalAnchor: 'right',
    verticalAnchor: 'center',
  },
  {
    id: 'burundi',
    lines: ['BURUNDI'],
    coordinates: [29.8, -2.82],
    horizontalAnchor: 'center',
    verticalAnchor: 'below',
  },
]

interface RwandaMapPanelProps {
  crop: string
  districtSearch: string
  season: string
  selectedDistrict?: string
  year: string
  onDistrictSelect?: (districtName: string) => void
}

function getCropLabel(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
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
  return value.replace('-', '/')
}

function getSeasonCode(value: string): AgriculturalSeason | undefined {
  if (value === 'season-a') return 'A'
  if (value === 'season-b') return 'B'
  if (value === 'season-c') return 'C'
  return undefined
}

function getObservedValue(
  record: EvidenceRecord | undefined,
): number | undefined {
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

function getProductivityGapColor(status: ProductivityGapStatus): string {
  switch (status) {
    case 'below_reference':
      return '#e7c49d'
    case 'at_reference':
      return '#dbe5df'
    case 'above_reference':
      return '#a9cbb6'
    case 'insufficient_evidence':
      return '#f1f5f9'
  }
}

function createDistrictFillColorExpression(
  matchingInsights: ReturnType<typeof getDistrictInsights>,
): DataDrivenPropertyValueSpecification<string> {
  if (matchingInsights.length === 0) {
    return '#dbe5df'
  }

  const expression: unknown[] = [
    'match',
    ['downcase', ['to-string', ['get', 'district']]],
  ]

  for (const district of matchingInsights) {
    expression.push(
      district.district.toLowerCase(),
      getProductivityGapColor(district.productivityGap.status),
    )
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
  const districtLabelElementsRef = useRef(
    new globalThis.Map<string, HTMLSpanElement>(),
  )
  const countryLabelElementsRef = useRef(
    new globalThis.Map<string, HTMLSpanElement>(),
  )
  const labelSourceLoadedRef = useRef(false)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [districtLabelAnchors, setDistrictLabelAnchors] = useState<
    readonly DistrictLabelAnchor[]
  >([])
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    district: string
    province: string
  } | null>(null)
  const districtInsights = useMemo(
    () => getDistrictInsights(crop, season, year),
    [crop, season, year],
  )
  const hasObservations = districtInsights.length > 0
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
  const hoveredInsight = hoveredDistrict
    ? districtInsights.find(
        (item) =>
          item.district.trim().toLowerCase() ===
          hoveredDistrict.district.trim().toLowerCase(),
      )
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
    labelSourceLoadedRef.current = false
    setDistrictLabelAnchors([])

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
    const mapResizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width) return

      map.setMaxBounds(width < 600 ? NARROW_MAP_BOUNDS : RWANDA_BOUNDS)
      map.resize()
      if (width < 600 && map.getZoom() > 6.5) {
        map.setZoom(6.5)
      } else if (width >= 600 && map.getZoom() <= 6.5) {
        map.setZoom(7.5)
      }
    })
    mapResizeObserver.observe(mapContainerRef.current)

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

        map.addLayer({
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': createDistrictFillColorExpression(
              getDistrictInsights(
                filtersRef.current.crop,
                filtersRef.current.season,
                filtersRef.current.year,
              ),
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

        map
          .getCanvas()
          .setAttribute(
            'aria-label',
            'Interactive Rwanda district map with district labels and neighboring country context. Use district search above for keyboard-accessible selection.',
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

    const handleDistrictSourceData = (event: {
      sourceId?: string
      isSourceLoaded?: boolean
    }) => {
      if (
        event.sourceId !== SOURCE_ID ||
        !event.isSourceLoaded ||
        labelSourceLoadedRef.current
      ) {
        return
      }

      const labelFeatures: DistrictLabelFeature[] = map
        .querySourceFeatures(SOURCE_ID)
        .flatMap((feature) => {
          const name = String(feature.properties?.district ?? '')
          const id = String(feature.properties?.code_dist ?? feature.id ?? '')
          const geometry = feature.geometry

          if (
            !id ||
            !name ||
            (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')
          ) {
            return []
          }

          return [
            {
              id,
              name,
              geometry: {
                type: geometry.type,
                coordinates: geometry.coordinates,
              } as DistrictLabelFeature['geometry'],
            },
          ]
        })

      const anchors = createDistrictLabelAnchors(labelFeatures)
      if (anchors.length > 0) {
        labelSourceLoadedRef.current = true
        setDistrictLabelAnchors(anchors)
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
        province:
          PROVINCE_LABELS[String(feature.properties?.prov_engl ?? '')] ??
          String(feature.properties?.prov_engl ?? 'Province unavailable'),
      })
    }

    map.on('load', handleMapLoad)
    map.on('sourcedata', handleDistrictSourceData)
    map.on('error', handleMapError)
    map.on('click', FILL_LAYER_ID, handleDistrictClick)
    map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter)
    map.on('mousemove', FILL_LAYER_ID, handleDistrictHover)
    map.on('mouseleave', FILL_LAYER_ID, clearDistrictHover)

    return () => {
      setMapReady(false)
      mapResizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const labelOverlay = mapContainerRef.current?.parentElement
    if (!map || !mapReady || !labelOverlay) return

    const positionLabels = () => {
      const canvasRect = map.getCanvas().getBoundingClientRect()
      const overlayRect = labelOverlay.getBoundingClientRect()
      const width = overlayRect.width
      const height = overlayRect.height
      const project = (coordinates: readonly [number, number]) => {
        const point = map.project([coordinates[0], coordinates[1]])
        return {
          x: point.x + canvasRect.left - overlayRect.left,
          y: point.y + canvasRect.top - overlayRect.top,
        }
      }

      const reserved: {
        left: number
        top: number
        right: number
        bottom: number
      }[] = []
      for (const label of NEIGHBOR_COUNTRY_LABELS) {
        const element = countryLabelElementsRef.current.get(label.id)
        if (!element) continue

        const point = project(label.coordinates)
        const labelWidth = element.offsetWidth
        const labelHeight = element.offsetHeight
        const desiredLeft =
          label.horizontalAnchor === 'left'
            ? point.x
            : label.horizontalAnchor === 'right'
              ? point.x - labelWidth
              : point.x - labelWidth / 2
        const desiredTop =
          label.verticalAnchor === 'above'
            ? point.y - labelHeight
            : label.verticalAnchor === 'below'
              ? point.y
              : point.y - labelHeight / 2
        const left = Math.max(6, Math.min(width - labelWidth - 6, desiredLeft))
        const top = Math.max(6, Math.min(height - labelHeight - 6, desiredTop))
        element.style.left = `${left}px`
        element.style.top = `${top}px`
        element.style.visibility =
          point.x < -labelWidth ||
          point.x > width + labelWidth ||
          point.y < -labelHeight ||
          point.y > height + labelHeight
            ? 'hidden'
            : 'visible'
        reserved.push({
          left,
          top,
          right: left + labelWidth,
          bottom: top + labelHeight,
        })
      }

      const zoom = map.getZoom()
      const selectedKey = selectedDistrict?.trim().toLowerCase()
      const orderedAnchors = [...districtLabelAnchors].sort((first, second) => {
        const firstSelected = first.name.trim().toLowerCase() === selectedKey
        const secondSelected = second.name.trim().toLowerCase() === selectedKey
        if (firstSelected !== secondSelected) return firstSelected ? -1 : 1
        return second.area - first.area
      })

      for (const anchor of orderedAnchors) {
        const element = districtLabelElementsRef.current.get(anchor.id)
        if (!element) continue
        if (zoom < 6.5) {
          element.style.visibility = 'hidden'
          continue
        }

        const point = project(anchor.coordinates)
        element.style.fontSize = `${Math.min(12, 9 + Math.max(0, zoom - 7.2) * 1.15)}px`
        const labelWidth = element.offsetWidth
        const labelHeight = element.offsetHeight
        const left = point.x - labelWidth / 2
        const top = point.y - labelHeight / 2
        const bounds = {
          left: left - 3,
          top: top - 2,
          right: left + labelWidth + 3,
          bottom: top + labelHeight + 2,
        }
        const onMap =
          point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
        const collides = reserved.some(
          (other) =>
            bounds.left < other.right &&
            bounds.right > other.left &&
            bounds.top < other.bottom &&
            bounds.bottom > other.top,
        )

        if (
          !onMap ||
          (collides && anchor.name.trim().toLowerCase() !== selectedKey)
        ) {
          element.style.visibility = 'hidden'
          continue
        }

        element.style.left = `${point.x}px`
        element.style.top = `${point.y}px`
        element.style.visibility = 'visible'
        reserved.push(bounds)
      }
    }

    positionLabels()
    map.on('move', positionLabels)
    map.on('resize', positionLabels)
    map.on('idle', positionLabels)
    return () => {
      map.off('move', positionLabels)
      map.off('resize', positionLabels)
      map.off('idle', positionLabels)
    }
  }, [districtLabelAnchors, mapReady, selectedDistrict])

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
      createDistrictFillColorExpression(districtInsights),
    )
  }, [districtInsights, mapReady])

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

      const districtName = String(
        feature.properties?.district ?? '',
      ).toLowerCase()

      map.setFeatureState(
        {
          source: SOURCE_ID,
          id: feature.id,
        },
        {
          'search-active': Boolean(searchTerm),
          'search-match':
            Boolean(searchTerm) && districtName.includes(searchTerm),
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
      aria-label="Rwanda district productivity comparison map"
      aria-describedby="district-map-help"
      className="relative h-[clamp(380px,58vh,620px)] min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-50 sm:h-[min(68vh,680px)]"
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ position: 'absolute' }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] select-none"
      >
        {NEIGHBOR_COUNTRY_LABELS.map((label) => (
          <span
            key={label.id}
            ref={(element) => {
              if (element)
                countryLabelElementsRef.current.set(label.id, element)
              else countryLabelElementsRef.current.delete(label.id)
            }}
            className="absolute whitespace-nowrap text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600/90"
            style={{
              lineHeight: 1.2,
              textShadow: '0 1px 4px #f8faf9, 0 0 2px #f8faf9',
              visibility: 'hidden',
            }}
          >
            {label.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        ))}

        {districtLabelAnchors.map((anchor) => (
          <span
            key={anchor.id}
            ref={(element) => {
              if (element)
                districtLabelElementsRef.current.set(anchor.id, element)
              else districtLabelElementsRef.current.delete(anchor.id)
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm px-0.5 font-semibold text-slate-800"
            style={{
              fontSize: '9px',
              lineHeight: 1.15,
              textShadow: '0 1px 3px #ffffff, 0 0 2px #ffffff',
              visibility: 'hidden',
            }}
          >
            {anchor.name}
          </span>
        ))}
      </div>

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
                {hoveredInsight?.productivityGap.absoluteGap !== undefined
                  ? `${formatSigned(hoveredInsight.productivityGap.absoluteGap)} ${hoveredInsight.productivityGap.unit}`
                  : 'Data unavailable'}
              </dd>
              <dt className="text-slate-500">Comparison status</dt>
              <dd className="font-medium text-slate-700">
                {hoveredInsight?.productivityGap.status === 'below_reference'
                  ? 'Below national reference'
                  : hoveredInsight?.productivityGap.status === 'at_reference'
                    ? 'At national reference'
                    : hoveredInsight?.productivityGap.status === 'above_reference'
                      ? 'Above national reference'
                      : 'Insufficient evidence'}
              </dd>
            </dl>
            {hoveredSummary?.districtYield && (
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {hoveredSummary.districtYield.dataset} ·{' '}
                {
                  hoveredSummary.districtYield.sourceReference.table.split(
                    ':',
                  )[0]
                }{' '}
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
                {hoveredSummary.districtIrrigation.dataset} · Table 64 ·
                observed
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
