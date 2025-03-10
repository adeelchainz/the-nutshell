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
