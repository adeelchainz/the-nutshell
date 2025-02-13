/** @jsx createElement */

// ---------------------
// POLYFILL for requestIdleCallback (if needed)
// ---------------------
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function (cb) {
    return setTimeout(() => {
      cb({ timeRemaining: () => 50 });
    }, 1);
  };
}

// ---------------------
// GLOBAL HOOK VARIABLES
// ---------------------
let wipFiber = null; // The fiber currently rendering (for function components)
let hookIndex = 0; // The current hook index

// ---------------------
// HOOKS IMPLEMENTATION
// ---------------------
function useState(initial) {
  // Try to retrieve the old hook if available (for updates)
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // Create a new hook object
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  // Process any queued actions from previous renders.
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    console.log('[useState] setState called. Scheduling re-render...');
    render(App(), currentRoot.stateNode);
    requestIdleCallback(workLoop);
  };

  // Save the hook on the fiber and move to the next hook index.
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function useEffect(effect, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  let hasChanged = true;
  if (oldHook && deps) {
    hasChanged = !deps.every((dep, i) => dep === oldHook.deps[i]);
  }
  // (Optionally, you could skip storing the effect if !hasChanged)
  const hook = {
    effect,
    deps,
    hasChanged,
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
}

// ---------------------
// HELPER FUNCTIONS
// ---------------------
function convertStyleObjectToString(style) {
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case (e.g., backgroundColor → background-color)
      const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: { nodeValue: text },
    children: [],
  };
}

// ---------------------
// CREATE ELEMENT (JSX)
// ---------------------
export function createElement(type, props, ...children) {
  // Convert style object to string if needed.
  const style = props?.style ? convertStyleObjectToString(props.style) : '';

  return {
    type, // May be a string (for host components) or a function (for function components)
    props: {
      ...props,
      style,
      children: children.flat().map((child) => {
        if (child == null || child === false) {
          return createTextElement('');
        }
        // If child is an object or a function, leave it as is.
        if (typeof child === 'object' || typeof child === 'function') {
          return child;
        }
        // Otherwise, assume it's a primitive (e.g. a string or number)
        return createTextElement(child);
      }),
    },
  };
}

// ---------------------
// FIBER CREATION
// ---------------------
function createFiber(type, props, parent = null, alternate = null) {
  const fiber = {
    type,
    props: props || {},
    stateNode: null,
    parent,
    child: null,
    sibling: null,
    alternate,
    effectTag: null,
    key: props ? props.key : null,
  };
  console.log('[createFiber] Created fiber:', fiber);
  return fiber;
}

// ---------------------
// INITIAL FIBER TREE CREATION (Without Diffing)
// ---------------------
function dfs(vdom, parent = null) {
  if (!vdom) return null;
  console.log('[DFS] Visiting node:', vdom);

  // If vdom is a function component, create a fiber but do not process its children.
  if (typeof vdom.type === 'function') {
    let fiber = createFiber(vdom.type, vdom.props, parent);
    fiber.effectTag = 'PLACEMENT';
    // **Initialize the hooks array on the fiber**
    fiber.hooks = [];
    console.log(
      '[DFS] Function component fiber created:',
      vdom.type.name || vdom.type
    );
    // Set up the global fiber so hooks can access it
    wipFiber = fiber;
    hookIndex = 0;
    // Run the function component to get its children
    const children = vdom.type(vdom.props);
    // Build a fiber tree for its rendered output
    fiber.child = dfs(children, fiber);
    return fiber;
  }

  // Otherwise, it's a host element.
  let fiber = createFiber(vdom.type, vdom.props, parent);
  fiber.effectTag = 'PLACEMENT';
  console.log("[DFS] Set effectTag 'PLACEMENT' for:", vdom.type);
  if (typeof vdom.type === 'string') {
    fiber.stateNode = createDom(fiber);
    console.log('[DFS] Created DOM node for', vdom.type, ':', fiber.stateNode);
  }

  // Use vdom.props.children instead of vdom.children.
  const children = (vdom.props && vdom.props.children) || [];
  if (children && children.length > 0) {
    let prevChild = null;
    children.forEach((child, index) => {
      const childFiber = dfs(child, fiber);
      if (index === 0) {
        console.log('[DFS] Setting up as first child for', vdom.type);
        fiber.child = childFiber;
      } else {
        console.log('[DFS] Adding sibling for', vdom.type);
        prevChild.sibling = childFiber;
      }
      prevChild = childFiber;
    });
  }
  return fiber;
}

// ---------------------
// DIFFING (DOUBLE BUFFER)
// ---------------------
let deletions = [];

function diffFibers(currentFiber, newVdom, parentFiber = null) {
  console.log('[diffFibers] currentFiber:', currentFiber, 'newVdom:', newVdom);
  if (!newVdom) {
    if (currentFiber) {
      currentFiber.effectTag = 'DELETION';
      deletions.push(currentFiber);
      console.log('[diffFibers] Marked for deletion:', currentFiber);
    }
    return null;
  }

  // --- Handle function components ---
  if (typeof newVdom.type === 'function') {
    // ALWAYS create a new fiber for the work-in-progress.
    let fiber = createFiber(
      newVdom.type,
      newVdom.props,
      parentFiber,
      currentFiber
    );
    fiber.effectTag = currentFiber ? 'UPDATE' : 'PLACEMENT';
    // IMPORTANT: Initialize hooks array on the new fiber.
    fiber.hooks = [];
    // Set the alternate to the old fiber (if it exists) so that hooks can be read.
    // (We assume that currentFiber is the previous render's fiber.)
    // Set up global variables for hooks.
    wipFiber = fiber;
    hookIndex = 0;
    // Run the function component to get its rendered output.
    const rendered = newVdom.type(newVdom.props);
    // Diff the rendered output against the old fiber's child (if any).
    const oldFiberChild = currentFiber ? currentFiber.child : null;
    fiber.child = diffFibers(oldFiberChild, rendered, fiber);
    // Clear any leftover sibling pointer.
    fiber.sibling = null;
    return fiber;
  }
  // --- End function component branch ---

  // --- Handle host components ---
  let newFiber = null;
  if (currentFiber && currentFiber.type === newVdom.type) {
    newFiber = createFiber(
      newVdom.type,
      newVdom.props,
      parentFiber,
      currentFiber
    );
    // Reuse the existing DOM node.
    newFiber.stateNode = currentFiber.stateNode;
    newFiber.effectTag = 'UPDATE';
    console.log('[diffFibers] Updating fiber for type:', newVdom.type);
  } else {
    newFiber = createFiber(newVdom.type, newVdom.props, parentFiber);
    newFiber.effectTag = 'PLACEMENT';
    console.log('[diffFibers] Creating new fiber for type:', newVdom.type);
    if (currentFiber) {
      currentFiber.effectTag = 'DELETION';
      deletions.push(currentFiber);
      console.log(
        '[diffFibers] Marked old fiber for deletion due to type mismatch:',
        currentFiber
      );
    }
  }

  // Diff children for host components.
  const newChildren = (newVdom.props && newVdom.props.children) || [];
  let oldChild = currentFiber ? currentFiber.child : null;
  let prevSibling = null;
  newChildren.forEach((child, index) => {
    const oldChildForIndex = oldChild;
    if (oldChild) {
      oldChild = oldChild.sibling;
    }
    const childFiber = diffFibers(oldChildForIndex, child, newFiber);
    if (index === 0) {
      newFiber.child = childFiber;
    } else if (prevSibling) {
      prevSibling.sibling = childFiber;
    }
    prevSibling = childFiber;
  });
  while (oldChild) {
    oldChild.effectTag = 'DELETION';
    deletions.push(oldChild);
    console.log(
      '[diffFibers] Marking remaining old child for deletion:',
      oldChild
    );
    oldChild = oldChild.sibling;
  }
  return newFiber;
}

// ---------------------
// COMMIT PHASE (APPLY CHANGES TO THE DOM)
// ---------------------
function createDom(fiber) {
  console.log('[createDom] Creating DOM for fiber:', fiber);
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  // If the element is a text node, update its nodeValue directly.
  if (dom.nodeType === Node.TEXT_NODE) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = nextProps.nodeValue;
    }
    return;
  }

  // Remove old or changed event listeners.
  Object.keys(prevProps)
    .filter((name) => name.startsWith('on'))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties.
  Object.keys(prevProps)
    .filter(
      (name) =>
        name !== 'children' && !name.startsWith('on') && name !== 'style'
    )
    .forEach((name) => {
      dom[name] = '';
    });

  // Set new or changed properties.
  Object.keys(nextProps)
    .filter(
      (name) =>
        name !== 'children' && !name.startsWith('on') && name !== 'style'
    )
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Update styles.
  if (nextProps.style) {
    dom.style.cssText = nextProps.style;
  }

  // Add event listeners.
  Object.keys(nextProps)
    .filter((name) => name.startsWith('on'))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitDeletion(fiber, parentDom) {
  // If this is a function component, recursively process its children without
  // removing anything at this level (since it doesn't have its own DOM node).
  if (typeof fiber.type === 'function') {
    commitDeletion(fiber.child, parentDom);
    return;
  }

  console.log('[commitDeletion] Deleting fiber:', fiber);
  if (fiber.stateNode) {
    if (parentDom.contains(fiber.stateNode)) {
      parentDom.removeChild(fiber.stateNode);
      console.log('[commitDeletion] Removed fiber stateNode:', fiber.stateNode);
    }
  } else if (fiber.child) {
    commitDeletion(fiber.child, parentDom);
  }
}

function commitWork(fiber) {
  if (!fiber) return;

  // For function components, simply delegate to its children.
  if (typeof fiber.type === 'function') {
    commitWork(fiber.child);
    commitWork(fiber.sibling);
    return;
  }

  let parentFiber = fiber.parent;
  while (parentFiber && !parentFiber.stateNode) {
    parentFiber = parentFiber.parent;
  }
  const parentDom = parentFiber ? parentFiber.stateNode : null;
  if (!parentDom) {
    console.warn('[commitWork] No parent DOM for fiber:', fiber);
    return;
  }
  console.log('[commitWork] Committing fiber:', fiber);
  if (fiber.effectTag === 'PLACEMENT') {
    if (!fiber.stateNode) {
      fiber.stateNode = createDom(fiber);
      console.log(
        '[commitWork] Created stateNode for placement:',
        fiber.stateNode
      );
    }
    parentDom.appendChild(fiber.stateNode);
    console.log(
      '[commitWork] Appended node:',
      fiber.stateNode,
      'to',
      parentDom
    );
  } else if (fiber.effectTag === 'UPDATE') {
    if (!fiber.stateNode) {
      fiber.stateNode = createDom(fiber);
      parentDom.appendChild(fiber.stateNode);
      console.log(
        '[commitWork] Created stateNode for update:',
        fiber.stateNode
      );
    } else {
      updateDom(fiber.stateNode, fiber.alternate.props, fiber.props);
      console.log('[commitWork] Updated node:', fiber.stateNode);
    }
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, parentDom);
    console.log('[commitWork] Deleted fiber:', fiber);
    return;
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitChanges(rootFiber) {
  console.log('[commitChanges] Committing root fiber:', rootFiber);
  // rootFiber.stateNode.innerHTML = '';
  if (rootFiber.child) {
    commitWork(rootFiber.child);
  }
  // Process deletions—skip fibers for function components.
  deletions.forEach((fiber) => {
    // Skip deletion if the fiber is a function component.
    if (typeof fiber.type === 'function') return;
    let parentFiber = fiber.parent;
    while (parentFiber && !parentFiber.stateNode) {
      parentFiber = parentFiber.parent;
    }
    const parentDom = parentFiber ? parentFiber.stateNode : null;
    if (parentDom) {
      commitDeletion(fiber, parentDom);
    }
  });
  deletions = [];
  runEffects(rootFiber);
}

function runEffects(fiber) {
  if (!fiber) return;
  if (typeof fiber.type === 'function' && fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      // Run effect on mount (if no alternate) or if dependencies have changed.
      if (hook.effect && (!fiber.alternate || hook.hasChanged)) {
        console.log('[runEffects] Running effect for fiber:', fiber);
        const cleanup = hook.effect();
        hook.cleanup = cleanup; // (You could later call this on unmount or re-run)
      }
    });
  }
  runEffects(fiber.child);
  runEffects(fiber.sibling);
}

// ---------------------
// RENDER PHASE (BEGIN & COMPLETE WORK)
// ---------------------
let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;

let lastVDom = null;

function render(vdom, container) {
  lastVDom = vdom;
  console.log('[render] New render called with vdom:', vdom);
  if (!container) {
    throw new Error('[render] Root container is missing!');
  }
  if (currentRoot) {
    console.log('[render] Diffing against currentRoot');
    wipRoot = {
      stateNode: container,
      props: { children: [vdom] },
      alternate: currentRoot,
      type: 'ROOT',
    };
    wipRoot.child = diffFibers(currentRoot.child, vdom, wipRoot);
  } else {
    console.log('[render] First render: building tree using DFS');
    wipRoot = {
      stateNode: container,
      props: { children: [vdom] },
      alternate: null,
      type: 'ROOT',
    };
    wipRoot.child = dfs(vdom, wipRoot);
  }
  nextUnitOfWork = wipRoot;
  console.log('[render] wipRoot set:', wipRoot);
}

function beginWork(fiber) {
  console.log('[beginWork] Processing fiber:', fiber);
  if (typeof fiber.type === 'function') {
    console.log(
      '[beginWork] Function component detected:',
      fiber.type.name || fiber.type
    );
    // Set up hooks for this function component.
    wipFiber = fiber;
    hookIndex = 0;
    fiber.hooks = [];
    // Call the function component with its props.
    const children = fiber.type(fiber.props);
    console.log('[beginWork] Function component returned:', children);
    // Build a fiber tree from the returned VDOM.
    const oldFiberChild = fiber.alternate ? fiber.alternate.child : null;
    fiber.child = diffFibers(oldFiberChild, children, fiber);
    return fiber.child;
  }
  if (typeof fiber.type === 'string' && !fiber.stateNode) {
    fiber.stateNode = createDom(fiber);
    console.log('[beginWork] Created DOM for fiber:', fiber);
  }
  return fiber.child;
}

function completeWork(fiber) {
  console.log('[completeWork] Completing fiber:', fiber);
  // In a more complete implementation, you could propagate info upward.
}

function performUnitOfWork(fiber) {
  console.log('[performUnitOfWork] Processing fiber:', fiber);
  let next = beginWork(fiber);
  if (next) {
    return next;
  }
  while (fiber) {
    completeWork(fiber);
    if (fiber.sibling) {
      return fiber.sibling;
    }
    fiber = fiber.parent;
  }
  return null;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    console.log('[workLoop] No more work. Committing changes...');
    commitChanges(wipRoot);
    currentRoot = wipRoot;
    wipRoot = null;
  }

  // 🛑 Stop calling requestIdleCallback if there's no work left
  if (nextUnitOfWork || wipRoot) {
    requestIdleCallback(workLoop);
  }
}

requestIdleCallback(workLoop);

// ---------------------
// EXAMPLE USAGE
// ---------------------

function MyComponent(props) {
  const [name, setName] = useState(props.name);
  console.log('[MyComponent] props:', props, 'state:', name);

  useEffect(() => {
    console.log('[MyComponent] useEffect: Name changed to', name);
  }, [name]);

  return (
    <div className='my-component'>
      <span>Hello</span> {name}
      <button onClick={() => setName('Changed!')}>Change Name</button>
    </div>
  );
}

const vdom = (
  <div className='container'>
    <h1>Welcome</h1>
    <MyComponent name='World' />
  </div>
);
function App() {
  return (
    <div className='container'>
      <h1>Welcome</h1>
      <MyComponent name='World' />
    </div>
  );
}

// const container = document.getElementById('root');
// render(App(), container);

/** @jsx createElement */

// ---------------------
// Demo Components
// ---------------------

// A simple counter component.
// function Counter() {
//   const [count, setCount] = useState(0);

//   useEffect(() => {
//     console.log('[Counter] Count updated:', count);
//   }, [count]);

//   return (
//     <div style={{ margin: '20px', padding: '10px', border: '1px solid #ccc' }}>
//       <h2>Counter: {count}</h2>
//       <button onClick={() => setCount(count + 1)}>Increment</button>
//     </div>
//   );
// }

// // An animated box that bounces horizontally.
// // Using a simple module-level flag for demonstration:
// let animationStarted = false;

// // Using a simple module-level flag for demonstration:

// function AnimatedBox() {
//   const [{ position, direction }, setBox] = useState({
//     position: 0,
//     direction: 1,
//   });
//   const [running, setRunning] = useState(true);

//   useEffect(() => {
//     let animationFrameId;

//     const animate = () => {
//       setBox((prev) => {
//         let newPos = prev.position + prev.direction * 5;
//         let newDirection = prev.direction;
//         // Bounce when reaching boundaries (0 and 300)
//         if (newPos > 300 || newPos < 0) {
//           newDirection = -prev.direction;
//           newPos = Math.max(0, Math.min(300, newPos));
//         }
//         return { position: newPos, direction: newDirection };
//       });
//       // Only schedule the next frame if animation is running
//       if (running) {
//         animationFrameId = requestAnimationFrame(animate);
//       }
//     };

//     // Start the animation loop if running
//     if (running) {
//       animationFrameId = requestAnimationFrame(animate);
//     }

//     // Cleanup: cancel the scheduled frame on unmount or when running changes
//     return () => cancelAnimationFrame(animationFrameId);
//   }, [running]); // Re-run this effect whenever the running state changes

//   return (
//     <div
//       style={{
//         position: 'relative',
//         width: '350px',
//         height: '150px',
//         border: '2px solid #333',
//         margin: '20px',
//       }}
//     >
//       <div
//         style={{
//           position: 'absolute',
//           left: position + 'px',
//           top: '25px',
//           width: '50px',
//           height: '50px',
//           backgroundColor: 'blue',
//         }}
//       ></div>
//       <button
//         style={{ marginTop: '80px', display: 'block' }}
//         onClick={() => setRunning((prev) => !prev)}
//       >
//         {running ? 'Stop Animation' : 'Start Animation'}
//       </button>
//     </div>
//   );
// }

// // (Existing) A component demonstrating state and effect hooks.
// function MyComponent(props) {
//   const [name, setName] = useState(props.name);
//   console.log('[MyComponent] props:', props, 'state:', name);

//   useEffect(() => {
//     console.log('[MyComponent] useEffect: Name changed to', name);
//   }, [name]);

//   return (
//     <div
//       className='my-component'
//       style={{ margin: '20px', padding: '10px', border: '1px solid #f90' }}
//     >
//       <span>Hello</span> {name}
//       <button
//         onClick={() => setName('Changed!')}
//         style={{ marginLeft: '10px' }}
//       >
//         Change Name
//       </button>
//     </div>
//   );
// }

// // The main App component that brings everything together.
// function App() {
//   return (
//     <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
//       <h1>Fiber Architecture Demo</h1>
//       <Counter />
//       <AnimatedBox />
//       <MyComponent name='Fiber' />
//     </div>
//   );
// }

// // ---------------------
// // Render the App
// // ---------------------
const container = document.getElementById('root');
render(App(), container);
