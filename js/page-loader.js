let notInitialLoading = false;

function transition (event) {
  event.preventDefault();
  history.pushState(null, "", this.href);
  loadPage();
}
function transitionLinks () {
  for (let link of Array.from(document.getElementsByTagName("a"))) {
    if (new URL(link.href).origin === location.origin) {
      link.removeEventListener("click", transition);
      link.addEventListener("click", transition);
    }
  }
}
function loaded () {
  Modal.close();
  window.pageLoadState = "complete";
  window.dispatchEvent(new Event("page-loaded"));
}
function loadPage () {
  "use strict";
  window.pageLoadState = "loading";
  if (notInitialLoading) {
    while (Modal.openModal) Modal.close();
    Modal.open(document.getElementById("loading-modal"));
  }
  else notInitialLoading = true;
  document.getElementById("prev-page").innerHTML = document.getElementById("current-page").innerHTML;
  const now = new Date();
  fetch("/pages" + location.pathname, {
    method: "POST",
    body: JSON.stringify({
      timestamp: now.getTime()
    })
  })
    .then(page => page.text())
    .then(page => parseHTML(page))
    .then(page => {
      const imports = page.getElementsByTagName("imports")[0];
      if (imports) imports.remove();
      return { page, imports };
    })
    .then(({page, imports}) => Promise.all([
      new Promise(resolve => { // imports
        let importPromises = [];
        if (imports) {
          for (let e of Array.from(imports.children)) {
            if (e.tagName === "SCRIPT") { // This is defined as a function in globals, but I don't want to wait everything to be fetched, parsed, and run before I can do anything.
              const og = e;
              e = document.createElement("script");
              for (let attr of og.attributes) e.setAttribute(attr.name, attr.value);
            }
            importPromises.push(new Promise(resolveImport => {
              e.addEventListener("load", resolveImport);
            }));
            document.head.appendChild(e);
          }
        }
        resolve(Promise.all(importPromises));
      }),
      new Promise(resolve => { // page
        document.getElementById("current-page").innerHTML = page.innerHTML;
        resolve();
      })
    ]))
    .then(() => {
      transitionLinks();
    })  
    .catch(err => {
      if (document.readyState === "complete") handle(err);
      else document.addEventListener("load", () => handle(err));
    })
    .finally(() => {
      if (document.readyState === "complete") loaded();
      else document.addEventListener("load", loaded);
    });
}
window.addEventListener("popstate", () => {
  Modal.open(document.getElementById("loading-modal"));
  loadPage();
});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();