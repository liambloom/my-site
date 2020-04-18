async function loadPage () {
  "use strict";
  window.pageLoadState = "loading";
  //if (!Modal.openModal) Modal.open(document.getElementById("loading-modal"));
  const now = new Date();
  document.getElementById("current-page").innerHTML = await (await fetch("/pages" + location.pathname, {
    method: "POST",
    body: JSON.stringify({
      timestamp: now.getTime()
    })
  })).text();
  Modal.close();
  window.pageLoadState = "complete";
  window.dispatchEvent(new Event("page-loaded"));
}
window.addEventListener("popstate", () => {
  Modal.open(document.getElementById("loading-modal"));
  loadPage();
});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();