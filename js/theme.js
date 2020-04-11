"use strict";

const replaceStyle = (oldStyle, newStyle) => {
  newStyle.removeAttribute("media");
  oldStyle.rel = "preload";
  oldStyle.as = "style";
};

Object.defineProperties(window, {
  theme: {
    get: () => document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light"),
    set: value => {
      if (value !== "light" && value !== "dark") throw new Error(value + " is not a valid theme");
      if (value === window.theme) return;
      document.documentElement.setAttribute("data-theme", value);
      const style = document.getElementById(`${value}-stylesheet`);
      const oldStyle = document.getElementById(`${window.themeOpposite}-stylesheet`);
      const newStyleIsLoaded = style.sheet;
      if (!newStyleIsLoaded) style.addEventListener("load", () => replaceStyle(oldStyle, style));
      if (style.hasAttribute("media")) {
        oldStyle.removeAttribute("media");
      }
      style.rel = "stylesheet";
      style.removeAttribute("as");
      if (newStyleIsLoaded) replaceStyle(oldStyle, style);
    },
    enumerable: true
  },
  themeOpposite: {
    get: () => window.theme === "light" ? "dark" : "light",
    enumerable: true
  }
});