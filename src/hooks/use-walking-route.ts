'use client';
import { useEffect, useState } from 'react';
import type { Point } from '@/lib/trails';
import type { WalkingRoute } from '@/lib/routing';

type State = { key: string; result: WalkingRoute | null; error: string };
export function useWalkingRoute(points: Point[]) {
  const [attempt,setAttempt] = useState(0);
  const [state,setState] = useState<State | null>(null);
  const key = JSON.stringify([points,attempt]);
  useEffect(() => {
    if (points.length < 2) return;
    const controller = new AbortController();
    let cancelled = false;
    const timer = setTimeout(async () => {
      const timeout = setTimeout(()=>controller.abort(),22000);
      try {
        const response = await fetch('/api/route', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({points}),signal:controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Directions unavailable. Please retry.');
        if (!cancelled) setState({key,result:data as WalkingRoute,error:''});
      } catch (error) {
        if (!cancelled) setState({key,result:null,error:controller.signal.aborted?'The route request timed out. Please retry.':error instanceof Error?error.message:'Connection unavailable. Please retry.'});
      } finally { clearTimeout(timeout); }
    },350);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  },[points,key]);
  const current = state?.key === key && points.length >= 2 ? state : null;
  return { result: current?.result ?? null, routeError: current?.error ?? '', loading: points.length >= 2 && !current, retry:()=>setAttempt(n=>n+1) };
}
