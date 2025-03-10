// Counter.js
import { createSignal } from '../packages/signals/reactive.js';
import { Dynamic, h } from '../packages/signals/jsx.js'; // Assuming your jsx.js file contains h & Dynamic

import {
  onMount,
  onCleanup,
  onDestroy,
  createComponent,
} from '../packages/signals/lifecycle.js';
import { destroyApp } from '../packages/signals/renderer.js';

function Counter() {
  let count = 0;
  let interval;

  function increment() {
    count++;
    console.log('Counter:', count);
    document.getElementById('count-display').textContent = count;
  }

  onMount(() => {
    console.log('Counter Mounted');
    interval = setInterval(() => {
      increment();
    }, 1000);
  });

  onCleanup(() => {
    console.log('Counter Unmounted');
    if (interval) clearInterval(interval);
  });

  onDestroy(() => {
    console.log('Destroying App... Cleaning up Counter');
  });

  return (
    <div>
      <h2>
        Counter: <span id='count-display'>0</span>
      </h2>
      <button onclick={increment}>Increment</button>
    </div>
  );
}

export function App() {
  return createComponent(() => {
    return (
      <div>
        <h1>Counter Example</h1>
        {Counter()}
        <button onclick={() => destroyApp()}>Destroy App</button>
      </div>
    );
  });
}
