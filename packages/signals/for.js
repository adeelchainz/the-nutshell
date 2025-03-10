import { createEffect } from './reactive.js';
import { h } from './jsx.js';

export function For(props) {
  // Extract the render function from children.
  const renderItem = Array.isArray(props.children)
    ? props.children[0]
    : props.children;

  // Create a placeholder comment node to mark where list items will be inserted.
  const placeholder = document.createComment('for placeholder');
  let currentNodesMap = new Map(); // Store nodes by key

  createEffect(() => {
    // Get the current array of items.
    const items = props.each();
    const newNodesMap = new Map(); // Temporary map for new nodes

    items.forEach((item, index) => {
      // Extract the key (either from item or props.key).
      const key = item.key || index;

      // Create new node for this item, passing the key.
      const node = renderItem(item, index, key);

      // Add the node to the new nodes map.
      newNodesMap.set(key, node);
    });

    // Remove old nodes that are no longer in the new nodes map.
    currentNodesMap.forEach((node, key) => {
      if (!newNodesMap.has(key) && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });

    // Insert new or updated nodes into the DOM.
    newNodesMap.forEach((node, key) => {
      // If the node was already inserted, skip insertion.
      if (!currentNodesMap.has(key)) {
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(node, placeholder);
        }
      }
    });

    // Update the current nodes map to reflect the new nodes.
    currentNodesMap = newNodesMap;
  });

  // Return the placeholder so that the parent can insert the list.
  return placeholder;
}
