import type { Store, Listener, Unsubscribe } from './store.js';

/**
 * A read-only derived store whose value is computed from one or more source stores.
 */
export interface ComputedStore<T> {
  /** Return the current computed value. */
  get(): T;
  /** Register a listener that fires when the computed value changes. */
  subscribe(listener: Listener<T>): Unsubscribe;
}

/**
 * Create a derived store that automatically recomputes when any source store changes.
 *
 * @param stores - An array of source stores.
 * @param fn - A function that receives the current values of all source stores and returns the derived value.
 * @returns A read-only `ComputedStore<T>`.
 *
 * @example
 * ```ts
 * const firstName = createStore('Jane');
 * const lastName = createStore('Doe');
 * const fullName = computed([firstName, lastName], (f, l) => `${f} ${l}`);
 * fullName.get(); // 'Jane Doe'
 * ```
 */
export function computed<S extends Store<unknown>[], T>(
  stores: [...S],
  fn: (...values: { [K in keyof S]: S[K] extends Store<infer V> ? V : never }) => T,
): ComputedStore<T> {
  const listeners = new Set<Listener<T>>();

  function getCurrentValues(): { [K in keyof S]: S[K] extends Store<infer V> ? V : never } {
    return stores.map((s) => s.get()) as never;
  }

  let value = fn(...getCurrentValues());

  function recompute(): void {
    const previous = value;
    value = fn(...getCurrentValues());
    if (!Object.is(value, previous)) {
      for (const listener of listeners) {
        listener(value, previous);
      }
    }
  }

  // Subscribe to all source stores
  const unsubscribes = stores.map((s) => s.subscribe(() => recompute()));

  const computedStore: ComputedStore<T> & { _unsubscribes: Unsubscribe[] } = {
    get() {
      return value;
    },

    subscribe(listener: Listener<T>): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    _unsubscribes: unsubscribes,
  };

  return computedStore;
}
