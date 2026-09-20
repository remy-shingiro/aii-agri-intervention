import { useEffect, useRef, useState } from 'react'
import { Compass, LocateFixed, Minus, Plus } from 'lucide-react'
import { Map } from 'maplibre-gl'
import type {
  DataDrivenPropertyValueSpecification,
  MapLayerMouseEvent,
} from 'maplibre-gl'

import 'maplibre-gl/dist/maplibre-gl.css'

import { districtEvidence } from '../data/districtEvidence'
import type { DistrictEvidence } from '../types/overview.types'
import { AttentionLegend } from './AttentionLegend'

const RWANDA_CENTER: [number, number] = [29.8739, -1.9441]

const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [28.8, -2.9],
  [31.0, -1.0],
]

const DISTRICT_SOURCE_URL =
  'https://gis.naeb.gov.rw/server/rest/services/Hosted/Administrative_Boundaries_WFL1/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson'

const SOURCE_ID = 'rwanda-districts'
const FILL_LAYER_ID = 'rwanda-district-fills'
const OUTLINE_LAYER_ID = 'rwanda-district-outlines'

interface RwandaMapPanelProps {
  selectedDistrict?: string
  onDistrictSelect?: (districtName: string) => void
}

function createDistrictFillColorExpression(): DataDrivenPropertyValueSpecification<string> {
  const expression: unknown[] = [
    'match',
    ['to-string', ['get', 'district_i']],
  ]

  for (const district of districtEvidence) {
    expression.push(
      String(district.districtId),
      getAttentionColor(district.attention),
    )
  }

  expression.push('#dbe5df')

  return expression as DataDrivenPropertyValueSpecification<string>
}

export function RwandaMapPanel({
  selectedDistrict,
  onDistrictSelect,
}: RwandaMapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const onDistrictSelectRef = useRef(onDistrictSelect)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    onDistrictSelectRef.current = onDistrictSelect
  }, [onDistrictSelect])

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
          promoteId: 'district_i',
        })

        map.addLayer({
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': createDistrictFillColorExpression(),
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              0.95,
              0.78,
            ],
          },
        })

        map.addLayer({
          id: OUTLINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.2,
          },
        })

        setMapReady(true)
      } catch (error) {
        console.error('Failed to initialize Rwanda district map:', error)

        setMapError(
          'The Rwanda district map could not be initialized.',
        )
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

    const handleDistrictClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]

      if (!feature) {
        return
      }

      const districtName = String(
        feature.properties?.name ??
          feature.properties?.district ??
          '',
      )

      if (districtName) {
        onDistrictSelectRef.current?.(districtName)
      }
    }

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('load', handleMapLoad)
    map.on('error', handleMapError)
    map.on('click', FILL_LAYER_ID, handleDistrictClick)
    map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter)
    map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave)

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
      const name = String(
        feature.properties?.name ??
          feature.properties?.district ??
          '',
      )

      return name === selectedDistrict
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
      className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-[600px] lg:h-[680px]"
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
      />

      <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
        <AttentionLegend />
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          aria-label="Zoom in"
          className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          onClick={zoomIn}
          type="button"
        >
          <Plus className="size-4" />
        </button>

        <div className="border-t border-slate-200" />

        <button
          aria-label="Zoom out"
          className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          onClick={zoomOut}
          type="button"
        >
          <Minus className="size-4" />
        </button>

        <div className="border-t border-slate-200" />

        <button
          aria-label="Reset map view"
          className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          onClick={resetView}
          type="button"
        >
          <LocateFixed className="size-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 hidden sm:block">
        <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Compass
              aria-hidden="true"
              className="size-5 text-slate-700"
            />

            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              North
            </span>
          </div>
        </div>
      </div>

      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">
            Loading Rwanda district map…
          </p>
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
    </section>
  )
}

function getAttentionColor(
  attention: DistrictEvidence['attention'],
): string {
  switch (attention) {
    case 'high':
      return '#ef6a4a'

    case 'medium':
      return '#f3c84b'

    case 'low':
      return '#63b36b'

    default:
      return '#dbe3e0'
  }
}
