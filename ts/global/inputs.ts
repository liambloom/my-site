"use strict";

function initInputLabel (input) {
  if (!input.id) {
    let id;
    do id = "element-" + Math.random() * 1e18;
    while (document.getElementById(id));
    input.id = id;
  }
  if (!input.labels.length) {
    const label = document.createElement("label");
    label.setAttribute("for", input.id);
    input.parentNode.insertAfter(label, input);
  }
  if (input.labels.length !== 1) throw new Error(`A ${input.type} input cannot have multiple labels`);
  if (input.labels[0] !== input.nextElementSibling) throw new Error(`The label for a ${input.type} input must be directly after the input in order for the css to apply`);
}
export function init() {
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
    initInputLabel(input);
    input.addEventListener("click", async event => {
      event.preventDefault();
      const color = await Modal.color.getColor(new Color(input.value));
      input.value = color.hex;
      input.dispatchEvent(new Event("change"));
    });
    const onchange = () => {
      input.labels[0].style.backgroundColor = input.value;
    };
    input.addEventListener("change", onchange);
    onchange();
  }
  if (document.querySelector('label input[type="radio"]:not([data-native])')) throw new SyntaxError("Radio input cannot go inside of label, it causes problems for the css");
  if (document.querySelector('input[type="radio"][data-native].custom')) throw new Error("A radio input cannot be [data-native] and .custom");
  for (let input of Array.from(document.querySelectorAll('input[type="radio"]:not([data-init]):not([data-native])'))) {
    input.setAttribute("data-init", "true");
    initInputLabel(input);
  }
}
initCustomInputs();