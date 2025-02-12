// Constants for priorities
const PRIORITY_HIGH = 'high';
const PRIORITY_MEDIUM = 'medium';
const PRIORITY_LOW = 'low';

// Fiber creation function
const createFiber = (
  type,
  key,
  props,
  priority = PRIORITY_MEDIUM,
  alternate = null,
  effectTag = null
) => ({
  type,
  key,
  props,
  priority,
  alternate,
  effectTag, // Will store effect (PLACEMENT, UPDATE, DELETION)
  child: null,
  sibling: null,
  return: null, // Parent reference
});

// Function to create an effect tag
const createEffectTag = (oldFiber, newFiber) => {
  if (!oldFiber && newFiber) return 'PLACEMENT'; // New node is being inserted
  if (oldFiber && !newFiber) return 'DELETION'; // Node is being removed
  if (oldFiber && newFiber && oldFiber.key !== newFiber.key) return 'PLACEMENT'; // Key mismatch, new node
  if (oldFiber && newFiber && oldFiber.type !== newFiber.type)
    return 'PLACEMENT'; // Type mismatch, new node
  return 'UPDATE'; // Node is being updated (same type/key)
};

// Function to reconcile a fiber and its alternate (old fiber)
const reconcile = (oldFiber, newFiber) => {
  const effectTag = createEffectTag(oldFiber, newFiber);

  // Assign effectTag to new fiber
  const reconciledFiber = { ...newFiber, effectTag };

  // Reconcile children and siblings recursively
  const reconciledChild = reconcileChildren(oldFiber?.child, newFiber?.child);
  const reconciledSibling = reconcileChildren(
    oldFiber?.sibling,
    newFiber?.sibling
  );

  return {
    ...reconciledFiber,
    child: reconciledChild,
    sibling: reconciledSibling,
  };
};

// Function to reconcile children (pure function)
const reconcileChildren = (oldChild, newChild) => {
  if (!oldChild && !newChild) return null;

  if (!oldChild || !newChild) {
    return newChild;
  }

  // Handle the two-pointer diffing for children
  let oldFiber = oldChild;
  let newFiber = newChild;
  let lastPlacedIndex = 0; // Track the last placed index

  let firstNewFiber = null;
  let previousFiber = null;

  // Two-pointer diffing
  while (oldFiber && newFiber) {
    if (oldFiber.key === newFiber.key) {
      const reconciledFiber = reconcile(oldFiber, newFiber);
      if (!firstNewFiber) firstNewFiber = reconciledFiber;
      if (previousFiber) previousFiber.sibling = reconciledFiber;
      previousFiber = reconciledFiber;
      lastPlacedIndex = reconciledFiber.index;
      oldFiber = oldFiber.sibling;
      newFiber = newFiber.sibling;
    } else {
      // If keys do not match, replace the old node
      const reconciledFiber = reconcile(null, newFiber);
      if (!firstNewFiber) firstNewFiber = reconciledFiber;
      if (previousFiber) previousFiber.sibling = reconciledFiber;
      previousFiber = reconciledFiber;
      lastPlacedIndex = reconciledFiber.index;
      newFiber = newFiber.sibling;
    }
  }

  // Handle the case where new fibers still remain but old fibers are exhausted
  while (newFiber) {
    const reconciledFiber = reconcile(null, newFiber);
    if (!firstNewFiber) firstNewFiber = reconciledFiber;
    if (previousFiber) previousFiber.sibling = reconciledFiber;
    previousFiber = reconciledFiber;
    lastPlacedIndex = reconciledFiber.index;
    newFiber = newFiber.sibling;
  }

  // Handle the case where old fibers still remain but new fibers are exhausted
  while (oldFiber) {
    const reconciledFiber = reconcile(oldFiber, null);
    if (!firstNewFiber) firstNewFiber = reconciledFiber;
    if (previousFiber) previousFiber.sibling = reconciledFiber;
    previousFiber = reconciledFiber;
    lastPlacedIndex = reconciledFiber.index;
    oldFiber = oldFiber.sibling;
  }

  return firstNewFiber;
};

// Function to handle component vs. DOM reconciliation
const reconcileNode = (oldFiber, newFiber) => {
  if (typeof newFiber.type === 'string') {
    // Handle DOM nodes (like div, span, etc.)
    return reconcileDOM(oldFiber, newFiber);
  } else {
    // Handle React components (class or function)
    return reconcileComponent(oldFiber, newFiber);
  }
};

const reconcileDOM = (oldFiber, newFiber) => {
  // Simply compare the DOM attributes and update accordingly
  const reconciledFiber = {
    ...newFiber,
    effectTag: createEffectTag(oldFiber, newFiber),
  };
  return reconciledFiber;
};

const reconcileComponent = (oldFiber, newFiber) => {
  // Components are more complex, as they may have state or context
  const reconciledFiber = {
    ...newFiber,
    effectTag: createEffectTag(oldFiber, newFiber),
  };
  return reconciledFiber;
};

// Constants for concurrent mode
const workQueue = []; // Holds fibers to be processed
let isRendering = false; // Flag to indicate whether work is in progress

// Add fiber to the work queue and sort by priority
const addToWorkQueue = (fiber) => {
  workQueue.push(fiber);
  workQueue.sort(
    (a, b) => priorityLevel(b.priority) - priorityLevel(a.priority)
  ); // Sort by priority

  // If we're not already rendering, start processing immediately
  if (!isRendering) {
    performWork();
  }
};

const performWork = () => {
  isRendering = true;
  workLoop();
  isRendering = false;
};

// Function to handle the work loop, yielding back control if needed
const workLoop = () => {
  while (workQueue.length > 0) {
    const fiber = workQueue.shift(); // Get the highest-priority fiber

    if (fiber.effectTag === 'PLACEMENT' || fiber.effectTag === 'UPDATE') {
      console.log(
        `Rendering fiber with key ${fiber.key} and priority ${fiber.priority}`
      );
    }

    // Simulate yielding to the browser after a chunk of work
    if (workQueue.length > 0) {
      console.log('Pausing for idle work');
      break; // Yield back to the browser
    }
  }
};

// Simulating idle work for low-priority fibers
const scheduleLowPriorityWork = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(workLoop);
  } else {
    setTimeout(workLoop, 1); // Fallback for browsers that don't support requestIdleCallback
  }
};

// Utility function to convert priority level to a numeric value for sorting
const priorityLevel = (priority) => {
  switch (priority) {
    case PRIORITY_HIGH:
      return 3;
    case PRIORITY_MEDIUM:
      return 2;
    case PRIORITY_LOW:
      return 1;
    default:
      return 0;
  }
};

// Fiber examples with different priorities
const fiberHigh = createFiber(
  'div',
  'high-priority',
  { className: 'high' },
  PRIORITY_HIGH
);
const fiberMedium = createFiber(
  'div',
  'medium-priority',
  { className: 'medium' },
  PRIORITY_MEDIUM
);
const fiberLow = createFiber(
  'div',
  'low-priority',
  { className: 'low' },
  PRIORITY_LOW
);

// Adding fibers to the queue
addToWorkQueue(fiberLow);
addToWorkQueue(fiberMedium);
addToWorkQueue(fiberHigh);
