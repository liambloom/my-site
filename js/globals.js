"use strict";

window.root = document.documentElement;
const domParser = new DOMParser();
window.parseHTML = html => domParser.parseFromString(`<div>${html}</div>`, "text/html").body.children[0];
window.handle = async err => {
  console.error(err);
  if (await confirm("An error has occured. The page will now reload<br><br>" + err)) location.reload();
};