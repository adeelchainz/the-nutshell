// app.jsx
import {
  createSignal,
  createEffect,
  createMemo,
  render,
  jsx,
} from "./signals.js";

// Enable JSX to work with our framework
/** @jsx jsx */

function Counter() {
  const [count, setCount] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(1);
  const [logs, setLogs] = createSignal([]);

  // Derived state using memo
  const multipliedCount = createMemo(() => count() * multiplier());

  // Side effect that logs when count changes
  createEffect(() => {
    const currentCount = count();
    console.log(`Count changed to: ${currentCount}`);
    setLogs([...logs(), `Count changed to: ${currentCount}`]);
  });

  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <h3>Multiplied value: {multipliedCount}</h3>

      <div className="controls">
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
      </div>

      <div className="multiplier">
        <p>Multiplier: {multiplier}</p>
        <button onClick={() => setMultiplier((m) => m + 1)}>
          Increase Multiplier
        </button>
      </div>

      <div className="log-container">
        <h4>Count Change Log:</h4>
        <pre className="count-log">{() => logs().join("\n")}</pre>
      </div>
    </div>
  );
}

function TodoApp() {
  const [todos, setTodos] = createSignal([]);
  const [inputValue, setInputValue] = createSignal("");

  const completedCount = createMemo(() => {
    return todos().filter((todo) => todo.completed).length;
  });

  const remainingCount = createMemo(() => {
    return todos().length - completedCount();
  });

  const addTodo = () => {
    if (inputValue().trim()) {
      setTodos([
        ...todos(),
        {
          id: Date.now(),
          text: inputValue(),
          completed: false,
        },
      ]);
      setInputValue("");
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos().map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos().filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <div className="todo-app">
      <h2>Todo App</h2>

      <div className="add-todo">
        <input
          type="text"
          value={inputValue}
          onInput={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new task"
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list">
        {() =>
          todos().map((todo) => (
            <li className={todo.completed ? "completed" : ""}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
            </li>
          ))
        }
      </ul>

      <div className="todo-stats">
        <p>Completed: {completedCount}</p>
        <p>Remaining: {remainingCount}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <h1>Signals Framework Demo</h1>
      <Counter />
      <hr />
      <TodoApp />
    </div>
  );
}

// Mount the application
document.addEventListener("DOMContentLoaded", () => {
  render(<App />, document.getElementById("root"));
});
