import { createElement } from "../../packages/CSR/vdom";

function Counter({ count, onClick }) {
  const buttonStyle = {
    backgroundColor: count % 2 === 0 ? "green" : "red", // Dynamically change color based on count
    color: "white",
    padding: "10px",
    border: "none",
    cursor: "pointer",
  };

  return (
    <div>
      <h1 style={{ color: "red" }}>Count: {count}</h1>
      <button onClick={onClick} style={buttonStyle}>
        Increment
      </button>
    </div>
  );
}

export default Counter; // Export the component
