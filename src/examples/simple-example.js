// 4. Enhanced Example Usage with Dynamic Updates
try {
  const oldVNode = createElement(
    "div",
    { id: "container" },
    createElement("h1", null, "Hello, Advanced Virtual DOM!"), // Create an h1 element
    createElement("p", null, "This is a more sophisticated example."), // Create a paragraph
    createElement("button", { onclick: () => alert("Clicked!") }, "Click Me"), // Create a button with a click handler
    null, // Falsy child
    undefined // Falsy child
  );

  console.log("Initial virtual DOM:", oldVNode);

  // Render to DOM
  const root = document.getElementById("root"); // Get the root element
  if (!root) {
    console.error("Root element not found.");
    throw new Error("Root element not found.");
  }

  const dom = render(oldVNode); // Render the old virtual DOM
  console.log("Rendered DOM:", dom);
  root.appendChild(dom); // Append it to the root

  // New Virtual DOM for update
  const newVNode = createElement(
    "div",
    { id: "container" },
    createElement("h1", null, "Hello, Updated Advanced Virtual DOM!"), // Updated h1 content
    createElement("p", null, "This is an updated and enhanced example."), // Updated paragraph
    createElement(
      "button",
      { onclick: () => alert("Still Clickable!") },
      "Click Me Again"
    ), // Updated button label
    false // Falsy child
  );

  console.log("Updated virtual DOM:", newVNode);

  // Update DOM after 2 seconds
  setTimeout(() => {
    console.log("Starting DOM update...");
    updateDOM(root, oldVNode, newVNode); // Diff and update the DOM
    console.log("DOM update complete.");
  }, 2000);
} catch (error) {
  console.error("Error during execution:", error);
}
