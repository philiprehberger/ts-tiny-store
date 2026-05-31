# @philiprehberger/tiny-store

[![CI](https://github.com/philiprehberger/ts-tiny-store/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-tiny-store/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/tiny-store.svg)](https://www.npmjs.com/package/@philiprehberger/tiny-store)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-tiny-store)](https://github.com/philiprehberger/ts-tiny-store/commits/main)

![@philiprehberger/tiny-store](https://raw.githubusercontent.com/philiprehberger/ts-tiny-store/main/package-card.webp)

Reactive state container in under 1KB — framework agnostic

## Installation

```bash
npm install @philiprehberger/tiny-store
```

## Usage

```ts
import { createStore, computed, batch } from '@philiprehberger/tiny-store';

// Create a store
const count = createStore(0);
count.get(); // 0

// Subscribe to changes
const unsubscribe = count.subscribe((value, previous) => {
  console.log(`${previous} -> ${value}`);
});

count.set(1); // logs: 0 -> 1
count.update((n) => n + 1); // logs: 1 -> 2

// Derived stores
const doubled = computed([count], (n) => n * 2);
doubled.get(); // 4

// Batch updates — subscribers notified once per set, after batch completes
batch(() => {
  count.set(10);
  count.set(20);
});

unsubscribe();
```

### Custom Equality

By default, subscribers are skipped only when the new value is `Object.is`-equal to the previous one — so two distinct objects with identical shape will both notify. Pass a custom `equals` function (e.g. shallow equality) to control this:

```ts
import { createStore } from '@philiprehberger/tiny-store';

const user = createStore(
  { name: 'Jane', age: 30 },
  { equals: (a, b) => a.name === b.name && a.age === b.age },
);

user.subscribe((u) => console.log('changed', u));

user.set({ name: 'Jane', age: 30 }); // no notification — shallow equal
user.set({ name: 'Jane', age: 31 }); // notifies
```

## API

### `createStore<T>(initial: T, options?: StoreOptions<T>): Store<T>`

Create a reactive store with an initial value.

| Method | Description |
| --- | --- |
| `get()` | Return the current value |
| `set(value)` | Replace the value and notify subscribers (skipped if the equality function returns `true`) |
| `update(fn)` | Update via callback: `store.update(n => n + 1)` |
| `subscribe(listener)` | Register a `(value, previous) => void` listener; returns an unsubscribe function |

#### `StoreOptions<T>`

| Option | Type | Description |
| --- | --- | --- |
| `equals` | `(a: T, b: T) => boolean` | Custom equality function used to decide whether subscribers are notified after `set` / `update`. Defaults to `Object.is`. Subscribers fire only when this returns `false`. |

### `computed<T>(stores, fn): ComputedStore<T>`

Create a read-only derived store that recomputes whenever any source store changes. Subscribers are only notified when the computed result actually differs (`Object.is`).

### `batch(fn: () => void): void`

Execute `fn` synchronously, deferring all subscriber notifications until the batch completes. Supports nesting. If `fn` throws, pending notifications are still flushed.

## Development

```bash
npm install
npm run build
npm run typecheck
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-tiny-store)

🐛 [Report issues](https://github.com/philiprehberger/ts-tiny-store/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-tiny-store/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
