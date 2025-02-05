/**
 * Fiber Node structure representing each unit in the Fiber tree.
 */
function createFiberNode(type, props, parent, key) {
  return {
    type, // The type of element (e.g., 'div', 'button', or a Component function)
    props, // The properties passed to this element
    parent, // Reference to the parent Fiber node
    child: null, // First child Fiber node
    sibling: null, // Sibling Fiber node
    stateNode: null, // DOM node or Component instance
    alternate: null, // Link to previous fiber for reconciliation
    effectTag: "PLACEMENT", // Default to "PLACEMENT"
    key, // Key for keyed reconciliation
  };
}

/**
 * Create a Fiber Tree recursively from a virtual DOM structure with keyed reconciliation.
 */
function createFiberTree(vdom, parent, oldFiberMap = {}) {
  if (!vdom) return null;

  // Look up the old fiber by key if it exists
  const oldFiber = oldFiberMap[vdom.key];

  const fiber = createFiberNode(vdom.type, vdom.props, parent, vdom.key);
  fiber.alternate = oldFiber; // Link to the old fiber for reconciliation

  // If it’s a DOM node (string), create the stateNode as a DOM element
  if (typeof fiber.type === "string") {
    if (oldFiber) {
      fiber.stateNode = oldFiber.stateNode; // Reuse the old stateNode
      applyProps(fiber.stateNode, fiber.props);
    } else {
      fiber.stateNode = document.createElement(fiber.type);
      applyProps(fiber.stateNode, fiber.props);
    }
  }

  let prevSibling = null;

  vdom.children?.forEach((child, index) => {
    const childFiber = createFiberTree(child, fiber, oldFiberMap);

    if (childFiber) {
      if (index === 0) {
        fiber.child = childFiber;
      } else {
        prevSibling.sibling = childFiber;
      }

      prevSibling = childFiber;
    }
  });

  return fiber;
}

/**
 * Apply properties (attributes and event listeners) to a DOM node.
 */
function applyProps(node, props) {
  for (const key in props) {
    if (key.startsWith("on")) {
      node.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else {
      node[key] = props[key];
    }
  }
}

let wipRoot = null; // Work in progress root
let currentRoot = null; // Previously committed root
let nextUnitOfWork = null;
let deletions = [];

/**
 * Starts the rendering and reconciliation process.
 */
function render(vdom) {
  console.log("Starting render", vdom);
  const container = document.getElementById("root");
  if (!container) {
    console.error("No root container found!");
    return;
  }

  // ✅ Create a Fiber wrapper for the root
  const rootFiber = createFiberNode("ROOT", {}, null, null);
  rootFiber.stateNode = container;

  // Pass the oldFiberMap to reuse fibers
  const oldFiberMap = currentRoot ? buildFiberMap(currentRoot) : {};

  wipRoot = createFiberTree(vdom, rootFiber, oldFiberMap); // ✅ Attach the Fiber tree to the root
  wipRoot.parent = rootFiber; // ✅ Ensure the root fiber has a Fiber parent
  wipRoot.alternate = currentRoot;
  nextUnitOfWork = wipRoot;
  deletions = [];
  requestIdleCallback(workLoop);
}

/**
 * Builds a map of fibers indexed by their keys for efficient lookup during reconciliation.
 */
function buildFiberMap(fiber) {
  const map = {};
  function traverse(fiber) {
    if (!fiber) return;
    if (fiber.key) map[fiber.key] = fiber;
    traverse(fiber.child);
    traverse(fiber.sibling);
  }
  traverse(fiber);
  return map;
}

/**
 * Work loop that processes each fiber unit until idle time is consumed.
 */
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    console.log("🚀 Committing root Fiber!");
    commitRoot();
  }

  if (nextUnitOfWork || wipRoot) {
    requestIdleCallback(workLoop);
  }
}

/**
 * Processes a single fiber node and returns the next unit of work.
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if (!isFunctionComponent) {
    reconcile(fiber);
  }

  return fiber.child || fiber.sibling || findNextSibling(fiber);
}

/**
 * Finds the next sibling fiber node in the tree.
 */
function findNextSibling(fiber) {
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}

/**
 * Reconciles the new fiber tree with the previous one.
 */
function reconcile(fiber) {
  const oldFiber = fiber.alternate;

  if (!oldFiber) {
    // First render, create new element
    fiber.effectTag = "PLACEMENT";
  } else if (oldFiber.key !== fiber.key) {
    // Keys are different, we need to replace the element
    fiber.effectTag = "PLACEMENT";
  } else if (oldFiber.props !== fiber.props) {
    // Props have changed, mark for update
    fiber.effectTag = "UPDATE";
  } else {
    // No change, no effect tag needed
    fiber.effectTag = null;
  }

  // Reconcile children
  reconcileChildren(fiber, oldFiber);
}

function reconcileChildren(fiber, oldFiber) {
  let prevChild = null;
  let oldChild = oldFiber ? oldFiber.child : null;
  let newChild = fiber.child;

  // Memoization cache for reconciled child fibers
  const memoCache = new Map();

  // Convert the old and new child fibers to arrays for easier manipulation
  const oldChildren = [];
  const newChildren = [];

  // Convert old and new fiber children linked lists to arrays
  while (oldChild) {
    oldChildren.push(oldChild);
    oldChild = oldChild.sibling;
  }

  while (newChild) {
    newChildren.push(newChild);
    newChild = newChild.sibling;
  }

  // Apply the LCS algorithm to get the longest common subsequence
  const lcs = findLCS(oldChildren, newChildren);

  // Create a map of old fiber children for quick lookups by key
  const oldChildMap = new Map();
  oldChildren.forEach((child) => oldChildMap.set(child.key, child));

  let prevLCSNode = null;
  let newIndex = 0;

  // Reconcile new children with old children based on the LCS
  lcs.forEach((newChild, index) => {
    const oldChild = oldChildren[index];

    // Check the memoization cache before proceeding with reconciliation
    if (memoCache.has(newChild.key)) {
      const cachedChild = memoCache.get(newChild.key);
      newChild.alternate = cachedChild.alternate; // Reuse the cached fiber
      newChild.effectTag = cachedChild.effectTag; // Reuse the cached effect tag
    } else {
      // Perform reconciliation if the child is not in the cache
      if (oldChild && oldChild.key === newChild.key) {
        newChild.alternate = oldChild;
        oldChild.effectTag = null; // Don't need to delete it
        newChild.effectTag = "UPDATE"; // Reuse and update the fiber
      } else {
        newChild.effectTag = "PLACEMENT"; // No match, create new fiber
      }

      // Memoize the new child after reconciliation
      memoCache.set(newChild.key, {
        alternate: newChild.alternate,
        effectTag: newChild.effectTag,
      });
    }

    if (prevLCSNode) {
      prevLCSNode.sibling = newChild;
    } else {
      fiber.child = newChild;
    }

    prevLCSNode = newChild;
    newIndex++;
  });

  // Handle remaining old children (those not in the LCS)
  oldChildren.forEach((oldChild) => {
    if (!lcs.includes(oldChild)) {
      oldChild.effectTag = "DELETION"; // Mark for deletion
    }
  });
}

/**
 * Find the longest common subsequence (LCS) of two arrays
 */
function findLCS(oldChildren, newChildren) {
  const m = oldChildren.length;
  const n = newChildren.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Fill the DP table for LCS
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChildren[i - 1].key === newChildren[j - 1].key) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruct the LCS from the DP table
  let i = m;
  let j = n;
  const lcs = [];

  while (i > 0 && j > 0) {
    if (oldChildren[i - 1].key === newChildren[j - 1].key) {
      lcs.unshift(newChildren[j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Commits all changes in the fiber tree to the actual DOM.
 */
function commitRoot() {
  deletions.forEach(commitDeletion);
  const container = document.getElementById("root");
  container.innerHTML = ""; // <-- This clears previous content

  commitWork(wipRoot);
  // if (wipRoot.stateNode && wipRoot.child) {
  //   console.log("🌱 Appending first render to root:", wipRoot.child.stateNode);
  //   wipRoot.stateNode.appendChild(wipRoot.child.stateNode);
  // }

  currentRoot = wipRoot; // ✅ Swap the current tree with the new one
  wipRoot = null;
}

/**
 * Commits work (changes) to the actual DOM.
 */
function commitWork(fiber) {
  if (!fiber) return;

  // Skip the ROOT fiber to avoid appending container to itself
  if (fiber.type === "ROOT") {
    commitWork(fiber.child);
    return;
  }

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.stateNode) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent =
    domParentFiber?.stateNode instanceof HTMLElement
      ? domParentFiber.stateNode
      : null;
  if (!domParent) {
    console.error("⚠️ No valid parent found for fiber:", fiber);
    return;
  }

  console.log("🛠️ Committing fiber:", fiber, "to parent:", domParent);

  if (fiber.effectTag === "PLACEMENT" && fiber.stateNode) {
    console.log("📌 Appending:", fiber.stateNode, "to", domParent);
    domParent.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === "UPDATE" && fiber.stateNode) {
    // If the node is not already in the DOM, append it.
    if (!fiber.stateNode.parentNode) {
      console.log("📌 (UPDATE) Node not attached, appending:", fiber.stateNode);
      domParent.appendChild(fiber.stateNode);
    }
    // Then update the node’s properties
    applyProps(fiber.stateNode, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Updates an existing DOM element based on new props.
 */
function updateDom(node, oldProps, newProps) {
  for (const key in oldProps) {
    if (!(key in newProps)) {
      node[key] = "";
    }
  }
  for (const key in newProps) {
    if (oldProps[key] !== newProps[key]) {
      node[key] = newProps[key];
    }
  }
}

/**
 * Commits deletions to remove nodes from the DOM.
 */
function commitDeletion(fiber) {
  if (fiber.stateNode) {
    let domParentFiber = fiber.parent;
    while (!domParentFiber.stateNode) {
      domParentFiber = domParentFiber.parent;
    }
    domParentFiber.stateNode.removeChild(fiber.stateNode);
  }
}

/**
 * Example: Counter component using Fiber.
 */
let count = 0;

function increase() {
  count++;
  renderNewVdom(); // ✅ Re-renders with updated count
}

function renderNewVdom() {
  const newVdom = {
    type: "div",
    props: {},
    children: [
      {
        type: "button",
        props: { innerText: "Increment", onclick: increase },
        children: [],
      },
      { type: "p", props: { innerText: `Count: ${count}` }, children: [] },
    ],
  };

  render(newVdom);
}

// Initial render
const initialVdom = {
  type: "div",
  props: {},
  children: [
    {
      type: "button",
      props: { innerText: "Increment", onclick: increase },
      children: [],
    },
    { type: "p", props: { innerText: "Count: 0" }, children: [] },
  ],
};
render(initialVdom);
