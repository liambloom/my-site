"use strict";

var root = document.documentElement;
const domParser = new DOMParser();
var parseHTML = html => domParser.parseFromString(`<div>${html}</div>`, "text/html").body.children[0];
export async function handle(err) {
  try {
    fetch("/api/error/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: err.message,
        name: err.name,
        page: location.href,
        stack: err.stack || null
      })
    })
      .catch(console.error);
    console.error(err);
    if (await confirm("An error has occurred. The page will now reload<br><br>" + err, true)) location.reload();
  }
  catch (_e) {}
}
function remakeElement (el) {
  const newEl = document.createElement(el.tagName);
  for (let attr of el.attributes) newEl.setAttribute(attr.name, attr.value);
  return newEl;
}
var type = {
  checkRange (value, min = -Infinity, max = Infinity) {
    for (let arg of [value, min, max]) this.check(arg, Number);
    if (value < min || value > max) throw new RangeError(`Expected value between ${min} and ${max}; received ${value}`);
  },
  getTypeString (types) {
    return this.toHList(types.map(this.typename));
  },
  toHList (arr) { // HList stands for Human Readable List. It is a list in english in a string format (with an oxford comma)
    if (!arr) throw new Error("Cannot make list without any elements element");
    if (arr.length === 2) return arr.toString().replace(",", " or ");
    else return arr.toString().replace(/,/g, ", ").replace(/,(?=[^,]$)/, ", or");
  },
  typename: type => type == null ? type + "" : type.name,
  findStrings: e => typeof e === "string" || e instanceof String,
  allowWrapperClasses: false
};
if (!window.setImmediate) {
  window.setImmediate = callback => setTimeout(callback, 0);
  window.clearImmediate = clearTimeout;
}
function setTimeoutAsync (callback, delay, ...args){
  return new Promise(resolve => {
    setTimeout(() => {
      callback();
      resolve();
    }, delay, ...args);
  });
}
function setImmediateAsync (callback, ...args) {
  return setTimeoutAsync(callback, 0, ...args);
}
function getMousePosition (event) {
  return [ event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY ];
}

Function.neg = func => {
  type.check(func, Function);
  return (...args) => !func(...args);
};
Node.prototype.insertAfter = function (newNode, referenceNode) {
  if (this instanceof Document) throw new TypeError("Cannot call method insertAfter on Node of type Document");
  type.check(newNode, Node);
  type.check(referenceNode, Node);
  if (referenceNode.nextSibling) this.insertBefore(newNode, referenceNode.nextSibling);
  else this.appendChild(newNode);
};

// All uncaught errors (normal or async) will trigger these events and will be logged and displayed to the user
window.addEventListener("error", ({error}) => {
  handle(error);
});
window.addEventListener("unhandledrejection", ({reason}) => {
  handle(reason);
});