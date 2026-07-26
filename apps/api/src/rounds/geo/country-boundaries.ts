import { readFileSync } from 'fs'
import { join } from 'path'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { isoNumericToAlpha2 } from './iso-numeric-to-alpha2'

type CountryFeature = Feature<Polygon | MultiPolygon>

// Same world-atlas 110m topology the frontend map renders, so guess-distance
// feedback lines up with what the player sees. Parsed once and cached, since
// converting topology -> per-country GeoJSON on every guess would be wasteful.
let boundariesByIsoCode: Map<string, CountryFeature> | null = null

function loadBoundaries(): Map<string, CountryFeature> {
  if (boundariesByIsoCode) return boundariesByIsoCode

  const topology = JSON.parse(readFileSync(join(__dirname, 'countries-110m.json'), 'utf-8')) as Topology
  const collection = feature(topology, topology.objects.countries as GeometryCollection)

  const map = new Map<string, CountryFeature>()
  for (const f of collection.features) {
    // world-atlas topojson ids can be zero-padded (e.g. "032"); isoNumericToAlpha2
    // keys are un-padded, so normalize through parseInt before lookup.
    const isoCode = isoNumericToAlpha2[String(parseInt(String(f.id), 10))]
    if (isoCode) map.set(isoCode, f as CountryFeature)
  }

  boundariesByIsoCode = map
  return map
}

export function getCountryBoundary(isoCode: string): CountryFeature | undefined {
  return loadBoundaries().get(isoCode)
}
