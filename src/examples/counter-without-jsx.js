import { createElement, updateDOM, render } from "../packages/CSR/csr";

// Initial state
let state = { count: 0 };

// Function to handle button click
function increment() {
  state.count++;
  update();
}

// Function to generate the virtual DOM
function App() {
  return createElement(
    "div",
    { id: "app", style: "text-align: center;" },
    createElement("h1", null, "Counter: ", state.count),
    createElement("button", { onClick: increment }, "Increment")
  );
}

// Function to update the DOM
function update() {
  const newVNode = App();
  updateDOM(root, vNode, newVNode);
  vNode = newVNode;
}

// Mounting the app
const root = document.getElementById("root");
let vNode = App(); // Initial Virtual DOM
root.appendChild(render(vNode)); // Initial render
