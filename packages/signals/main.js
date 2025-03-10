// Core Signals Library (Functional Programming Approach)

// 1. Reactive Signals System
// 2. DAG-Based Dependency Tracking
// 3. Batching & Async Scheduling
// 4. Incremental DOM Updates
// 5. Optimized Dependency Tracking & Scheduler

// Step 1: Define a Signal
const createSignal = (initialValue) => {
  let value = initialValue;
  const subscribers = new Set();

  const get = () => {
    if (activeEffect) {
      subscribers.add(activeEffect);
    }
    return value;
  };

  const set = (newValue) => {
    if (newValue !== value) {
      value = newValue;
      if (isBatching) {
        batchQueue.add(() => subscribers.forEach((effect) => effect()));
      } else {
        subscribers.forEach((effect) => effect());
      }
    }
  };

  return [get, set];
};

// Step 2: Create an Effect System (DAG-Based Dependency Tracking with Cleanup)
let activeEffect = null;
const createEffect = (fn) => {
  const effect = () => {
    cleanup(effect);
    activeEffect = effect;
    fn();
    activeEffect = null;
  };
  effect();
};

const cleanup = (effect) => {
  for (const signal of signalRegistry) {
    signal.subscribers.delete(effect);
  }
};

const signalRegistry = new Set();

// Step 3: Create a Computed Signal with Memoization
const createComputed = (computeFn) => {
  let lastValue;
  const [get, set] = createSignal(computeFn());
  createEffect(() => {
    const newValue = computeFn();
    if (newValue !== lastValue) {
      lastValue = newValue;
      set(newValue);
    }
  });
  return get;
};

// Step 4: Optimized Batching System with Scheduling
let isBatching = false;
const batchQueue = new Set();

const batch = (fn) => {
  isBatching = true;
  fn();
  isBatching = false;
  batchQueue.forEach((effect) => effect());
  batchQueue.clear();
};

const schedule = (fn) => {
  requestAnimationFrame(fn);
};

// Step 5: Region-Based Incremental DOM Updates with Scheduler
const mount = (root, render) => {
  createEffect(() => {
    // Synchronously compute the rendered content to track dependencies.
    const content = render();
    // Schedule the DOM update.
    schedule(() => {
      root.innerHTML = content;
    });
  });
};

// Step 6: DOM Example - Counter App
const app = document.getElementById("root");

app.addEventListener("click", (e) => {
  if (e.target.id === "increment") {
    setCount(getCount() + 1);
  }
});

const [getCount, setCount] = createSignal(0);

const render = () => `
    <div>
      <h1>Count: ${getCount()}</h1>
      <button id="increment">Increment</button>
    </div>
  `;

mount(app, render);

// Add event listener
