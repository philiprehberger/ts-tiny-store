/**
 * Callback invoked when a store's value changes.
 */
export type Listener<T> = (value: T, previous: T) => void;

/**
 * Unsubscribe function returned by `subscribe`.
 */
export type Unsubscribe = () => void;

/**
 * A reactive store that holds a single value of type `T`.
 */
export interface Store<T> {
  /** Return the current value. */
  get(): T;
  /** Replace the current value and notify subscribers. */
  set(value: T): void;
  /** Update the value using a callback that receives the current value. */
  update(fn: (current: T) => T): void;
  /** Register a listener that fires on every change. Returns an unsubscribe function. */
  subscribe(listener: Listener<T>): Unsubscribe;
}

/** @internal */
export interface StoreInternal<T> extends Store<T> {
  /** Directly notify all subscribers with the given previous value. */
  _notify(previous: T): void;
}

// --- Batching state ---

let batchDepth = 0;
const pendingFlushes: Array<() => void> = [];

/**
 * Create a reactive store with an initial value.
 *
 * @param initial - The starting value for the store.
 * @returns A `Store<T>` instance.
 */
export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener<T>>();

  function notify(previous: T): void {
    for (const listener of listeners) {
      listener(value, previous);
    }
  }

  const store: StoreInternal<T> = {
    get() {
      return value;
    },

    set(next: T) {
      if (Object.is(value, next)) return;
      const previous = value;
      value = next;

      if (batchDepth > 0) {
        pendingFlushes.push(() => notify(previous));
      } else {
        notify(previous);
      }
    },

    update(fn: (current: T) => T) {
      store.set(fn(value));
    },

    subscribe(listener: Listener<T>): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    _notify(previous: T) {
      notify(previous);
    },
  };

  return store;
}

/**
 * Batch multiple store updates so that subscribers are only notified once,
 * after the batch function completes.
 *
 * @param fn - A synchronous function that performs one or more `set` / `update` calls.
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const flushes = pendingFlushes.splice(0);
      for (const flush of flushes) {
        flush();
      }
    }
  }
}
