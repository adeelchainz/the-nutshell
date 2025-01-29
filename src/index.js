import { createElement } from "../packages/CSR/vdom";
import { scheduleUpdate } from "../packages/CSR/batch";
import { render } from "../packages/CSR/csr";

// Initial state
let state = { count: 0 };
let root = document.getElementById("root");

// Function to update state and trigger a re-render
function setState(newState) {
  state = { ...state, ...newState }; // Merge new state
  scheduleUpdate(root, currentVNode, App()); // Batch updates
  currentVNode = App(); // Save latest virtual node
}

// Counter component
function App() {
  return createElement(
    "div",
    {},
    createElement("h1", {}, `Count: ${state.count}`),
    createElement(
      "button",
      {
        onClick: () => {
          setState({ count: state.count + 1 });
          setState({ count: state.count + 2 }); // Should be batched
        },
      },
      "Increment"
    )
  );
}

// Initial render
let currentVNode = App();
root.appendChild(render(currentVNode));
