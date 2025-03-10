/**
 * Apply properties (attributes and event listeners) to a DOM node.
 */
export default function applyProps(node, props) {
  for (const key in props) {
    if (key.startsWith("on")) {
      node.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else {
      node[key] = props[key];
    }
  }
}
