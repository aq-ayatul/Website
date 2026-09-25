import { NextResponse } from 'next/server';
import { directDistance, validPoint, type Point } from '@/lib/trails';
import { assembleRoute, parseWalkingLeg } from '@/lib/routing';

export const maxDuration = 30;

class RouteError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function POST(request: Request) {
  let points: Point[];
  try {
    const text = await request.text();
    if (text.length > 10000) throw new Error();
    const body = JSON.parse(text);
    if (!Array.isArray(body.points) || body.points.length < 2 || body.points.length > 8 || !body.points.every(validPoint)) throw new Error();
    points = body.points;
  } catch {
    return NextResponse.json({error:'Choose 2–8 stops within Singapore.'},{status:400});
  }
  if (points.slice(1).some((point,index) => directDistance([points[index],point]) < .005)) {
    return NextResponse.json({error:'Two consecutive stops are in the same place. Move or remove one of them.'},{status:400});
  }
  const token = process.env.ONEMAP_TOKEN?.trim();
  if (!token) return NextResponse.json({error:'Walking directions are not connected yet. Please try again later.'},{status:503});
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),18000);
  const signal = AbortSignal.any([controller.signal,request.signal]);
  try {
    const legs = await Promise.all(points.slice(1).map(async (end,index) => {
      const start = points[index];
      const query = new URLSearchParams({start:`${start.lat},${start.lng}`,end:`${end.lat},${end.lng}`,routeType:'walk'});
      const response = await fetch(`https://www.onemap.gov.sg/api/public/routingsvc/route?${query}`, {
        headers:{Authorization:token}, signal, cache:'no-store',
      });
      if (response.status === 401 || response.status === 403) throw new RouteError('Walking directions need a connection refresh. Please try again after the site owner renews the OneMap token.',503);
      if (response.status === 429) throw new RouteError('Walking directions are busy. Wait a moment before trying again.',429);
      if (response.status === 400 || response.status === 404 || response.status === 422) throw new RouteError(`No walking route is available between stops ${index+1} and ${index+2}. Choose points on public walking paths or marked entrances.`,422);
      if (!response.ok) throw new RouteError('OneMap is temporarily unavailable. Please try again.',502);
      try { return parseWalkingLeg(await response.json(),start,end); }
      catch { throw new RouteError(`No usable walking path was found for stops ${index+1}–${index+2}. Move the stops to nearby public paths or marked entrances.`,422); }
    }));
    return NextResponse.json(assembleRoute(legs),{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const timeoutError = signal.aborted;
    controller.abort();
    if (error instanceof RouteError) return NextResponse.json({error:error.message},{status:error.status});
    return NextResponse.json({error:timeoutError?'Routing took too long. Please retry or choose closer stops.':'Walking directions could not be reached. Please try again.'},{status:502});
  } finally { clearTimeout(timeout); }
}
