async function loadPage () {
  "use strict";
  const now = new Date();
  document.getElementById("current-page").innerHTML = await (await fetch("/pages" + location.pathname, {
    method: "POST",
    body: JSON.stringify({
      timestamp: now.getTime()
    })
  })).text();
  modal.close();
}
window.addEventListener("popstate", () => {
  modal.open(document.getElementById("loading-modal"));
  loadPage();
});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPage);
else loadPage();