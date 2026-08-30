# Contributing to SkyRoster

Thanks for your interest! 🎉

## Setup

1. Fork & clone the repo
2. `npm install`
3. `cp .env.example .env.local` and fill in your Firebase config
4. `npm run dev`

## Before submitting a PR

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No new console errors
- [ ] Commits follow conventional format (e.g., `feat:`, `fix:`, `docs:`)

## Style

- Use functional React components with hooks
- Keep files under ~300 lines; split when they grow
- No hardcoded secrets — use `.env.local`
