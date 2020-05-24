"use strict";

function initCustomInputs () {
  for (let input of Array.from(document.querySelectorAll("div.switch:not([data-init])"))) { // switches
    input.setAttribute("data-init", "true");
    input.addEventListener("click", () => {
      input.classList.toggle("on");
    });
    Object.defineProperty(input, "value", {
      get: () => input.classList.contains("on"),
      set: function (value) {
        input.classList[value ? "add" : "remove"]("on");
      }
    });
  }
  for (let input of Array.from(document.querySelectorAll('input[type="color"]:not([data-init]):not([data-native])'))) { // color inputs
    input.setAttribute("data-init", "true");
    input.addEventListener("click", async event => {
      event.preventDefault();
      const color = await Modal.color.getColor(new Color(input.value));
      console.log(color);
      input.value = color.hex;
      input.dispatchEvent(new Event("change"));
    });
  }
}
initCustomInputs();