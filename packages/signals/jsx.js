/** @jsx h */
import { createEffect } from './reactive.js';

export function h(tag, props, ...children) {
  // If tag is a function, treat it as a component.
  if (typeof tag === 'function') {
    return tag({ ...props, children });
  }

  // Otherwise, assume it’s a string (like "div") and create a DOM element.
  const element = document.createElement(tag);

  // Set properties.
  if (props) {
    for (const key in props) {
      if (key === 'ref' && typeof props[key] === 'function') {
        props[key](element);
      } else if (key.startsWith('on') && typeof props[key] === 'function') {
        // Event handler: onClick -> click.
        element.addEventListener(key.substring(2).toLowerCase(), props[key]);
      } else if (key === 'style' && typeof props[key] === 'object') {
        Object.assign(element.style, props[key]);
      } else if (key !== 'children') {
        element.setAttribute(key, props[key]);
      }
    }
  }

  // Process children.
  children.flat().forEach((child) => {
    // For dynamic text, we expect the use of our Dynamic helper.
    if (child instanceof Node) {
      element.appendChild(child);
    } else if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(child));
    } else if (child != null) {
      // Fallback: convert to string.
      element.appendChild(document.createTextNode(child.toString()));
    }
  });

  return element;
}

/**
 * Dynamic helper: given a getter (signal), creates a text node that updates
 * automatically when the signal changes.
 */
export function Dynamic(getter) {
  const textNode = document.createTextNode(getter());
  createEffect(() => {
    textNode.textContent = getter();
  });
  return textNode;
}
