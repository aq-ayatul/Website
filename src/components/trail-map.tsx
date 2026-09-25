'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Maximize2, Map as MapIcon } from 'lucide-react';
import { validPoint, type Point, type Trail } from '@/lib/trails';
import type { WalkingRoute } from '@/lib/routing';

type Props = { trails: Trail[]; selected: string | null; onSelect: (id: string) => void; points: Point[]; route: WalkingRoute | null; planning: boolean; onAdd: (p: Point) => void; onMove: (index: number, p: Point) => void };
export default function TrailMap(props: Props) {
  const container = useRef<HTMLDivElement>(null); const map = useRef<L.Map | null>(null); const layers = useRef<L.LayerGroup | null>(null); const current = useRef(props); const [error, setError] = useState('');
  useEffect(() => { current.current = props; }, [props]);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: false, minZoom: 11, maxZoom: 18 }).setView([1.352, 103.819], 11); map.current = instance;
    instance.setMaxBounds([[1.14,103.55],[1.5,104.15]]);
    const tiles = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', { attribution: '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a> &copy; contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>', maxZoom: 18 }).addTo(instance);
    tiles.on('tileerror', () => setError('Map tiles could not load. Check your connection; the stop list still works.'));
    tiles.on('tileload', () => setError(''));
    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    layers.current = L.layerGroup().addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => { if (current.current.planning) current.current.onAdd({ lat: event.latlng.lat, lng: event.latlng.lng, name: `Map stop (${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)})` }); });
    const observer = new ResizeObserver(() => instance.invalidateSize()); observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const group = layers.current; if (!group) return; group.clearLayers();
    props.trails.forEach((trail) => {
      const marker = L.marker([trail.point.lat, trail.point.lng], { title: trail.name, alt: trail.name, icon: L.divIcon({ className: 'trail-pin', html: `<span class="${props.selected === trail.id ? 'active' : ''}">♧</span>`, iconSize: [36,36], iconAnchor: [18,36] }) });
      const label = document.createElement('span'); label.textContent = trail.name; marker.bindTooltip(label, { direction: 'top', offset: [0,-30] });
      marker.on('click', () => current.current.onSelect(trail.id)); marker.addTo(group);
    });
    props.points.forEach((p,i) => {
      const marker = L.marker([p.lat,p.lng], { draggable:true, title: 'Drag stop '+(i+1)+': '+p.name, icon: L.divIcon({ className:'stop-pin', html:'<span>'+(i+1)+'</span>', iconSize:[30,30],iconAnchor:[15,15] }) }).addTo(group);
      marker.on('dragend',()=>{
        const position=marker.getLatLng();
        const point={lat:position.lat,lng:position.lng,name:'Map stop ('+position.lat.toFixed(4)+', '+position.lng.toFixed(4)+')'};
        if (!validPoint(point)) { marker.setLatLng([p.lat,p.lng]); setError('Please keep stops within Singapore.'); return; }
        current.current.onMove(i,point);
      });
    });
    props.route?.legs.forEach(leg => {
      L.polyline(leg.geometry,{color:'#fff',weight:8,opacity:.85}).addTo(group);
      L.polyline(leg.geometry,{color:'#245c40',weight:4}).addTo(group);
      [leg.geometry[0],leg.geometry[leg.geometry.length-1]].forEach(position => L.circleMarker(position,{radius:4,color:'#245c40',fillColor:'#fff',fillOpacity:1,weight:2}).addTo(group));
    });
  }, [props.trails,props.selected,props.points,props.route]);
  useEffect(() => { const trail = props.trails.find(t => t.id === props.selected); if (trail) map.current?.flyTo([trail.point.lat,trail.point.lng], 13, { duration: .8 }); }, [props.selected, props.trails]);
  useEffect(() => {
    if (props.route?.geometry.length) map.current?.fitBounds(L.latLngBounds(props.route.geometry), {padding:[50,80],maxZoom:16,animate:false});
  },[props.route]);
  function locate() { if (!navigator.geolocation) return setError('Location is not supported in this browser.'); navigator.geolocation.getCurrentPosition(p => { if (p.coords.latitude < 1.16 || p.coords.latitude > 1.48 || p.coords.longitude < 103.6 || p.coords.longitude > 104.1) return setError('Your location is outside the Singapore planning area.'); map.current?.flyTo([p.coords.latitude,p.coords.longitude],14); setError(''); }, () => setError('Location unavailable. Allow location access or select a place manually.')); }
  return <div className="map-wrap"><div ref={container} className="map" aria-label="Interactive Singapore trail map" /><div className="map-label"><span className="live-dot" /> SINGAPORE <span className="map-label-detail">A greener way to explore</span></div><div className="map-actions">{props.route && <button title="Fit walking route" aria-label="Fit walking route" onClick={()=>{if(props.route) map.current?.fitBounds(L.latLngBounds(props.route.geometry),{padding:[50,80],maxZoom:16});}}><MapIcon size={18}/></button>}<button title="Show all Singapore" aria-label="Show all Singapore" onClick={() => map.current?.setView([1.352,103.819],11)}><Maximize2 size={18}/></button><button title="Find my location" aria-label="Find my location" onClick={locate}><LocateFixed size={18}/></button></div><div className="map-legend"><span className="legend-dot"/> Trail entrance {props.route && <><span className="legend-line verified"/> OneMap walking path</>}</div>{error && <div className="map-error" role="status">{error}</div>}{props.planning && <div className="map-instruction">Click to add · Drag numbered stops to move</div>}</div>;
}
