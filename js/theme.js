"use strict";

Object.defineProperties(window, {
  theme: {
    get: () => document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light"),
    set: value => {
      if (value !== "light" && value !== "dark") throw new Error(value + " is not a valid theme");
      if (value === document.documentElement.getAttribute("data-theme")) return;
      document.documentElement.setAttribute("data-theme", value);
      const mediaStyle = document.getElementById(value + "-stylesheet");
      if (mediaStyle) {
        mediaStyle.removeAttribute("media");
        document.getElementById(window.themeOpposite + "-stylesheet").remove();
      }
      else {
        const newStyle = document.createElement("link");
        newStyle.rel = "stylesheet";
        newStyle.href = `/css/theme/${value}.css`;
        newStyle.id = `${value}-stylesheet`;
        newStyle.addEventListener("load", () => {
          document.getElementById(`${window.themeOpposite}-stylesheet`).remove();
        });
        document.head.appendChild(newStyle);
      }
    },
    enumerable: true
  },
  themeOpposite: {
    get: () => window.theme === "light" ? "dark" : "light",
    enumerable: true
  }
});