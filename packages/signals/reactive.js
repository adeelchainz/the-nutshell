// reactive.js

// Global variable for tracking the currently running effect.
let currentEffect = null;

// A set to hold pending effects to be flushed in a microtask.
const pendingEffects = new Set();
let isFlushing = false;

/**
 * Schedules an effect to run in a microtask (batched).
 */
function scheduleEffect(effect) {
  if (!pendingEffects.has(effect)) {
    pendingEffects.add(effect);
    if (!isFlushing) {
      isFlushing = true;
      Promise.resolve().then(() => {
        try {
          // Run all pending effects.
          pendingEffects.forEach((e) => e());
        } finally {
          pendingEffects.clear();
          isFlushing = false;
        }
      });
    }
  }
}

/**
 * Creates a reactive signal.
 *
 * Each signal is an object with a value and a set of subscribers.
 * The getter tracks dependencies and the setter schedules effects.
 */
export function createSignal(initialValue) {
  const signal = {
    value: initialValue,
    subscribers: new Set(),
  };

  function getter() {
    // If there's an active effect, subscribe it to this signal.
    if (currentEffect) {
      signal.subscribers.add(currentEffect);
      // Also record that this effect depends on the signal.
      currentEffect.deps.add(signal);
    }
    return signal.value;
  }

  function setter(newValue) {
    if (newValue === signal.value) return;
    signal.value = newValue;
    // Schedule all subscribers (effects) to re-run.
    signal.subscribers.forEach(scheduleEffect);
  }

  return [getter, setter];
}

/**
 * Cleans up an effect's previous dependencies.
 * This removes the effect from all signals it was subscribed to.
 */
function cleanup(effect) {
  effect.deps.forEach((sig) => {
    sig.subscribers.delete(effect);
  });
  effect.deps.clear();
}

/**
 * Creates an effect that runs the given function and automatically tracks dependencies.
 *
 * Before re-running, it cleans up previous subscriptions so that only
 * currently used signals will trigger the effect.
 */
export function createEffect(fn) {
  function wrappedEffect() {
    cleanup(wrappedEffect);
    currentEffect = wrappedEffect;
    fn();
    currentEffect = null;
  }
  wrappedEffect.deps = new Set();
  // Run the effect initially (this run will track dependencies)
  wrappedEffect();
}
