import { updateDOM } from "./diff";
let updateQueue = [];
let isUpdating = false;

export function scheduleUpdate(parent, oldVNode, newVNode, index = 0) {
  updateQueue.push(() => updateDOM(parent, oldVNode, newVNode, index));

  if (!isUpdating) {
    isUpdating = true;
    requestAnimationFrame(() => {
      flushUpdates();
    });
  }
}

function flushUpdates() {
  while (updateQueue.length > 0) {
    const updateFn = updateQueue.shift();
    updateFn(); // Apply updates in batch
  }
  isUpdating = false;
}
