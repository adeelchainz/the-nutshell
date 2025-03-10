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
export default createFiberTree;
