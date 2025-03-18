// signals.js - Core signals implementation with loop prevention
export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();
  let running = false; // To prevent infinite loops

  const read = () => {
    // Track the current running effect if one exists
    if (currentEffect) {
      subscribers.add(currentEffect);
    }
    return value;
  };

  const write = (newValue) => {
    if (running) return; // Prevent recursive updates
    running = true;

    try {
      const nextValue =
        typeof newValue === "function" ? newValue(value) : newValue;

      // Only update and notify if the value has changed
      if (nextValue !== value) {
        value = nextValue;

        // Create a copy of subscribers to avoid issues if subscribers change during iteration
        const subs = [...subscribers];
        subs.forEach((subscriber) => subscriber());
      }
    } finally {
      running = false;
    }
  };

  return [read, write];
}

// For dependency tracking
let currentEffect = null;
let effectStack = [];

export function createEffect(fn) {
  const effect = () => {
    // Prevent recursive effect execution
    if (effectStack.includes(effect)) return;

    // Clean up tracking before running the effect
    effectStack.push(effect);
    const prevEffect = currentEffect;
    currentEffect = effect;

    try {
      fn();
    } finally {
      currentEffect = prevEffect;
      effectStack.pop();
    }
  };

  // Run the effect once to register dependencies
  effect();

  return effect;
}

export function createMemo(fn) {
  const [get, set] = createSignal(undefined);

  createEffect(() => {
    set(fn());
  });

  return get;
}

// Batch updates to prevent cascading re-renders
export function batch(fn) {
  const prevBatch = batchingEnabled;
  batchingEnabled = true;
  const pendingEffects = new Set();

  try {
    fn();
  } finally {
    batchingEnabled = prevBatch;
    if (!batchingEnabled) {
      pendingEffects.forEach((effect) => effect());
      pendingEffects.clear();
    }
  }
}

let batchingEnabled = false;
const pendingEffects = new Set();

// Component registry to track mounted components
const componentRegistry = new Map();

// JSX Runtime
let currentComponent = null;
let nextComponentId = 1;

export function createComponent(component, props, ...children) {
  const prevComponent = currentComponent;
  currentComponent = component;

  try {
    const result =
      typeof component === "function"
        ? component({ ...props, children })
        : component;

    return result;
  } finally {
    currentComponent = prevComponent;
  }
}

// Function to create a root for rendering
export function createRoot(container) {
  let rootComponent = null;
  const rootId = `root-${nextComponentId++}`;

  const render = (component) => {
    rootComponent = component;
    const content = typeof component === "function" ? component() : component;
    updateDOM(container, content, rootId);
  };

  return { render };
}

// Enhanced render function that properly handles updates
export function render(component, container) {
  const root = createRoot(container);
  root.render(component);
  return root;
}

// Function to update the DOM based on component output
function updateDOM(container, content, componentId) {
  // First render or full container update
  if (!componentRegistry.has(componentId)) {
    container.innerHTML = "";
    componentRegistry.set(componentId, { container, content });

    if (typeof content === "string" || typeof content === "number") {
      container.textContent = String(content);
    } else if (content instanceof Node) {
      container.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach((child) => {
        if (child instanceof Node) {
          container.appendChild(child);
        } else if (child != null) {
          container.appendChild(document.createTextNode(String(child)));
        }
      });
    } else if (content != null) {
      container.innerHTML = String(content);
    }
  } else {
    // Update existing content
    // For simplicity in this demo, we're doing a full replace
    // A real framework would use a virtual DOM diffing algorithm
    container.innerHTML = "";

    if (typeof content === "string" || typeof content === "number") {
      container.textContent = String(content);
    } else if (content instanceof Node) {
      container.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach((child) => {
        if (child instanceof Node) {
          container.appendChild(child);
        } else if (child != null) {
          container.appendChild(document.createTextNode(String(child)));
        }
      });
    } else if (content != null) {
      container.innerHTML = String(content);
    }

    componentRegistry.set(componentId, { container, content });
  }
}

// For handling JSX elements
export function createElement(tag, props = {}, ...children) {
  if (typeof tag === "function") {
    // Create a unique component ID for this component instance
    const componentId = `component-${nextComponentId++}`;

    // Create a wrapper that will re-render when signals change
    const componentFn = () => {
      const elem = document.createElement("div");

      // Effect to handle re-renders
      createEffect(() => {
        const result = createComponent(tag, props, ...children);
        updateDOM(elem, result, componentId);
      });

      return elem;
    };

    return componentFn();
  }

  const element = document.createElement(tag);

  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === "className") {
        element.setAttribute("class", value);
      } else if (key === "ref" && typeof value === "function") {
        value(element);
      } else if (key !== "children") {
        if (typeof value === "function") {
          // Handle reactive attributes
          createEffect(() => {
            element.setAttribute(key, value());
          });
        } else {
          element.setAttribute(key, value);
        }
      }
    });
  }

  const flattenChildren = (children) => {
    return children.flatMap((child) => {
      if (Array.isArray(child)) return flattenChildren(child);
      if (child == null) return [];
      return [child];
    });
  };

  flattenChildren(children).forEach((child) => {
    if (typeof child === "function") {
      // Handle signal value
      const placeholder = document.createComment("signal");
      element.appendChild(placeholder);

      createEffect(() => {
        const value = child();

        // If this is an array (likely from a map), render each item
        if (Array.isArray(value)) {
          // For simplicity, clear and re-render
          // A production framework would use keyed reconciliation
          let previousSiblings = Array.from(element.childNodes).filter(
            (node) => node !== placeholder
          );

          previousSiblings.forEach((node) => element.removeChild(node));

          value.forEach((item) => {
            if (item instanceof Node) {
              element.insertBefore(item, placeholder);
            } else {
              const textNode = document.createTextNode(String(item));
              element.insertBefore(textNode, placeholder);
            }
          });
        } else {
          // Replace all siblings of placeholder with a single text node
          let previousSiblings = Array.from(element.childNodes).filter(
            (node) => node !== placeholder
          );

          previousSiblings.forEach((node) => element.removeChild(node));

          const textNode = document.createTextNode(String(value));
          element.insertBefore(textNode, placeholder);
        }
      });
    } else if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (child !== null && child !== undefined) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });

  return element;
}

// Export JSX factory for frameworks that need it
export const jsx = createElement;
