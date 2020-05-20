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
    let validStrings;
    const findStrings = e => typeof e === "string" || e instanceof String;
    if (types.findIndex(findStrings) !== -1) {
      validStrings = types.filter(findStrings).map(e => e.valueOf());
      types = types.filter(neg(findStrings));
      if (!types.includes(String)) types.push(String);
    }
    if (!types) throw new Error("Cannot check type without being provided with one or more types");
    const typeString = "type " + this.getTypeString(types);
    if (value == null || ((typeof value === "number" || value instanceof Number) && isNaN(value))) {
      if (types.indexOf(value) === -1) throw new TypeError(`Expected ${typeString}; received type ${value}`);
      else return;
    }
    if (typeof value === "object") {
      for (let type of [Boolean, Number, String, Symbol]) { // I don't know if symbol-objects are possible, but just in case
        if (value instanceof type) {
          if (this.allowWrapperClasses) {
            value = value.valueOf();
            break;
          }
          else throw new TypeError(`Expected ${typeString}; received type ${value.constructor.name}-Object`);
        }
      }
    }
    if (typeof value === "string" && validStrings) {
      if (!validStrings.includes(value)) throw new TypeError(`Expected string value ${this.toHList(validStrings)}; received ${value}`);
    }
    for (let type of types) {
      if (value instanceof type || value.constructor === type) return;
    }
    throw new TypeError(`Expected ${typeString}; received type ${value.constructor.name}`);
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
function neg (func) {
  type.check(func, Function);
  return (...args) => !func(...args);
}
function getMousePosition (event) {
  return [ event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY ];
}