"use strict";

var root = document.documentElement;
const domParser = new DOMParser();
var parseHTML = html => domParser.parseFromString(`<div>${html}</div>`, "text/html").body.children[0];
async function handle (err) {
  console.error(err);
  if (await confirm("An error has occurred. The page will now reload<br><br>" + err)) location.reload();
}
function remakeElement (el) {
  const newEl = document.createElement(el.tagName);
  for (let attr of el.attributes) newEl.setAttribute(attr.name, attr.value);
  return newEl;
}
var type = {
  check (value, ...types) {
    let typeString = "type ";
    switch (types.length) {
      case 0:
        throw new Error("Cannot check type without being provided with one or more types");
      case 1:
        typeString += this.typename(types[0]);
        break;
      case 2:
        typeString += types.map(this.typename).toString().replace(",", " or ");
        break;
      default:
        typeString += types.map(this.typename).toString.replace(/,/g, ", ").replace(/,(?=[^,]$)/, ", or");
    }
    if (value == null || isNaN(value)) {
      if (types.indexOf(value) === -1) throw new TypeError(`Expected ${typeString}; received type ${value}`);
      else return;
    }
    if (typeof value === "object") {
      for (let type of [Boolean, Number, String, Symbol]) {
        if (value instanceof type) {
          if (this.allowWrapperClasses) {
            value = type(value);
            break;
          }
          else throw new TypeError(`Expected ${typeString}; received type ${value.constructor.name}-Object`);
        }
      }
    }
    for (let type of types) {
      if (value instanceof type || value.constructor === type) return;
    }
    throw new TypeError(`Expected ${typeString}; received type ${value.constructor.name}`);
  },
  typename (type) {
    return type == null ? type + "" : type.name;
  },
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