export type DistrictPolygonCoordinates =
  readonly (readonly (readonly number[])[])[]

export interface DistrictLabelFeature {
  readonly id: string
  readonly name: string
  readonly geometry:
    | {
        readonly type: 'Polygon'
        readonly coordinates: DistrictPolygonCoordinates
      }
    | {
        readonly type: 'MultiPolygon'
        readonly coordinates: readonly DistrictPolygonCoordinates[]
      }
}

export interface DistrictLabelAnchor {
  readonly id: string
  readonly name: string
  readonly coordinates: readonly [number, number]
  readonly area: number
}

type Coordinate = readonly [number, number]

function readCoordinate(position: readonly number[]): Coordinate | undefined {
  const longitude = position[0]
  const latitude = position[1]
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    ? [longitude, latitude]
    : undefined
}

function getRingArea(ring: DistrictPolygonCoordinates[number]): number {
  let twiceArea = 0
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = readCoordinate(ring[index])
    const next = readCoordinate(ring[index + 1])
    if (!current || !next) continue
    twiceArea += current[0] * next[1] - next[0] * current[1]
  }
  return twiceArea / 2
}

function getRingCentroid(
  ring: DistrictPolygonCoordinates[number],
): Coordinate | undefined {
  let twiceArea = 0
  let longitudeTotal = 0
  let latitudeTotal = 0

  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = readCoordinate(ring[index])
    const next = readCoordinate(ring[index + 1])
    if (!current || !next) continue

    const cross = current[0] * next[1] - next[0] * current[1]
    twiceArea += cross
    longitudeTotal += (current[0] + next[0]) * cross
    latitudeTotal += (current[1] + next[1]) * cross
  }

  if (twiceArea === 0) return undefined
  return [longitudeTotal / (3 * twiceArea), latitudeTotal / (3 * twiceArea)]
}

function isInsideRing(
  point: Coordinate,
  ring: DistrictPolygonCoordinates[number],
): boolean {
  let inside = false

  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    const current = readCoordinate(ring[index])
    const prior = readCoordinate(ring[previous])
    if (!current || !prior) continue

    const crossesLatitude = current[1] > point[1] !== prior[1] > point[1]
    const crossingLongitude =
      ((prior[0] - current[0]) * (point[1] - current[1])) /
        (prior[1] - current[1]) +
      current[0]

    if (crossesLatitude && point[0] < crossingLongitude) inside = !inside
  }

  return inside
}

function getDistanceToRing(
  point: Coordinate,
  ring: DistrictPolygonCoordinates[number],
): number {
  let shortestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < ring.length - 1; index += 1) {
    const start = readCoordinate(ring[index])
    const end = readCoordinate(ring[index + 1])
    if (!start || !end) continue

    const longitudeDelta = end[0] - start[0]
    const latitudeDelta = end[1] - start[1]
    const lengthSquared = longitudeDelta ** 2 + latitudeDelta ** 2
    const projection =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((point[0] - start[0]) * longitudeDelta +
                (point[1] - start[1]) * latitudeDelta) /
                lengthSquared,
            ),
          )
    const distance = Math.hypot(
      point[0] - (start[0] + projection * longitudeDelta),
      point[1] - (start[1] + projection * latitudeDelta),
    )
    shortestDistance = Math.min(shortestDistance, distance)
  }

  return shortestDistance
}

function isInsidePolygon(
  point: Coordinate,
  rings: DistrictPolygonCoordinates,
): boolean {
  return (
    Boolean(rings[0]) &&
    isInsideRing(point, rings[0]) &&
    !rings.slice(1).some((ring) => isInsideRing(point, ring))
  )
}

function findInteriorPoint(
  rings: DistrictPolygonCoordinates,
): Coordinate | undefined {
  const outerRing = rings[0]
  if (!outerRing?.length) return undefined

  let minLongitude = Number.POSITIVE_INFINITY
  let maxLongitude = Number.NEGATIVE_INFINITY
  let minLatitude = Number.POSITIVE_INFINITY
  let maxLatitude = Number.NEGATIVE_INFINITY

  for (const position of outerRing) {
    const point = readCoordinate(position)
    if (!point) continue
    minLongitude = Math.min(minLongitude, point[0])
    maxLongitude = Math.max(maxLongitude, point[0])
    minLatitude = Math.min(minLatitude, point[1])
    maxLatitude = Math.max(maxLatitude, point[1])
  }

  const divisions = 20
  let bestPoint: Coordinate | undefined
  let bestDistance = 0
  for (let x = 0; x < divisions; x += 1) {
    for (let y = 0; y < divisions; y += 1) {
      const point: Coordinate = [
        minLongitude + ((x + 0.5) / divisions) * (maxLongitude - minLongitude),
        minLatitude + ((y + 0.5) / divisions) * (maxLatitude - minLatitude),
      ]
      if (!isInsidePolygon(point, rings)) continue

      const distance = Math.min(
        ...rings.map((ring) => getDistanceToRing(point, ring)),
      )
      if (distance > bestDistance) {
        bestDistance = distance
        bestPoint = point
      }
    }
  }

  return bestPoint
}

function getPolygonAnchor(
  rings: DistrictPolygonCoordinates,
): { coordinates: Coordinate; area: number } | undefined {
  const outerRing = rings[0]
  if (!outerRing || outerRing.length < 4) return undefined

  const area = Math.abs(getRingArea(outerRing))
  const centroid = getRingCentroid(outerRing)
  const coordinates =
    centroid && isInsidePolygon(centroid, rings)
      ? centroid
      : (findInteriorPoint(rings) ??
        readCoordinate(outerRing[Math.floor(outerRing.length / 2)]))

  return coordinates && Number.isFinite(area)
    ? { coordinates, area }
    : undefined
}

/** Finds a stable interior label anchor using only a district's source geometry. */
export function createDistrictLabelAnchors(
  features: readonly DistrictLabelFeature[],
): readonly DistrictLabelAnchor[] {
  const anchors = new Map<string, DistrictLabelAnchor>()

  for (const feature of features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    const largestPolygon = polygons
      .map(getPolygonAnchor)
      .filter(
        (anchor): anchor is { coordinates: Coordinate; area: number } =>
          anchor !== undefined,
      )
      .sort((first, second) => second.area - first.area)[0]

    if (!largestPolygon || !feature.id || !feature.name) continue
    anchors.set(feature.id, {
      id: feature.id,
      name: feature.name,
      coordinates: largestPolygon.coordinates,
      area: largestPolygon.area,
    })
  }

  return [...anchors.values()].sort((first, second) => second.area - first.area)
}
