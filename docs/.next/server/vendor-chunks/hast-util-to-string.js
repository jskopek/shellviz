"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/hast-util-to-string";
exports.ids = ["vendor-chunks/hast-util-to-string"];
exports.modules = {

/***/ "(rsc)/./node_modules/hast-util-to-string/lib/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/hast-util-to-string/lib/index.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   toString: () => (/* binding */ toString)\n/* harmony export */ });\n/**\n * @typedef {import('hast').Nodes} Nodes\n * @typedef {import('hast').Parents} Parents\n */\n\n/**\n * Get the plain-text value of a hast node.\n *\n * @param {Nodes} node\n *   Node to serialize.\n * @returns {string}\n *   Serialized node.\n */\nfunction toString(node) {\n  // “The concatenation of data of all the Text node descendants of the context\n  // object, in tree order.”\n  if ('children' in node) {\n    return all(node)\n  }\n\n  // “Context object’s data.”\n  return 'value' in node ? node.value : ''\n}\n\n/**\n * @param {Nodes} node\n *   Node.\n * @returns {string}\n *   Serialized node.\n */\nfunction one(node) {\n  if (node.type === 'text') {\n    return node.value\n  }\n\n  return 'children' in node ? all(node) : ''\n}\n\n/**\n * @param {Parents} node\n *   Node.\n * @returns {string}\n *   Serialized node.\n */\nfunction all(node) {\n  let index = -1\n  /** @type {Array<string>} */\n  const result = []\n\n  while (++index < node.children.length) {\n    result[index] = one(node.children[index])\n  }\n\n  return result.join('')\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaGFzdC11dGlsLXRvLXN0cmluZy9saWIvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0EsYUFBYSxzQkFBc0I7QUFDbkMsYUFBYSx3QkFBd0I7QUFDckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsV0FBVyxTQUFTO0FBQ3BCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxlQUFlO0FBQzVCOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXJpYS1kb2NzLy4vbm9kZV9tb2R1bGVzL2hhc3QtdXRpbC10by1zdHJpbmcvbGliL2luZGV4LmpzPzhhN2IiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCdoYXN0JykuTm9kZXN9IE5vZGVzXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCdoYXN0JykuUGFyZW50c30gUGFyZW50c1xuICovXG5cbi8qKlxuICogR2V0IHRoZSBwbGFpbi10ZXh0IHZhbHVlIG9mIGEgaGFzdCBub2RlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZXN9IG5vZGVcbiAqICAgTm9kZSB0byBzZXJpYWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogICBTZXJpYWxpemVkIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1N0cmluZyhub2RlKSB7XG4gIC8vIOKAnFRoZSBjb25jYXRlbmF0aW9uIG9mIGRhdGEgb2YgYWxsIHRoZSBUZXh0IG5vZGUgZGVzY2VuZGFudHMgb2YgdGhlIGNvbnRleHRcbiAgLy8gb2JqZWN0LCBpbiB0cmVlIG9yZGVyLuKAnVxuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgcmV0dXJuIGFsbChub2RlKVxuICB9XG5cbiAgLy8g4oCcQ29udGV4dCBvYmplY3TigJlzIGRhdGEu4oCdXG4gIHJldHVybiAndmFsdWUnIGluIG5vZGUgPyBub2RlLnZhbHVlIDogJydcbn1cblxuLyoqXG4gKiBAcGFyYW0ge05vZGVzfSBub2RlXG4gKiAgIE5vZGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogICBTZXJpYWxpemVkIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIG9uZShub2RlKSB7XG4gIGlmIChub2RlLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgIHJldHVybiBub2RlLnZhbHVlXG4gIH1cblxuICByZXR1cm4gJ2NoaWxkcmVuJyBpbiBub2RlID8gYWxsKG5vZGUpIDogJydcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1BhcmVudHN9IG5vZGVcbiAqICAgTm9kZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKiAgIFNlcmlhbGl6ZWQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gYWxsKG5vZGUpIHtcbiAgbGV0IGluZGV4ID0gLTFcbiAgLyoqIEB0eXBlIHtBcnJheTxzdHJpbmc+fSAqL1xuICBjb25zdCByZXN1bHQgPSBbXVxuXG4gIHdoaWxlICgrK2luZGV4IDwgbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gb25lKG5vZGUuY2hpbGRyZW5baW5kZXhdKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdC5qb2luKCcnKVxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/hast-util-to-string/lib/index.js\n");

/***/ })

};
;