// FIXME: MAJOR BUG: Going to same page twice causes error because of variable redecleration

const relList = document.createElement("link").relList;
//let notInitialLoading = false;
let pageNo = 1;
var currentPage: string;
var main: HTMLElement;

async function transition(this: HTMLAnchorElement, event: Event) {
  event.preventDefault();
  history.pushState((await import("./header.js")).menu.clearedState, "", this.href);
  loadPage();
}
function transitionLinks() {
  //console.log("transitioned");
  for (let link of Array.from(document.getElementsByTagName("a"))) {
    if (new URL(link.href).origin === location.origin) {
      link.removeEventListener("click", transition);
      link.addEventListener("click", transition);
    }
  }
}
var awaitPageLoad: Promise<void> = new Promise(resolve => {
  if (document.readyState === "complete") resolve();
  else window.addEventListener("load", () => resolve());
});
var awaitDocumentReady: Promise<void> = new Promise(resolve => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => resolve());
  else resolve();
});

awaitPageLoad.then(() => {
  console.log(document.readyState + " " + performance.now());
});

function loadPage(): Promise<boolean> { // : Promise<boolean> -- If a new page was navigated to, returns true, else false
  if (currentPage === location.href) return import("./header.js").then(({ menu }) => menu.updateMenuState()).then(() => false);
  const id = `Page ${pageNo++}: ${location.href}`;
  console.time(id);
  // window.pageLoadState = "loading";
  document.body.setAttribute("data-pageLoadState", "loading");
  //if (notInitialLoading) (await import("ts/global/modal.js")).Modal.loading.start();
  //else notInitialLoading = true;
  document.body.classList.add("disable-transitions");
  //document.getElementById("prev-page").innerHTML = document.getElementById("current-page").innerHTML;
  return Promise.all([
    fetch(`/templates/pages${location.pathname}${location.pathname.endsWith("/") ? "index" : ""}.html`, {
      method: "GET"
      /*method: "POST",
      body: JSON.stringify({
        timestamp: new Date().getTime()
      })*/
    })
      .then(page => page.text())
      .then(page => new DOMParser().parseFromString(`<div>${page}</div>`, "text/html").body.children[0])
      .then(page => {
        const imports = page.getElementsByTagName("imports")[0];
        const title = page.getElementsByTagName("title")[0];
        if (imports) imports.remove();
        if (title) title.remove();
        return { page, imports, title };
      })
      .then(({ page, imports, title: titleElement }) => Promise.all([
        new Promise(resolve => { // imports
          let importPromises: Promise<void>[] = [];
          let deferredPromises: (() => Promise<void>)[] = [];
          if (imports) {
            for (let e of Array.from(imports.children)) {
              let link: HTMLLinkElement;
              let isDeferred: boolean;
              if (e instanceof HTMLScriptElement) { // This is defined as a function in globals, but I don't want to wait everything to be fetched, parsed, and run before I can do anything.
                // TODO: it is probably better to import((<HTMLScriptElement>e).src) rather than adding a script tag
                //    Importing it means that it is only evaluated once.
                //    Also, maybe do import((<HTMLScriptElement>e).src).then(mod => mod.main())
                //    This would allow me to still have code run each time the page is visited, without variable redecelerations
                //    I would need to create a HasMain interface for that.
                //    In order to make sure that the state is reset between pages, I should override functions that set a thing to 
                //      happen in the future and un-make them happen when the page is unloaded (addEventListener, requestAnimationFrame, setTimeout, setInterval)
                const og = e;
                e = document.createElement("script");
                for (let attr of og.attributes) e.setAttribute(attr.name, attr.value);
                isDeferred = e.getAttribute("defer") === "" || e.getAttribute("defer") === "true";
                if (isDeferred && relList.supports("preload")) {
                  link = document.createElement("link");
                  link.rel = "preload";
                  link.as = "script";
                  link.href = (e as HTMLScriptElement).src;
                  document.head.appendChild(link);
                }
              }
              else if (e instanceof HTMLLinkElement) {
                isDeferred = false;       
                if (e.rel && !e.relList.supports(e.rel)) {
                  console.warn(`rel="${e.rel}" is not supported`);
                  continue;
                }
              }
              else
                throw new TypeError("Expected link or script, found " + e.tagName);
              e.setAttribute("data-for-page", location.pathname);
              
              const importPromise: () => Promise<void> = () => new Promise((resolveImport, rejectImport) => {
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
              /*.then(() => new Promise(resolveInner => {
                if (window.pageLoadState === "interactive") resolveInner();
                else window.addEventListener("pagecontentloaded", resolveInner);
              }))*/
              .then(() => awaitDocumentReady)
              .then(() => Promise.all(deferredPromises.map(fn => fn())))
          );
        }),
        awaitDocumentReady
          .then(() => {
            (main || (() => document.getElementsByTagName("main")[0])()).innerHTML = page.innerHTML;
          })
          .then(() => {
            //window.pageLoadState = "interactive";
            document.body.setAttribute("data-pageLoadState", "interactive");
            window.dispatchEvent(new Event("pagecontentloaded"));
          }),
        new Promise<void>(resolve => {
          let title: string;
          if (titleElement) title = titleElement.innerText;
          else {
            console.warn("Missing title");
            title = "[Error: Missing Title]";
          }
          document.title = title;
          awaitDocumentReady
            .then(() => {
              document.getElementById("title")!.innerText = title;
              resolve();
            });
        })
      ]))
      .then(() => awaitPageLoad)
      .then(() => Promise.all([
        transitionLinks(),
        import("./inputs.js")
          .then(({ init }) => init())
      ]))
      .catch(err => awaitPageLoad.then(async () => (await import("./globals.js")).handle(err))),
    () => {
      for (let e of Array.from(document.head.querySelectorAll("[data-for-page]"))) {
        if (e.getAttribute("data-for-page") !== location.pathname) e.remove();
      }
    }
  ])
    .then(() => awaitPageLoad)
    .then(async () => {
      currentPage = location.href;
      document.body.classList.remove("disable-transitions");
      //window.pageLoadState = "complete";
      document.body.setAttribute("data-pageLoadState", "complete");
      window.dispatchEvent(new Event("pageload"));
      const { menu } = await import("./header.js");
      history.replaceState(menu.clearedState, "");
      menu.updateMenuState(); // Run asynchronously, NOT awaited
      console.timeEnd(id);
      return true;
    })
    .catch(err => awaitPageLoad
      .then(() => import("./globals.js"))
      .then(({ handle }) => handle(err))
      .then(() => false));
}
awaitDocumentReady
  .then(() => {
    main = document.getElementsByTagName("main")[0];
  });

window.addEventListener("popstate", loadPage);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();