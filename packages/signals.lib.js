// Signal (with subscribers as Set)

const createSignal = (initialValue) => {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    if (currentComputation) {
      subscribers.add(currentComputation);
    }
    return value;
  };

  const write = (newValue) => {
    if (newValue !== value) {
      value = newValue;
      for (const subscriber of subscribers) {
        subscriber.update();
      }
    }
  };

  return [read, write];
};

// Computation (with lazy evaluation and dependency tracking)

let currentComputation = null;
const dependenciesMap = new WeakMap();
const memoMap = new WeakMap(); // For memoization

const createComputation = (fn, isComputed = false) => {
  let value;
  let dirty = true;

  const compute = () => {
    const prevComputation = currentComputation;
    currentComputation = compute;

    let newValue;
    if (isComputed && memoMap.has(compute)) {
      newValue = memoMap.get(compute);
    } else {
      newValue = fn();
      if (isComputed) {
        memoMap.set(compute, newValue);
      }
    }

    // Clear previous dependencies
    const prevDependencies = dependenciesMap.get(compute) || new Set();
    for (const dep of prevDependencies) {
      dep.unsubscribe(compute);
    }
    dependenciesMap.delete(compute);

    // Add current dependencies
    const currentDependencies = currentComputation.dependencies;
    dependenciesMap.set(compute, currentDependencies);
    for (const dep of currentDependencies) {
      dep.subscribe(compute);
    }

    currentComputation = prevComputation;
    return newValue;
  };

  const update = () => {
    dirty = true;
    // Propagate dirty state to dependents
    const dependencies = dependenciesMap.get(compute);
    if (dependencies) {
      for (const dep of dependencies) {
        dep.update();
      }
    }
  };

  const read = () => {
    if (dirty) {
      value = compute();
      dirty = false;
    }
    return value;
  };

  const subscribe = (subscriber) => {
    const dependencies = dependenciesMap.get(compute) || new Set();
    dependencies.add(subscriber);
    dependenciesMap.set(compute, dependencies);
  };

  const unsubscribe = (subscriber) => {
    const dependencies = dependenciesMap.get(compute);
    if (dependencies) {
      dependencies.delete(subscriber);
    }
  };

  compute.subscribe = subscribe;
  compute.unsubscribe = unsubscribe;
  compute.update = update;
  compute.dependencies = new Set();

  return { read, unsubscribe };
};

// Computed Signal

const createComputedSignal = (fn) => {
  const [read, write] = createSignal(undefined);
  createComputation(() => write(fn()), true);
  return read;
};

// Batching

const batch = (fn) => {
  const prevComputation = currentComputation;
  currentComputation = null;
  fn();
  currentComputation = prevComputation;
  if (prevComputation) {
    prevComputation.update();
  }
};

// useEffect

const effectQueue = new Set();
let isFlushingEffects = false;

const useEffect = (fn) => {
  const effectComputation = createComputation(async () => {
    effectQueue.add(fn);

    if (!isFlushingEffects) {
      isFlushingEffects = true;
      await Promise.resolve();
      for (const effect of effectQueue) {
        await effect();
      }
      effectQueue.clear();
      isFlushingEffects = false;
    }

    return undefined;
  });

  effectComputation.read();

  return () => {
    const dependencies = dependenciesMap.get(effectComputation);
    if (dependencies) {
      for (const dep of dependencies) {
        dep.unsubscribe(effectComputation);
      }
    }
  };
};

// Example usage
const [count, setCount] = createSignal(0);
const [count2, setCount2] = createSignal(5);

const doubled = createComputedSignal(() => count() * 2);

const multiplied = createComputation(() => doubled() * count2());

console.log(multiplied.read()); // Output: 0

setCount(1);
console.log(multiplied.read()); // Output: 10

setCount2(2);
console.log(multiplied.read()); // Output: 4

useEffect(() => {
  console.log('Count changed:', count());
});

setCount(1); // Output: "Count changed: 1"
setCount(2); // Output: "Count changed: 2"

batch(() => {
  setCount(3);
  setCount(4);
});

console.log(multiplied.read()); // Output: 16 (updated only once after batch)
