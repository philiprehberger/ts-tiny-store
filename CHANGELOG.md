# Changelog

## 0.1.4

- Fix README GitHub URLs to use correct repo name (ts-tiny-store)

## 0.1.3

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.2

- Standardize README and CHANGELOG formatting

## 0.1.1

- Add CI workflow and badges to README

## 0.1.0

- `createStore(initial)` — reactive store with `get`, `set`, `update`, and `subscribe`
- `computed(stores, fn)` — derived read-only store that recomputes when sources change
- `batch(fn)` — batch multiple updates to defer subscriber notifications
- Full TypeScript type definitions
- ESM and CJS dual output
