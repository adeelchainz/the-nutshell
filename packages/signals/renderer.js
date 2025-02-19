import { createComponent, cleanupComponent, cleanupApp } from './lifecycle.js';

export function render(component, container) {
  container.innerHTML = ''; // Clear previous render

  const node = createComponent(component);
  container.appendChild(node);

  cleanupComponent(); // Run cleanup functions when re-rendering
}

export function destroyApp() {
  cleanupApp(); // Run all global destroy functions
  console.log('App destroyed');
}
