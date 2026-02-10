# asset_management

## Frontend Deployment (GitHub Pages)

This repository deploys the Vite frontend from `frontend/` to:

- `https://weijiechen2017.github.io/asset_management/`

### Deployment method

- GitHub Pages source: **GitHub Actions**
- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` (or manual run from Actions tab)

### Build settings

- Frontend app folder: `frontend/`
- Build command: `npm run build`
- Output directory: `frontend/dist`
- Vite base path (production): `/asset_management/` in `frontend/vite.config.ts`

### Routing behavior

- The app uses `HashRouter` in `frontend/src/App.tsx` for SPA fallback safety on GitHub Pages project paths.
- Route URLs use `#/...` (for example: `#/allocation`), so refresh/deep links do not 404.
