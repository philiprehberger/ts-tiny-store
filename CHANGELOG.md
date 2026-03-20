# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-20

### Added

- `createStore(initial)` — reactive store with `get`, `set`, `update`, and `subscribe`
- `computed(stores, fn)` — derived read-only store that recomputes when sources change
- `batch(fn)` — batch multiple updates to defer subscriber notifications
- Full TypeScript type definitions
- ESM and CJS dual output
