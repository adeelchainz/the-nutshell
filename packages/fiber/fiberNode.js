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

export default createFiberNode;
