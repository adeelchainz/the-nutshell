// Helper function to convert style object to string (for inline styles)
function convertStyleObjectToString(style) {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

// Function to create text elements
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: text },
    children: [],
  };
}

// Main function to create elements
export function createElement(type, props, ...children) {
  // If the type is a function (React component), call it to get the virtual DOM
  if (typeof type === "function") {
    console.log(type, props, children);

    return type(props); // Handle functional components
  }

  // If props contains a style object, convert it to a string
  const style = props?.style ? convertStyleObjectToString(props.style) : "";

  // Handle the creation of the virtual DOM element
  return {
    type, // The type of the element (e.g., 'div', 'span')
    props: { ...props, style: style }, // Add props and style
    children: children
      .flat() // Flatten children (support nested arrays)
      .map(
        (child) =>
          child == null || child === false
            ? createTextElement("") // Convert falsy children to empty text elements
            : typeof child === "object"
            ? child // If the child is already a virtual DOM node (element), keep it as it is
            : createTextElement(child) // Convert text/primitive values to text nodes
      ),
  };
}
function createFiber(type, props, parent = null, alternate = null) {
  const fiber = {
    type: type, // The type of the node (e.g., 'div', 'h1', or a component function)
    props: props || {}, // Props for the node
    stateNode: null, // Will hold the actual DOM node or component instance later
    parent: parent, // Parent fiber node
    child: null, // Children fibers
    sibling: null,
    alternate: alternate, // The previous fiber node for reconciliation
    effectTag: null, // Effect tag (e.g., PLACEMENT, UPDATE, DELETION)
    key: props ? props.key : null, // Key for reconciliation
  };

  return fiber;
}

function dfs(vdom) {
  if (!vdom) return null;

  // Process the current node
  console.log(`Visiting node:`, vdom);
  let fiber = createFiber(vdom.type, vdom.props);

  // If the node has children, recursively visit them
  if (vdom.children && vdom.children.length > 0) {
    let prevChild = null;
    vdom.children.forEach((child, index) => {
      const childfiber = dfs(child);
      if (index == 0) {
        console.log("Setting up as first child");
        fiber.child = childfiber;
      } else {
        console.log("have Sibling");
        prevChild.sibling = childfiber;
      }
      console.log("setting sibling");
      prevChild = childfiber;
    });
  }
  return fiber;
}

// A functional component
function MyComponent(props) {
  return (
    <div className="my-component">
      <span>Hello</span> {props.name}
    </div>
  );
}

// Using the JSX
const vdom = (
  <div className="container">
    <h1>Welcome</h1>
    <MyComponent name="World" />
  </div>
);

console.log(vdom);
const fiberTree = dfs(vdom);
console.log(fiberTree);
