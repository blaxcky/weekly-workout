# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript PWA for tracking weekly workouts. Application code lives in `src/`: `components/` holds reusable UI, `pages/` contains route-level screens, `db/` wraps Dexie/IndexedDB access, and `utils/` stores scheduling, theme, and date helpers. Static assets and PWA icons live in `public/`. Production output is generated into `dist/` and should not be edited by hand.

## Build, Test, and Development Commands
Install dependencies with `npm ci --legacy-peer-deps` for a clean setup that matches CI.

- `npm run dev` starts the local Vite dev server.
- `npm run build` runs TypeScript project checks and creates a production build in `dist/`.
- `npm run lint` runs ESLint across the repo.
- `npm run preview` serves the built app locally for a production-like check.

## Coding Style & Naming Conventions
Use TypeScript with React function components. Follow the existing style: 2-space JSX indentation, semicolons, and single quotes in `.ts`/`.tsx` files. Name components and page files in PascalCase (`WeekOverview.tsx`), hooks and utilities in camelCase (`theme.ts`, `hooks.ts`), and keep database model names explicit (`CompletedExercise`, `WeeklyTemplateEntry`). Prefer small modules scoped to one concern.

Linting is defined in `eslint.config.js` with `typescript-eslint`, `react-hooks`, and React Refresh rules. Run `npm run lint` before opening a PR.

## Testing Guidelines
There is no dedicated automated test suite yet. Until one is added, treat `npm run lint` and `npm run build` as required checks, and manually verify the affected flows in the browser, especially persistence, routing, import/export, and PWA behavior. When adding tests later, place them next to the feature or under a dedicated `src/tests/` area and use clear names like `schedule.test.ts`.

## Commit & Pull Request Guidelines
Recent commits use short Conventional Commit style subjects such as `feat: Smart Daily Focus - Tagesansicht mit Wochenverteilung`. Keep that format (`feat:`, `fix:`, `refactor:`) and describe user-visible behavior, not implementation trivia.

Pull requests should include a brief summary, note any storage or migration impact, link related issues, and attach screenshots or short recordings for UI changes. Merges to `main` trigger the GitHub Pages deploy workflow in `.github/workflows/deploy.yml`.
