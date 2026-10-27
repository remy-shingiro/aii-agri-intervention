// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RwandaMapPanel } from './RwandaMapPanel'

const mapState = vi.hoisted(() => ({
  listeners: {} as Record<string, Array<(...args: never[]) => void>>,
  features: [] as object[],
  fire: null as ((event: string, eventData?: unknown) => void) | null,
}))

vi.mock('maplibre-gl', () => {
  class MockMap {
    private readonly canvas = document.createElement('canvas')

    constructor() {
      mapState.listeners = {}
      mapState.fire = (event, eventData = {}) => {
        for (const listener of mapState.listeners[event] ?? []) {
          Reflect.apply(listener, this, [eventData])
        }
      }
    }

    on(
      event: string,
      layerOrHandler: string | ((...args: never[]) => void),
      handler?: (...args: never[]) => void,
    ) {
      const callback =
        typeof layerOrHandler === 'function' ? layerOrHandler : handler
      if (callback) {
        mapState.listeners[event] ??= []
        mapState.listeners[event].push(callback)
      }
      return this
    }

    off(
      event: string,
      layerOrHandler: string | ((...args: never[]) => void),
      handler?: (...args: never[]) => void,
    ) {
      const callback =
        typeof layerOrHandler === 'function' ? layerOrHandler : handler
      if (callback) {
        mapState.listeners[event] = (mapState.listeners[event] ?? []).filter(
          (listener) => listener !== callback,
        )
      }
      return this
    }

    addSource() {}
    addLayer() {}
    getCanvas() {
      return this.canvas
    }
    setMaxBounds() {}
    resize() {}
    getZoom() {
      return 7.5
    }
    setZoom() {}
    getLayer() {
      return true
    }
    querySourceFeatures() {
      return mapState.features
    }
    setFeatureState() {}
    setPaintProperty() {}
    project() {
      return { x: 0, y: 0 }
    }
    remove() {}
    zoomIn() {}
    zoomOut() {}
    fitBounds() {}
  }

  return {
    Map: MockMap,
    setWorkerUrl: vi.fn(),
  }
})

vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({
  default: 'mock-maplibre-worker.js',
}))

class MockResizeObserver {
  observe() {}
  disconnect() {}
}

function districtFeature() {
  return {
    id: '17',
    properties: { district: 'Example District', code_dist: '17' },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
      ],
    },
  }
}

function renderMap() {
  return render(
    <RwandaMapPanel
      crop="maize"
      districtSearch=""
      season="season-a"
      year="2024-25"
    />,
  )
}

function fireMapEvent(event: string, eventData?: unknown) {
  act(() => mapState.fire?.(event, eventData))
}

beforeEach(() => {
  mapState.listeners = {}
  mapState.features = []
  mapState.fire = null
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('RwandaMapPanel source readiness', () => {
  it('keeps the loading state until the district source is loaded', () => {
    renderMap()

    expect(screen.getByText('Loading Rwanda district map…')).toBeInTheDocument()

    fireMapEvent('load')
    expect(screen.getByText('Loading Rwanda district map…')).toBeInTheDocument()

    fireMapEvent('sourcedata', {
      sourceId: 'another-source',
      isSourceLoaded: true,
    })
    fireMapEvent('sourcedata', {
      sourceId: 'rwanda-districts',
      isSourceLoaded: false,
    })
    expect(screen.getByText('Loading Rwanda district map…')).toBeInTheDocument()
  })

  it('marks the map ready after loaded district features are available', () => {
    mapState.features = [districtFeature()]
    renderMap()

    fireMapEvent('load')
    fireMapEvent('sourcedata', {
      sourceId: 'rwanda-districts',
      isSourceLoaded: true,
    })

    expect(
      screen.queryByText('Loading Rwanda district map…'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Example District')).toBeInTheDocument()
  })

  it('shows the map error state when the source fails before readiness', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderMap()

    fireMapEvent('load')
    fireMapEvent('error', { error: { message: 'Network request failed' } })

    expect(
      screen.queryByText('Loading Rwanda district map…'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Unable to load the district map'),
    ).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(
      'MapLibre error:',
      'Network request failed',
    )
  })

  it('shows the map error state if the loaded source has no usable features', () => {
    renderMap()

    fireMapEvent('load')
    fireMapEvent('sourcedata', {
      sourceId: 'rwanda-districts',
      isSourceLoaded: true,
    })

    expect(
      screen.getByText('Unable to load the district map'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Loading Rwanda district map…'),
    ).not.toBeInTheDocument()
  })
})
