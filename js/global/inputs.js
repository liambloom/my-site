function initCustomInputs () {
  for (let boolInput of Array.from(document.querySelectorAll("div.switch:not([data-init])"))) {
    boolInput.setAttribute("data-init", "true");
    boolInput.addEventListener("click", () => {
      boolInput.classList.toggle("on");
    });
    Object.defineProperty(boolInput, "value", {
      get: () => boolInput.classList.contains("on"),
      set: function (value) {
        boolInput.classList[value ? "add" : "remove"]("on");
      }
    });
  }
}
initCustomInputs();