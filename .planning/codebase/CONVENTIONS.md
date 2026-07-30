# Code Conventions

**JS**: `'use strict'` IIFE pattern. `const`/`let` (no `var`). Arrow functions for callbacks. PascalCase for constants, camelCase for everything else. Hungarian-lite prefixes for DOM refs not used consistently.

**CSS**: CSS custom properties (`--var`) for all colors, spacing, fonts. Dark theme via `[data-theme="dark"]` selector. Pixel-art design tokens prefixed `--retro-` and `--pxl-`. Mobile-first with `min-width` breakpoints.

**State Persistence**: Every state mutation calls `saveState()` which writes all 14 localStorage keys. Cloud sync debounced via `cloudSyncTimeout`.

**Naming**: `STORAGE_KEYS` const object maps semantic names to localStorage keys. View render functions named `render{ViewName}View`. Helper functions prefixed by domain (`getQueueVideoIds`, `getStats`, `switchView`).
