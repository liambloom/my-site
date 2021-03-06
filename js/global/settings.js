const enterSettings = document.getElementById("enter-settings");
var settings = document.getElementById("settings");

enterSettings.addEventListener("click", event => {
  if (enterSettings === event.target) {
    menu.depth++;
    menu._invisablify();
    menu.pushDepth();
    setImmediate(() => settings.classList.add("sub-open"));
  }
});

for (let input of Array.from(document.getElementsByName("theme"))) {
  input.addEventListener("change", () => {
    theme = input.value;
  });
}
emphasisInput.addEventListener("change", () => {
  emphasisColor = emphasisInput.value;
});
emphasisInput.value = emphasisColor.hex;
if (emphasisInput.value !== emphasisInput.labels[0].style.backgroundColor) emphasisInput.dispatchEvent(new Event("change"));