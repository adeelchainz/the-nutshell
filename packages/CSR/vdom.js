// 1. Advanced Virtual DOM Representation with Events
export function createElement(type, props, ...children) {
  if (typeof type !== "string" && typeof type !== "function") {
    console.error("Invalid element type: must be a string or function.");
    throw new Error("Invalid element type: must be a string or function.");
  }

  // Handle functional components
  if (typeof type === "function") {
    return type(props); // Invoke the component and return its JSX output
  }

  const style = props?.style ? convertStyleObjectToString(props.style) : "";

  console.log("Creating element:", { type, props, children });

  // Create a virtual DOM element representation
  return {
    type, // The type of the DOM element (e.g., 'div', 'p')
    props: { ...props, style: style }, // Props or attributes for the element
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
// Convert style object to string
function convertStyleObjectToString(styleObj) {
  if (typeof styleObj !== "object") {
    console.error("Style should be an object.");
    return "";
  }

  return Object.entries(styleObj)
    .map(([key, value]) => `${camelToKebabCase(key)}: ${value}`)
    .join("; ");
}

// Helper function to convert camelCase to kebab-case for CSS
function camelToKebabCase(str) {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function createTextElement(text, props) {
  if (typeof text !== "string" && typeof text !== "number") {
    console.error("Invalid text element: must be a string or number.", text);
    throw new Error("Invalid text element: must be a string or number.");
  }
  console.log("Creating text element:", text);
  const style = props?.style ? convertStyleObjectToString(props.style) : "";

  // Create a virtual DOM representation for text nodes
  return {
    type: "TEXT_ELEMENT", // Special type for text nodes
    props: { nodeValue: text, ...props, style: style }, // Store the text as a property
    children: [], // No children for text nodes
  };
}
