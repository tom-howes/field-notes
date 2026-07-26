import { booleanIntersects, coordAll, point, pointToPolygonDistance } from '@turf/turf'
import { getCountryBoundary } from './geo/country-boundaries'

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two lat/lng points, in km. Used as a fallback
 *  when a country's border geometry isn't available. */
export function haversineDistanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)))
}

/** Distance between the two countries' *closest borders*, not their centroids — so
 *  guessing a small neighbor of a huge country (e.g. Mongolia for Russia) scores as
 *  near-zero instead of the centroid-to-centroid distance, which can be thousands of
 *  km off for large countries. Falls back to centroid distance if either country's
 *  border geometry isn't available. */
export function borderDistanceKm(
  guessed: { isoCode: string; latitude: number; longitude: number },
  target: { isoCode: string; latitude: number; longitude: number },
): number {
  if (guessed.isoCode === target.isoCode) return 0

  const guessedBoundary = getCountryBoundary(guessed.isoCode)
  const targetBoundary = getCountryBoundary(target.isoCode)
  if (!guessedBoundary || !targetBoundary) return haversineDistanceKm(guessed, target)

  if (booleanIntersects(guessedBoundary, targetBoundary)) return 0

  // The minimum distance between two polygons' boundaries is always achieved at a
  // vertex of one against an edge of the other, so scanning every vertex of each
  // shape against the other shape (not just against each other's vertices) gives
  // the exact minimum, not an approximation.
  let min = Infinity
  for (const coord of coordAll(guessedBoundary)) {
    const d = pointToPolygonDistance(point(coord), targetBoundary, { units: 'kilometers' })
    if (d < min) min = d
  }
  for (const coord of coordAll(targetBoundary)) {
    const d = pointToPolygonDistance(point(coord), guessedBoundary, { units: 'kilometers' })
    if (d < min) min = d
  }

  return Math.round(min)
}
