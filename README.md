# Trailfolk SG

A Singapore hiking discovery and route planner built with Next.js App Router and strict TypeScript.

## Run locally

Use Node.js 24, then run `npm install` and `npm run dev`. Open http://localhost:3000.

## Features

- Responsive forest-green and cream interface with searchable, filterable trails across Singapore.
- Interactive Leaflet map using Singapore Land Authority OneMap tiles and attribution.
- Up to eight custom stops, selected from known places or the map, with reordering, removal and draggable map markers.
- Server-side OneMap walking directions when configured; otherwise an explicit unavailable state with no fabricated path.
- Walking pace and time-budget estimates, saved favourites and draft plans in local browser storage.
- Downloadable JSON itinerary, geolocation centering, and pre-hike checklist.
- NParks source links and weather/advisory links. Trail photos are illustrative Unsplash images.

## Enable walking directions

Copy `.env.example` to `.env.local` and set `ONEMAP_TOKEN` to a valid OneMap access token obtained via https://www.onemap.gov.sg/apidocs/authentication. Restart the server. Never expose this token using a NEXT_PUBLIC variable or commit it. Tokens expire and need replacement; automatic token renewal is not implemented.

The route endpoint validates 2–8 Singapore-area stops, requests walking routes between consecutive points and decodes OneMap route geometry. A request fails as a whole if any leg fails. Legs are requested in parallel with an 18-second overall timeout; client requests are debounced and cancelled when stops change. An absent or expired token produces an explicit unavailable state, not simulated directions.

## Data and limits

Curated trail lengths are based on NParks publications linked from each trail. Entrance coordinates are approximate. Difficulty is editorial and accounts for terrain and length; it is not a fitness or medical assessment. Guide lengths may describe loops, one-way trails or networks; the detail panel explains this. A selected entrance is not the full trail geometry.

Walking time uses 2.5, 3.5 or 4.5 km/h, plus 15% breaks. Catalog times apply 15% extra for moderate terrain and 35% for challenging terrain. Custom route times do not include elevation or surface information. The time-budget result is only an estimate. Only successful OneMap responses produce a displayed walking distance or route. Individual legs are drawn separately, so gaps between mapped paths are never joined with invented segments. Stops more than 150 metres from the returned path are rejected; offsets over 30 metres produce a warning. OneMap distances exclude these offsets.

No live closures, weather, elevation, offline maps, account sync or turn-by-turn navigation are provided. Check NParks and Singapore weather before hiking. External images, fonts, tiles and directions require internet access. Saved items are local to the browser; clearing browser data removes them.

Before public deployment, add distributed rate limiting and quota monitoring for the routing endpoint, automate OneMap token refresh, and verify current trail access and routing coverage. The app is currently a local working prototype, not a verified navigation service.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm start` to serve a production build

## Key files

- `src/app/page.tsx`: discovery and planner interactions
- `src/components/trail-map.tsx`: interactive OneMap basemap
- `src/app/api/route/route.ts`: server-only walking route integration
- `src/lib/trails.ts`: trail catalog, input checks and effort calculations
- `src/app/globals.css`: responsive theme

## Automated checks

`npm test` checks input validation, distance and pace calculations, polyline decoding, invalid paths, endpoint alignment and multi-leg distance totals. A valid OneMap token is required for an end-to-end live directions test.

## Production token renewal

The production ONEMAP_TOKEN is stored as a Vercel Secret. Replacing a token locally does not update production: securely update the Vercel production variable and redeploy. Never run an environment pull over your manually edited local file without preserving its values. When the token expires, directions display a connection-refresh message; no approximate path is substituted.
