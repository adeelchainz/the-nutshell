const componentStack = []; // Tracks cleanup for each component
const destroyFns = new Set(); // Stores global destroy functions

export function createComponent(fn) {
  const cleanupFns = new Set();
  componentStack.push(cleanupFns);

  const result = fn(); // Execute component function

  componentStack.pop(); // Remove from stack after execution
  return result;
}

export function onMount(callback) {
  if (componentStack.length > 0) {
    queueMicrotask(callback);
  }
}

export function onCleanup(callback) {
  if (componentStack.length > 0) {
    const currentCleanup = componentStack[componentStack.length - 1];
    currentCleanup.add(callback);
  }
}

export function cleanupComponent() {
  if (componentStack.length > 0) {
    const cleanupFns = componentStack.pop();
    cleanupFns.forEach((fn) => fn());
  }
}

export function onDestroy(callback) {
  destroyFns.add(callback);
}

export function cleanupApp() {
  destroyFns.forEach((fn) => fn());
  destroyFns.clear();
}
