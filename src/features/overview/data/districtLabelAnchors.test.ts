import { describe, expect, it } from 'vitest'

import {
  createDistrictLabelAnchors,
  type DistrictLabelFeature,
} from './districtLabelAnchors'

function isInsideRing(
  point: readonly [number, number],
  ring: readonly (readonly number[])[],
): boolean {
  let inside = false
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    const currentPosition = ring[index]
    const previousPosition = ring[previous]
    if (!currentPosition || !previousPosition) continue

    const currentLongitude = currentPosition[0]
    const currentLatitude = currentPosition[1]
    const previousLongitude = previousPosition[0]
    const previousLatitude = previousPosition[1]
    if (
      currentLongitude === undefined ||
      currentLatitude === undefined ||
      previousLongitude === undefined ||
      previousLatitude === undefined
    ) {
      continue
    }

    const crossesLatitude =
      currentLatitude > point[1] !== previousLatitude > point[1]
    const crossingLongitude =
      ((previousLongitude - currentLongitude) * (point[1] - currentLatitude)) /
        (previousLatitude - currentLatitude) +
      currentLongitude
    if (crossesLatitude && point[0] < crossingLongitude) inside = !inside
  }
  return inside
}

describe('district map label anchors', () => {
  it('uses a polygon interior centroid and preserves the source identifier and name', () => {
    const feature: DistrictLabelFeature = {
      id: '17',
      name: 'Example District',
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

    expect(createDistrictLabelAnchors([feature])).toEqual([
      {
        id: '17',
        name: 'Example District',
        coordinates: [2, 2],
        area: 16,
      },
    ])
  })

  it('moves a concave polygon anchor inside the district boundary', () => {
    const feature: DistrictLabelFeature = {
      id: 'concave',
      name: 'Concave District',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [4, 0],
            [4, 4],
            [3, 4],
            [3, 1],
            [1, 1],
            [1, 4],
            [0, 4],
            [0, 0],
          ],
        ],
      },
    }

    const anchor = createDistrictLabelAnchors([feature])[0]
    const outerRing =
      feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : undefined

    expect(anchor).toBeDefined()
    expect(outerRing).toBeDefined()
    expect(isInsideRing(anchor?.coordinates ?? [0, 0], outerRing ?? [])).toBe(
      true,
    )
  })

  it('anchors a multipart district in its largest polygon', () => {
    const feature: DistrictLabelFeature = {
      id: 'multipart',
      name: 'Multipart District',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
          [
            [
              [10, 10],
              [14, 10],
              [14, 14],
              [10, 14],
              [10, 10],
            ],
          ],
        ],
      },
    }

    expect(createDistrictLabelAnchors([feature])[0]).toMatchObject({
      coordinates: [12, 12],
      area: 16,
    })
  })
})
