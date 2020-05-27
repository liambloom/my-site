"use strict";

let notInitialLoading = false;
var currentPage;

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
var awaitPageLoad = new Promise(resolve => {
  if (document.readyState === "complete") resolve();
  else window.addEventListener("load", resolve);
});
var awaitDocumentReady = new Promise(resolve => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resolve);
  else resolve();
});
function loadPage () { // : Promise<boolean> -- If a new page was navigated to, returns true, else false
  if (currentPage === location.href) return menu.updateMenuState().then(() => false);
  window.pageLoadState = "loading";
  if (notInitialLoading) Modal.loading.start();
  else notInitialLoading = true;
  //document.getElementById("prev-page").innerHTML = document.getElementById("current-page").innerHTML;
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
          let deferredPromises = [];
          if (imports) {
            for (let e of Array.from(imports.children)) {
              let link;
              if (e.tagName === "SCRIPT") { // This is defined as a function in globals, but I don't want to wait everything to be fetched, parsed, and run before I can do anything.
                const og = e;
                e = document.createElement("script");
                for (let attr of og.attributes) e.setAttribute(attr.name, attr.value);
              }
              e.setAttribute("data-for-page", location.pathname);
              const isDeferred = e.getAttribute("defer") === "" || e.getAttribute("defer") === "true";
              if (isDeferred) {
                link = document.createElement("link");
                link.rel = "preload";
                link.as = "script";
                link.href = e.src;
                document.head.appendChild(link);
              }
              const importPromise = () => new Promise((resolveImport, rejectImport) => {
                e.addEventListener("load", () => {
                  resolveImport();
                });
                e.addEventListener("error", err => {
                  if (!(err instanceof ErrorEvent)) rejectImport(err);
                });
                setTimeout(() => {
                  rejectImport(new Error("Loading took too long"));
                }, 15000);
                document.head.appendChild(e);
                if (link) link.remove();
              });
              if (isDeferred) deferredPromises.push(importPromise);
              else importPromises.push(importPromise());
            }
          }
          resolve(
            Promise.all(importPromises)
              .then(() => new Promise(resolveInner => {
                if (window.pageLoadState === "interactive") resolveInner();
                else window.addEventListener("pagecontentloaded", resolveInner);
              }))
              .then(() => Promise.all(deferredPromises.map(fn => fn())))
          );
        }),
        awaitDocumentReady
          .then(() => {
            main.innerHTML = page.innerHTML;
          })
          .then(() => {
            window.pageLoadState = "interactive";
            window.dispatchEvent(new Event("pagecontentloaded"));
          })
      ]))
      .then(awaitPageLoad)
      .then(() => Promise.all([
        transitionLinks, 
        initCustomInputs
      ]))
      .catch(err => awaitPageLoad.then(() => handle(err))),
    () => {
      for (let e of Array.from(document.querySelectorAll("[data-for-page]"))) {
        if (e.getAttribute("data-for-page") !== location.pathname) e.remove();
      }
    }
  ])
    .then(awaitPageLoad)
    .then(() => {
      currentPage = location.href;
      Modal.loading.end();
      window.pageLoadState = "complete";
      window.dispatchEvent(new Event("pageload"));
      history.replaceState(menu.clearedState, "");
      menu.updateMenuState(); // Run asynchronously, NOT awaited
      return true;
    })
    .catch(err => awaitPageLoad.then(() => handle(err)));  
}
awaitDocumentReady
  .then(() => {
    window.main = document.getElementsByTagName("main")[0];
  });

window.addEventListener("popstate", loadPage);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();