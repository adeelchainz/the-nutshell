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
    // Re-render: create a new work-in-progress root using the current tree as alternate.
    wipRoot = {
      stateNode: currentRoot.stateNode,
      props: currentRoot.props,
      alternate: currentRoot,
      type: 'ROOT',
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
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
    .map(([key, value]) => `${key}: ${value}`)
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
    console.log(
      '[DFS] Function component fiber created:',
      vdom.type.name || vdom.type
    );
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
  let newFiber = null;
  if (currentFiber && currentFiber.type === newVdom.type) {
    newFiber = createFiber(
      newVdom.type,
      newVdom.props,
      parentFiber,
      currentFiber
    );
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

  // **Force re-rendering for function components:**
  if (typeof newVdom.type === 'function') {
    // Call the function component with newVdom.props to get its returned VDOM.
    const children = newVdom.type(newVdom.props);
    console.log('[diffFibers] Function component returned:', children);
    // Build a fiber tree from that VDOM.
    newFiber.child = dfs(children, newFiber);
  } else {
    // Otherwise, diff the children as usual.
    const newChildren = newVdom.children || [];
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
  console.log('[commitDeletion] Deleting fiber:', fiber);
  if (fiber.stateNode) {
    parentDom.removeChild(fiber.stateNode);
  } else if (fiber.child) {
    commitDeletion(fiber.child, parentDom);
  }
}

function commitWork(fiber) {
  if (!fiber) return;

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
  if (rootFiber.child) {
    commitWork(rootFiber.child);
  }
  // After commit, run effects.
  runEffects(rootFiber);
}

function runEffects(fiber) {
  if (!fiber) return;
  if (typeof fiber.type === 'function' && fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      // Optionally, you can check hook.hasChanged here
      if (hook.effect) {
        console.log('[runEffects] Running effect for fiber:', fiber);
        hook.effect();
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

function render(vdom, container) {
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
    fiber.child = dfs(children, fiber);
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

// // Define a new virtual DOM to trigger an update.
// const newVdom = (
//   <div className='container'>
//     <h1>Welcome Back!</h1>
//     <MyComponent name='Universe' />
//   </div>
// );

// console.log('[Example] New vdom:', newVdom);
// console.log('[Example] New vdom object:', JSON.stringify(newVdom, null, 2));

// // Kick off the render phase with the new virtual DOM.
// render(newVdom, container);

// const manualVdom = createElement(
//   'div',
//   { className: 'container' },
//   createElement('h1', null, 'Welcome Back!'),
//   createElement(MyComponent, { name: 'Universe' })
// );

// render(manualVdom, document.getElementById('root'));
function MyComponent(props) {
  console.log('[MyComponent] Rendering with props:', props);
  // Use the custom useState hook
  const [name, setName] = useState(props.name);

  // Use the custom useEffect hook
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

const container = document.getElementById('root');
render(vdom, container);
