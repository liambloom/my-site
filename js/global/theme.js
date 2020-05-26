"use strict";

var emphasisInput = document.getElementById("emphasis-input");

Object.defineProperties(window, {
  theme: {
    get: () => document.documentElement.getAttribute("data-theme"),
    set: value => {
      if (value === "auto") value = themeAuto;
      type.check(value, "light", "dark");
      if (value === document.documentElement.getAttribute("data-theme")) return;
      document.documentElement.setAttribute("data-theme", value);
      const mediaStyle = document.getElementById(value + "-stylesheet");
      if (mediaStyle) {
        mediaStyle.removeAttribute("media");
        document.getElementById(themeOpposite + "-stylesheet").remove();
      }
      else {
        const newStyle = document.createElement("link");
        newStyle.rel = "stylesheet";
        newStyle.href = `/css/theme/${value}.css`;
        newStyle.id = `${value}-stylesheet`;
        newStyle.addEventListener("load", () => {
          document.getElementById(`${themeOpposite}-stylesheet`).remove();
        });
        document.head.appendChild(newStyle);
      }
    },
    enumerable: true
  },
  themeOpposite: {
    get: () => theme === "light" ? "dark" : "light",
    enumerable: true
  },
  themeAuto: {
    get: () => matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light",
    enumerable: true
  },
  emphasisColor: {
    get: () => new Color(getComputedStyle(root).getPropertyValue("--emphasis").trim()),
    set: value => {
      value = new Color(value).hex;
      root.style.setProperty("--emphasis", value);
      emphasisInput.value = value;
    },
    enumerable: true
  }
});
if (document.documentElement.getAttribute("data-theme") === null) document.documentElement.setAttribute("data-theme", themeAuto);
for (let input of Array.from(document.getElementsByName("theme"))) {
  input.addEventListener("change", () => {
    theme = input.value;
  });
}
emphasisInput.addEventListener("change", () => {
  emphasisColor = emphasisInput.value;
});
emphasisInput.value = emphasisColor.hex;