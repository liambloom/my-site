const openMenuContainer = document.getElementById("open-menu-container");

const closeMenu = event => {
  console.log("closeMenu");
  if (!menu.element.contains(event.target) && !openMenuContainer.contains(event.target)) menu.close();
};

window.menu = {
  get open() {
    return  this._transition.bind(this, true);
  },
  get close() {
    return this._transition.bind(this, false);
  },
  _transition (forwards) {
    document[(forwards ? "add" : "remove") + "EventListener"]("click", closeMenu);
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
  element: document.getElementsByTagName("nav")[0]
};
for (let e in menu) {
  if (typeof menu[e] === "function") menu[e] = menu[e].bind(menu);
}

openMenuContainer.addEventListener("click", menu.open);
document.getElementById("close-menu").parentNode.addEventListener("click", menu.close);