const enterSettings = document.getElementById("enter-settings");
var settings = document.getElementById("settings");

enterSettings.addEventListener("click", event => {
  if (enterSettings === event.target) {
    menu.depth++;
    menu.pushDepth();
    setImmediate(() => settings.classList.add("sub-open"));
  }
});