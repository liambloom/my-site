"use strict";

window.root = document.documentElement;
const domParser = new DOMParser();
window.parseHTML = html => domParser.parseFromString(html, "text/html").body.childNodes;