"use strict";

let notInitialLoading = false;
var currentPage, pageLoadState;

function transition (event) {
  event.preventDefault();
  history.pushState(menu.clearedState, "", this.href);
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
  Modal.loading.end();
  window.pageLoadState = "complete";
  window.dispatchEvent(new Event("page-loaded"));
}
function loadPage () { // : Promise<boolean> -- If a new page was navigated to, returns true, else false
  if (currentPage === location.href) return menu.updateMenuState().then(() => false);
  pageLoadState = "loading";
  if (notInitialLoading) Modal.loading.start();
  else notInitialLoading = true;
  document.getElementById("prev-page").innerHTML = document.getElementById("current-page").innerHTML;
  return Promise.all([
    fetch("/pages" + location.pathname, {
      method: "POST",
      body: JSON.stringify({
        timestamp: new Date().getTime()
      })
    })
      .then(page => page.text())
      .then(page => parseHTML(page))
      .then(page => {
        const imports = page.getElementsByTagName("imports")[0];
        if (imports) imports.remove();
        return { page, imports };
      })
      .then(({ page, imports }) => Promise.all([
        new Promise(resolve => { // imports
          let importPromises = [];
          if (imports) {
            for (let e of Array.from(imports.children)) {
              if (e.tagName === "SCRIPT") { // This is defined as a function in globals, but I don't want to wait everything to be fetched, parsed, and run before I can do anything.
                const og = e;
                e = document.createElement("script");
                for (let attr of og.attributes) e.setAttribute(attr.name, attr.value);
              }
              e.setAttribute("data-for-page", location.pathname);
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
      .then(transitionLinks)
      .catch(err => {
        if (document.readyState === "complete") handle(err);
        else document.addEventListener("load", () => handle(err));
      }),
    () => {
      for (let e of Array.from(document.querySelectorAll("[data-for-page]"))) {
        if (e.getAttribute("data-for-page") !== location.pathname) e.remove();
      }
    }
  ])
    .then(() => {
      currentPage = location.href;
      if (document.readyState === "complete") loaded();
      else window.addEventListener("load", loaded);
      history.replaceState(menu.clearedState, "");
      menu.updateMenuState(); // Run asynchronously, NOT awaited
      return true;
    });  
}
window.addEventListener("popstate", loadPage);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();