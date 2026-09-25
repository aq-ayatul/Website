# Website

A Next.js application using the App Router and strict TypeScript.

## Getting started

Use Node.js 24 (the project includes an `.nvmrc`), then run:

```sh
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Editing the website

- `src/app/page.tsx`: homepage
- `src/app/layout.tsx`: shared layout and page metadata
- `src/app/globals.css`: global styles
- `next.config.ts`: Next.js configuration

Use `.ts` for TypeScript and `.tsx` for TypeScript components containing JSX.
The `@/*` import alias points to `src/*`.

## Checks and production

```sh
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build` succeeds.
