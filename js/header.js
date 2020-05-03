window.menu = {
  get open() {
    return  this._transition.bind(this, true);
  },
  get close() {
    return this._transition.bind(this, false);
  },
  _transition (forwards) {
    this.element.classList[forwards ? "add" : "remove"]("open");
    for (let rect of Array.from(document.getElementById("open-menu").getElementsByTagName("rect"))) {
      for (let animation of rect.querySelectorAll(`[data-direction="${forwards ? "forwards" : "backwards"}"]`)) {
        animation.beginElement();
        setTimeout(animation.endElement.bind(animation), 500);
      }
    }
  },
  toggle () {
    if (this.element.classList.contains("open")) this.close();
    else this.open();
  },
  element: document.getElementById("menu")
};
for (let e in menu) {
  if (typeof menu[e] === "function") menu[e] = menu[e].bind(menu);
}

document.getElementById("open-menu-container").addEventListener("click", menu.toggle);