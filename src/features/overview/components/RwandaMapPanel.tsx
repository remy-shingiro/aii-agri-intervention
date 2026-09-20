import { useEffect, useRef, useState } from 'react'
import {
  Compass,
  LocateFixed,
  Minus,
  Plus,
} from 'lucide-react'
import maplibregl from 'maplibre-gl'

import { districtEvidence } from '../data/districtEvidence'
import { AttentionLegend } from './AttentionLegend'

import 'maplibre-gl/dist/maplibre-gl.css'

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
const LABEL_LAYER_ID = 'rwanda-district-labels'

interface RwandaMapPanelProps {
  selectedDistrict?: string
  onDistrictSelect?: (districtName: string) => void
}

export function RwandaMapPanel({
  selectedDistrict,
  onDistrictSelect,
}: RwandaMapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: RWANDA_CENTER,
      zoom: 7.5,
      minZoom: 6.5,
      maxZoom: 11,
      maxBounds: RWANDA_BOUNDS,
      attributionControl: true,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f7faf8',
            },
          },
        ],
      },
    })

    mapRef.current = map

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: DISTRICT_SOURCE_URL,
        promoteId: 'district_id',
      })

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'match',
            ['get', 'district_id'],

            ...districtEvidence.flatMap((district) => [
              district.districtId,
              getAttentionColor(district.attention),
            ]),

            '#e2e8f0',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.9,
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

      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6.5,
            8,
            9,
            11,
          ],
          'text-font': ['Open Sans Regular'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#17324d',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      })

      setMapReady(true)
    })

    map.on('click', FILL_LAYER_ID, (event) => {
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
        onDistrictSelect?.(districtName)
      }
    })

    map.on('mouseenter', FILL_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', FILL_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onDistrictSelect])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !mapReady) {
      return
    }

    map.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', [
      'case',
      [
        'boolean',
        ['feature-state', 'selected'],
        false,
      ],
      0.95,
      0.78,
    ])

    const source = map.getSource(SOURCE_ID)

    if (!source || source.type !== 'geojson') {
      return
    }

    const clearSelection = () => {
      const features = map.querySourceFeatures(SOURCE_ID)

      for (const feature of features) {
        if (feature.id !== undefined) {
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

    if (selectedFeature?.id !== undefined) {
      map.setFeatureState(
        {
          source: SOURCE_ID,
          id: selectedFeature.id,
        },
        {
          selected: true,
        },
      )
    }
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
      className="relative h-[min(72vh,680px)] min-h-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
    >
      <div
        className="absolute inset-0"
        ref={mapContainerRef}
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

      <div className="absolute bottom-4 right-4 z-10 hidden items-center gap-3 sm:flex">
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

      {!mapReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">
            Loading Rwanda district map…
          </p>
        </div>
      )}
    </section>
  )
}

function getAttentionColor(
  attention: DistrictEvidence['attention'],
) {
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