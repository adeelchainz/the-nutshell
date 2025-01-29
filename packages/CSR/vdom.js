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
