import { createElement } from "../packages/CSR/vdom";
import Counter from "./components/counter";

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
  return (
    <div>
      <h1>Welcome to the App!</h1>
      <Counter
        count={state.count}
        onClick={() => setState({ count: state.count + 1 })}
      />
    </div>
  );
}

// Initial render
let currentVNode = App();
root.appendChild(render(currentVNode));
