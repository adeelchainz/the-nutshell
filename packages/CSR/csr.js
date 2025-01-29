// 1. Advanced Virtual DOM Representation with Events
export function createElement(type, props, ...children) {
  if (typeof type !== "string") {
    console.error("Invalid element type: must be a string.");
    throw new Error("Invalid element type: must be a string.");
  }
  console.log("Creating element:", { type, props, children });

  // Create a virtual DOM element representation
  return {
    type, // The type of the DOM element (e.g., 'div', 'p')
    props: props || {}, // Props or attributes for the element
    children: children.flat().map(
      (child) =>
        child == null || child === false
          ? createTextElement("") // Handle falsy children as empty text elements
          : typeof child === "object"
          ? child
          : createTextElement(child) // Recursively handle children
    ),
  };
}

function createTextElement(text) {
  if (typeof text !== "string" && typeof text !== "number") {
    console.error("Invalid text element: must be a string or number.", text);
    throw new Error("Invalid text element: must be a string or number.");
  }
  console.log("Creating text element:", text);

  // Create a virtual DOM representation for text nodes
  return {
    type: "TEXT_ELEMENT", // Special type for text nodes
    props: { nodeValue: text }, // Store the text as a property
    children: [], // No children for text nodes
  };
}

// 2. Render Virtual DOM to Real DOM with Event Handling
export function render(vNode) {
  if (!vNode || typeof vNode !== "object" || !vNode.type) {
    console.error("Invalid virtual DOM node:", vNode);
    throw new Error("Invalid virtual DOM node.");
  }
  console.log("Rendering virtual DOM node:", vNode);

  // Create a real DOM node based on the virtual DOM node
  const dom =
    vNode.type === "TEXT_ELEMENT"
      ? document.createTextNode(vNode.props.nodeValue) // Text node
      : document.createElement(vNode.type); // Element node

  // Set attributes and event listeners
  Object.keys(vNode.props).forEach((name) => {
    if (name.startsWith("on")) {
      // Add event listener if prop starts with 'on'
      const eventType = name.toLowerCase().substring(2);
      if (typeof vNode.props[name] !== "function") {
        console.error(
          `Invalid event handler for ${eventType}. Must be a function.`
        );
        throw new Error(
          `Invalid event handler for ${eventType}. Must be a function.`
        );
      }
      console.log(`Adding event listener for ${eventType}`);
      dom.addEventListener(eventType, vNode.props[name]);
    } else if (name !== "nodeValue") {
      // Set other properties
      console.log(`Setting property ${name} to`, vNode.props[name]);
      dom[name] = vNode.props[name];
    }
  });

  // Recursively render and append children
  vNode.children.forEach((child) => {
    if (child) {
      dom.appendChild(render(child));
    }
  });

  return dom; // Return the constructed real DOM node
}

// 3. Advanced Diffing Algorithm for Updates
export function updateDOM(parent, oldVNode, newVNode, index = 0) {
  if (!parent || !(parent instanceof Node)) {
    console.error("Invalid parent node:", parent);
    throw new Error("Invalid parent node.");
  }

  console.log("Updating DOM:", { parent, oldVNode, newVNode, index });

  if (!oldVNode && newVNode) {
    // Add new node if oldVNode does not exist
    console.log("Adding new node:", newVNode);
    parent.appendChild(render(newVNode));
  } else if (oldVNode && !newVNode) {
    // Remove old node if newVNode does not exist
    console.log("Removing old node:", oldVNode);
    if (parent.childNodes[index]) {
      parent.removeChild(parent.childNodes[index]);
    } else {
      console.error("Child node to remove does not exist.");
      throw new Error("Child node to remove does not exist.");
    }
  } else if (oldVNode.type !== newVNode.type) {
    // Replace node if types are different
    console.log("Replacing node:", { oldVNode, newVNode });
    parent.replaceChild(render(newVNode), parent.childNodes[index]);
  } else if (
    oldVNode.type === "TEXT_ELEMENT" &&
    oldVNode.props.nodeValue !== newVNode.props.nodeValue
  ) {
    // Update text content if it has changed
    console.log("Updating text content:", {
      oldText: oldVNode.props.nodeValue,
      newText: newVNode.props.nodeValue,
    });
    parent.childNodes[index].nodeValue = newVNode.props.nodeValue;
  } else {
    // Update attributes and event listeners for element nodes
    console.log("Updating props for element node:", {
      oldProps: oldVNode.props,
      newProps: newVNode.props,
    });
    updateProps(parent.childNodes[index], oldVNode.props, newVNode.props);

    // Recursively diff children
    const max = Math.max(oldVNode.children.length, newVNode.children.length);
    for (let i = 0; i < max; i++) {
      scheduleUpdate(
        parent.childNodes[index],
        oldVNode.children[i],
        newVNode.children[i],
        i
      );
    }
  }
}

function updateProps(dom, oldProps, newProps) {
  if (!dom || !(dom instanceof Node)) {
    console.error("Invalid DOM node for updating props:", dom);
    throw new Error("Invalid DOM node for updating props.");
  }

  console.log("Updating props:", { dom, oldProps, newProps });

  // Remove old attributes and event listeners
  for (const name in oldProps) {
    if (name.startsWith("on")) {
      // Remove event listener if it existed in oldProps
      const eventType = name.toLowerCase().substring(2);
      console.log(`Removing event listener for ${eventType}`);
      dom.removeEventListener(eventType, oldProps[name]);
    } else if (!(name in newProps)) {
      // Remove attribute if it is not in newProps
      console.log(`Removing property ${name}`);
      dom[name] = "";
    }
  }

  // Set new attributes and event listeners
  for (const name in newProps) {
    if (name.startsWith("on")) {
      // Add event listener if it exists in newProps
      const eventType = name.toLowerCase().substring(2);
      if (typeof newProps[name] !== "function") {
        console.error(
          `Invalid event handler for ${eventType}. Must be a function.`
        );
        throw new Error(
          `Invalid event handler for ${eventType}. Must be a function.`
        );
      }
      console.log(`Adding event listener for ${eventType}`);
      dom.addEventListener(eventType, newProps[name]);
    } else if (oldProps[name] !== newProps[name]) {
      // Update changed attributes
      console.log(`Updating property ${name} to`, newProps[name]);
      dom[name] = newProps[name];
    }
  }
}

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

export default {
  createElement,
  render,
  updateDOM,
};
