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

export { reconcile, reconcileChildren, findLCS };
