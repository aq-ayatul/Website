import { directDistance, type Point } from './trails.ts';

export type Coordinate = [number, number];
export type WalkingLeg = {
  distance: number;
  geometry: Coordinate[];
  startOffsetMetres: number;
  endOffsetMetres: number;
};
export type WalkingRoute = {
  distance: number;
  geometry: Coordinate[];
  legs: WalkingLeg[];
  warnings: string[];
  calculatedAt: string;
  provider: string;
};

export function decodePolyline(encoded: string): Coordinate[] {
  if (!encoded || encoded.length > 500000) throw new Error('Invalid route geometry');
  let index = 0, lat = 0, lng = 0;
  const points: Coordinate[] = [];
  function readNumber() {
    let result = 0, shift = 0, byte: number;
    do {
      if (index >= encoded.length || shift > 30) throw new Error('Invalid route geometry');
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new Error('Invalid route geometry');
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
  while (index < encoded.length) {
    lat += readNumber(); lng += readNumber();
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function parseWalkingLeg(data: unknown, start: Point, end: Point): WalkingLeg {
  if (!data || typeof data !== 'object') throw new Error('Invalid routing response');
  const route = data as { status?: number; route_geometry?: string; route_summary?: { total_distance?: number } };
  const metres = route.route_summary?.total_distance;
  if (route.status !== 0 || typeof metres !== 'number' || !Number.isFinite(metres) || metres <= 0 || typeof route.route_geometry !== 'string') throw new Error('No walking route');
  const geometry = decodePolyline(route.route_geometry);
  if (geometry.length < 2 || geometry.some(([lat,lng]) => lat < 1.1 || lat > 1.6 || lng < 103.5 || lng > 104.5)) throw new Error('Invalid route geometry');
  const offset = (p: Point, c: Coordinate) => Math.round(directDistance([p,{lat:c[0],lng:c[1],name:'Path endpoint'}])*1000);
  const startOffsetMetres = offset(start, geometry[0]);
  const endOffsetMetres = offset(end, geometry[geometry.length-1]);
  if (Math.max(startOffsetMetres,endOffsetMetres) > 150) throw new Error('Selected stop is too far from a mapped walking path');
  return { distance: metres / 1000, geometry, startOffsetMetres, endOffsetMetres };
}

export function assembleRoute(legs: WalkingLeg[]): WalkingRoute {
  return {
    distance: legs.reduce((sum,leg) => sum+leg.distance,0),
    geometry: legs.flatMap(leg=>leg.geometry),
    legs,
    warnings: legs.flatMap((leg,i) => Math.max(leg.startOffsetMetres,leg.endOffsetMetres)>30
      ? [`Section ${i+1}: OneMap starts ${leg.startOffsetMetres} m from your selected start and ends ${leg.endOffsetMetres} m from your selected finish. These gaps are not included in the walking distance; choose a marked entrance for better alignment.`] : []),
    calculatedAt: new Date().toISOString(),
    provider:'OneMap walking directions',
  };
}
