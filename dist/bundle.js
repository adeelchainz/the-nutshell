/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./packages/CSR/csr.js":
/*!*****************************!*\
  !*** ./packages/CSR/csr.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createElement: () => (/* binding */ createElement),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   render: () => (/* binding */ render),\n/* harmony export */   updateDOM: () => (/* binding */ updateDOM)\n/* harmony export */ });\nfunction _typeof(o) { \"@babel/helpers - typeof\"; return _typeof = \"function\" == typeof Symbol && \"symbol\" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && \"function\" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? \"symbol\" : typeof o; }, _typeof(o); }\n// 1. Advanced Virtual DOM Representation with Events\nfunction createElement(type, props) {\n  if (typeof type !== \"string\") {\n    console.error(\"Invalid element type: must be a string.\");\n    throw new Error(\"Invalid element type: must be a string.\");\n  }\n  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {\n    children[_key - 2] = arguments[_key];\n  }\n  console.log(\"Creating element:\", {\n    type: type,\n    props: props,\n    children: children\n  });\n\n  // Create a virtual DOM element representation\n  return {\n    type: type,\n    // The type of the DOM element (e.g., 'div', 'p')\n    props: props || {},\n    // Props or attributes for the element\n    children: children.flat().map(function (child) {\n      return child == null || child === false ? createTextElement(\"\") // Handle falsy children as empty text elements\n      : _typeof(child) === \"object\" ? child : createTextElement(child);\n    } // Recursively handle children\n    )\n  };\n}\nfunction createTextElement(text) {\n  if (typeof text !== \"string\" && typeof text !== \"number\") {\n    console.error(\"Invalid text element: must be a string or number.\", text);\n    throw new Error(\"Invalid text element: must be a string or number.\");\n  }\n  console.log(\"Creating text element:\", text);\n\n  // Create a virtual DOM representation for text nodes\n  return {\n    type: \"TEXT_ELEMENT\",\n    // Special type for text nodes\n    props: {\n      nodeValue: text\n    },\n    // Store the text as a property\n    children: [] // No children for text nodes\n  };\n}\n\n// 2. Render Virtual DOM to Real DOM with Event Handling\nfunction render(vNode) {\n  if (!vNode || _typeof(vNode) !== \"object\" || !vNode.type) {\n    console.error(\"Invalid virtual DOM node:\", vNode);\n    throw new Error(\"Invalid virtual DOM node.\");\n  }\n  console.log(\"Rendering virtual DOM node:\", vNode);\n\n  // Create a real DOM node based on the virtual DOM node\n  var dom = vNode.type === \"TEXT_ELEMENT\" ? document.createTextNode(vNode.props.nodeValue) // Text node\n  : document.createElement(vNode.type); // Element node\n\n  // Set attributes and event listeners\n  Object.keys(vNode.props).forEach(function (name) {\n    if (name.startsWith(\"on\")) {\n      // Add event listener if prop starts with 'on'\n      var eventType = name.toLowerCase().substring(2);\n      if (typeof vNode.props[name] !== \"function\") {\n        console.error(\"Invalid event handler for \".concat(eventType, \". Must be a function.\"));\n        throw new Error(\"Invalid event handler for \".concat(eventType, \". Must be a function.\"));\n      }\n      console.log(\"Adding event listener for \".concat(eventType));\n      dom.addEventListener(eventType, vNode.props[name]);\n    } else if (name !== \"nodeValue\") {\n      // Set other properties\n      console.log(\"Setting property \".concat(name, \" to\"), vNode.props[name]);\n      dom[name] = vNode.props[name];\n    }\n  });\n\n  // Recursively render and append children\n  vNode.children.forEach(function (child) {\n    if (child) {\n      dom.appendChild(render(child));\n    }\n  });\n  return dom; // Return the constructed real DOM node\n}\n\n// 3. Advanced Diffing Algorithm for Updates\nfunction updateDOM(parent, oldVNode, newVNode) {\n  var index = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;\n  if (!parent || !(parent instanceof Node)) {\n    console.error(\"Invalid parent node:\", parent);\n    throw new Error(\"Invalid parent node.\");\n  }\n  console.log(\"Updating DOM:\", {\n    parent: parent,\n    oldVNode: oldVNode,\n    newVNode: newVNode,\n    index: index\n  });\n  if (!oldVNode && newVNode) {\n    // Add new node if oldVNode does not exist\n    console.log(\"Adding new node:\", newVNode);\n    parent.appendChild(render(newVNode));\n  } else if (oldVNode && !newVNode) {\n    // Remove old node if newVNode does not exist\n    console.log(\"Removing old node:\", oldVNode);\n    if (parent.childNodes[index]) {\n      parent.removeChild(parent.childNodes[index]);\n    } else {\n      console.error(\"Child node to remove does not exist.\");\n      throw new Error(\"Child node to remove does not exist.\");\n    }\n  } else if (oldVNode.type !== newVNode.type) {\n    // Replace node if types are different\n    console.log(\"Replacing node:\", {\n      oldVNode: oldVNode,\n      newVNode: newVNode\n    });\n    parent.replaceChild(render(newVNode), parent.childNodes[index]);\n  } else if (oldVNode.type === \"TEXT_ELEMENT\" && oldVNode.props.nodeValue !== newVNode.props.nodeValue) {\n    // Update text content if it has changed\n    console.log(\"Updating text content:\", {\n      oldText: oldVNode.props.nodeValue,\n      newText: newVNode.props.nodeValue\n    });\n    parent.childNodes[index].nodeValue = newVNode.props.nodeValue;\n  } else {\n    // Update attributes and event listeners for element nodes\n    console.log(\"Updating props for element node:\", {\n      oldProps: oldVNode.props,\n      newProps: newVNode.props\n    });\n    updateProps(parent.childNodes[index], oldVNode.props, newVNode.props);\n\n    // Recursively diff children\n    var max = Math.max(oldVNode.children.length, newVNode.children.length);\n    for (var i = 0; i < max; i++) {\n      updateDOM(parent.childNodes[index], oldVNode.children[i], newVNode.children[i], i);\n    }\n  }\n}\nfunction updateProps(dom, oldProps, newProps) {\n  if (!dom || !(dom instanceof Node)) {\n    console.error(\"Invalid DOM node for updating props:\", dom);\n    throw new Error(\"Invalid DOM node for updating props.\");\n  }\n  console.log(\"Updating props:\", {\n    dom: dom,\n    oldProps: oldProps,\n    newProps: newProps\n  });\n\n  // Remove old attributes and event listeners\n  for (var name in oldProps) {\n    if (name.startsWith(\"on\")) {\n      // Remove event listener if it existed in oldProps\n      var eventType = name.toLowerCase().substring(2);\n      console.log(\"Removing event listener for \".concat(eventType));\n      dom.removeEventListener(eventType, oldProps[name]);\n    } else if (!(name in newProps)) {\n      // Remove attribute if it is not in newProps\n      console.log(\"Removing property \".concat(name));\n      dom[name] = \"\";\n    }\n  }\n\n  // Set new attributes and event listeners\n  for (var _name in newProps) {\n    if (_name.startsWith(\"on\")) {\n      // Add event listener if it exists in newProps\n      var _eventType = _name.toLowerCase().substring(2);\n      if (typeof newProps[_name] !== \"function\") {\n        console.error(\"Invalid event handler for \".concat(_eventType, \". Must be a function.\"));\n        throw new Error(\"Invalid event handler for \".concat(_eventType, \". Must be a function.\"));\n      }\n      console.log(\"Adding event listener for \".concat(_eventType));\n      dom.addEventListener(_eventType, newProps[_name]);\n    } else if (oldProps[_name] !== newProps[_name]) {\n      // Update changed attributes\n      console.log(\"Updating property \".concat(_name, \" to\"), newProps[_name]);\n      dom[_name] = newProps[_name];\n    }\n  }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({\n  createElement: createElement,\n  render: render,\n  updateDOM: updateDOM\n});\n\n//# sourceURL=webpack://the-nutshell/./packages/CSR/csr.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../packages/CSR/csr */ \"./packages/CSR/csr.js\");\n\n// 4. Enhanced Example Usage with Dynamic Updates\ntry {\n  var oldVNode = (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"div\", {\n    id: \"container\"\n  }, (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"h1\", null, \"Hello, Advanced Virtual DOM!\"),\n  // Create an h1 element\n  (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"p\", null, \"This is a more sophisticated example.\"),\n  // Create a paragraph\n  (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"button\", {\n    onclick: function onclick() {\n      return alert(\"Clicked!\");\n    }\n  }, \"Click Me\"),\n  // Create a button with a click handler\n  null,\n  // Falsy child\n  undefined // Falsy child\n  );\n  console.log(\"Initial virtual DOM:\", oldVNode);\n\n  // Render to DOM\n  var root = document.getElementById(\"root\"); // Get the root element\n  if (!root) {\n    console.error(\"Root element not found.\");\n    throw new Error(\"Root element not found.\");\n  }\n  var dom = (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.render)(oldVNode); // Render the old virtual DOM\n  console.log(\"Rendered DOM:\", dom);\n  root.appendChild(dom); // Append it to the root\n\n  // New Virtual DOM for update\n  var newVNode = (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"div\", {\n    id: \"container\"\n  }, (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"h1\", null, \"Hello, Updated Advanced Virtual DOM!\"),\n  // Updated h1 content\n  (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"p\", null, \"This is an updated and enhanced example.\"),\n  // Updated paragraph\n  (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.createElement)(\"button\", {\n    onclick: function onclick() {\n      return alert(\"Still Clickable!\");\n    }\n  }, \"Click Me Again\"),\n  // Updated button label\n  false // Falsy child\n  );\n  console.log(\"Updated virtual DOM:\", newVNode);\n\n  // Update DOM after 2 seconds\n  setTimeout(function () {\n    console.log(\"Starting DOM update...\");\n    (0,_packages_CSR_csr__WEBPACK_IMPORTED_MODULE_0__.updateDOM)(root, oldVNode, newVNode); // Diff and update the DOM\n    console.log(\"DOM update complete.\");\n  }, 2000);\n} catch (error) {\n  console.error(\"Error during execution:\", error);\n}\n\n//# sourceURL=webpack://the-nutshell/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;