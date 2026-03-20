import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, batch, computed } from '../../dist/index.js';

describe('createStore', () => {
  it('should return the initial value', () => {
    const store = createStore(42);
    assert.equal(store.get(), 42);
  });

  it('should update the value with set', () => {
    const store = createStore('hello');
    store.set('world');
    assert.equal(store.get(), 'world');
  });

  it('should update the value with update callback', () => {
    const store = createStore(10);
    store.update((n) => n + 5);
    assert.equal(store.get(), 15);
  });

  it('should notify subscribers on change', () => {
    const store = createStore(0);
    const calls: Array<{ value: number; previous: number }> = [];
    store.subscribe((value, previous) => {
      calls.push({ value, previous });
    });
    store.set(1);
    store.set(2);
    assert.deepEqual(calls, [
      { value: 1, previous: 0 },
      { value: 2, previous: 1 },
    ]);
  });

  it('should not notify when value is the same (Object.is)', () => {
    const store = createStore(1);
    const calls: number[] = [];
    store.subscribe((v) => calls.push(v));
    store.set(1);
    assert.equal(calls.length, 0);
  });

  it('should not notify after unsubscribe', () => {
    const store = createStore(0);
    const calls: number[] = [];
    const unsub = store.subscribe((v) => calls.push(v));
    store.set(1);
    unsub();
    store.set(2);
    assert.equal(calls.length, 1);
    assert.equal(calls[0], 1);
  });

  it('should handle NaN correctly with Object.is', () => {
    const store = createStore(NaN);
    const calls: number[] = [];
    store.subscribe((v) => calls.push(v));
    store.set(NaN);
    assert.equal(calls.length, 0);
  });

  it('should handle objects by reference', () => {
    const obj = { a: 1 };
    const store = createStore(obj);
    const calls: Array<{ a: number }>[] = [];
    store.subscribe((v, p) => calls.push([v, p]));
    // Same reference, no notification
    store.set(obj);
    assert.equal(calls.length, 0);
    // New reference, notification fires
    const obj2 = { a: 2 };
    store.set(obj2);
    assert.equal(calls.length, 1);
  });
});

describe('batch', () => {
  it('should defer notifications until batch completes', () => {
    const store = createStore(0);
    const calls: number[] = [];
    store.subscribe((v) => calls.push(v));

    batch(() => {
      store.set(1);
      store.set(2);
      store.set(3);
      assert.equal(calls.length, 0, 'no notifications during batch');
    });

    // After batch, all deferred notifications fire
    assert.equal(calls.length, 3);
  });

  it('should support nested batches', () => {
    const store = createStore(0);
    const calls: number[] = [];
    store.subscribe((v) => calls.push(v));

    batch(() => {
      store.set(1);
      batch(() => {
        store.set(2);
        assert.equal(calls.length, 0, 'still batched in nested');
      });
      assert.equal(calls.length, 0, 'still batched in outer');
      store.set(3);
    });

    assert.equal(calls.length, 3);
  });

  it('should flush even if fn throws', () => {
    const store = createStore(0);
    const calls: number[] = [];
    store.subscribe((v) => calls.push(v));

    assert.throws(() => {
      batch(() => {
        store.set(1);
        throw new Error('oops');
      });
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0], 1);
  });

  it('should batch across multiple stores', () => {
    const a = createStore(0);
    const b = createStore('x');
    const callsA: number[] = [];
    const callsB: string[] = [];
    a.subscribe((v) => callsA.push(v));
    b.subscribe((v) => callsB.push(v));

    batch(() => {
      a.set(1);
      b.set('y');
      assert.equal(callsA.length, 0);
      assert.equal(callsB.length, 0);
    });

    assert.equal(callsA.length, 1);
    assert.equal(callsB.length, 1);
  });
});

describe('computed', () => {
  it('should derive value from a single store', () => {
    const count = createStore(5);
    const doubled = computed([count], (n) => n * 2);
    assert.equal(doubled.get(), 10);
  });

  it('should derive value from multiple stores', () => {
    const first = createStore('Jane');
    const last = createStore('Doe');
    const full = computed([first, last], (f, l) => `${f} ${l}`);
    assert.equal(full.get(), 'Jane Doe');
  });

  it('should update when a source store changes', () => {
    const count = createStore(3);
    const doubled = computed([count], (n) => n * 2);
    count.set(7);
    assert.equal(doubled.get(), 14);
  });

  it('should notify subscribers when computed value changes', () => {
    const count = createStore(1);
    const doubled = computed([count], (n) => n * 2);
    const calls: Array<{ value: number; previous: number }> = [];
    doubled.subscribe((value, previous) => {
      calls.push({ value, previous });
    });
    count.set(5);
    assert.deepEqual(calls, [{ value: 10, previous: 2 }]);
  });

  it('should not notify when computed value stays the same', () => {
    const a = createStore(2);
    const b = createStore(3);
    const sum = computed([a, b], (x, y) => x + y);
    const calls: number[] = [];
    sum.subscribe((v) => calls.push(v));

    // Change a to 3 and b to 2 — sum stays at 5
    a.set(3);
    // After a.set(3), sum = 3+3 = 6, which is different
    // So let's test: set a to 1, b to 4 (sum stays 5 only on second call)
    // Actually let's just verify the no-change case directly
    const store = createStore(10);
    const clamped = computed([store], (v) => Math.min(v, 100));
    const clampCalls: number[] = [];
    clamped.subscribe((v) => clampCalls.push(v));
    store.set(50); // clamped stays 50... wait, initial was min(10,100)=10, then min(50,100)=50 -> changed
    store.set(200); // min(200,100) = 100 -> changed
    store.set(300); // min(300,100) = 100 -> same, no notify
    assert.equal(clampCalls.length, 2);
  });

  it('should allow unsubscribing from computed', () => {
    const count = createStore(0);
    const doubled = computed([count], (n) => n * 2);
    const calls: number[] = [];
    const unsub = doubled.subscribe((v) => calls.push(v));
    count.set(1);
    unsub();
    count.set(2);
    assert.equal(calls.length, 1);
  });
});
