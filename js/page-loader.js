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
function loadPage () {
  "use strict";
  window.pageLoadState = "loading";
  //if (!Modal.openModal) Modal.open(document.getElementById("loading-modal"));
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
      new Promise((resolve) => { // imports
        if (imports) {
          for (let e of Array.from(imports.children)) {
            if (e.tagName === "SCRIPT") { // For some reason, Firefox won't let me 
              const og = e;
              e = document.createElement("script");
              for (let attr of og.attributes) e.setAttribute(attr.name, attr.value);
            }
            document.head.appendChild(e);
          }
        }
        resolve();
      }),
      new Promise((resolve) => { // page
        console.log(page.innerHTML);
        document.getElementById("current-page").innerHTML = page.innerHTML;
        resolve();
      })
    ]))
    .then(() => {
      transitionLinks();
    })  
    .then(() => {
      Modal.close();
      window.pageLoadState = "complete";
      window.dispatchEvent(new Event("page-loaded"));
    })
    .catch(handle);
}
window.addEventListener("popstate", () => {
  Modal.open(document.getElementById("loading-modal"));
  loadPage();
});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();