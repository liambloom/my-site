const openMenuContainer = document.getElementById("open-menu-container");

window.menu = {
  async open() {
    //console.log("pre-open");
    if (await this._transition(true)) this.pushDepth();
  },
  async close() {
    //console.log("pre-close");
    if (await this._transition(false)) {
      //console.log("resolved");
      try {
        console.log(menu.depth);
        if (menu.depth) history.go(-menu.depth);
        if (currentPage !== location.href) throw new Error("Menu cannot be closed if it was never opened"); // This will probably never run, as it only runs after use is redirected
        menu._depth = -1;
        menu.depth = 1;
      }
      catch (err) {
        handle(err);
      }
    }
  },
  _transition (forwards) {
    //console.log(this.isOpen, forwards);
    //console.log(new Error());
    if (this.isOpen === forwards) return Promise.resolve(false);
    else return new Promise(resolve => {
      //console.log(forwards ? "open" : "close");
      menu.element.addEventListener("transitionend", () => resolve());
      if (!this.isOpen && this.depth !== 1) handle(new Error("The error should never be thrown: The menu is closed but not at the top level"));
      document[(forwards ? "add" : "remove") + "EventListener"]("click", menu._closeOnClickOut);
      this.element.classList[forwards ? "add" : "remove"]("open");
    })
      .then(() => true);
  },
  toggle () {
    if (this.isOpen) this.close();
    else this.open();
  },
  initSubMenus (subMenu = this.listElement) {
    for (let li of subMenu.children) {
      if (li.getElementsByTagName("ul").length) {
        li.classList.add("menu");
        li.addEventListener("click", () => {
          if (menu.isOpen) {
            li.getElementsByTagName("ul")[0].classList.add("sub-open");
            menu.depth++;
            menu.pushDepth();
          }
        });
        this.initSubMenus(li);
      }
    }
  },
  pushDepth () {
    //console.log("pushed");
    const state = this.clearedState;
    if (menu.open) state.menuDepth = menu.depth;
    history.pushState(state, "");
  },
  updateMenuState () {
    if (history.state && history.state.menuDepth) {
      if (menu.depth !== (history.state && history.state.menuDepth)) {
        menu.depth = history.state.menuDepth;
      }
      return menu.open();
    }
    else {
      //menu._depth = (history.state && history.state.menuDepth) || 1;
      return menu.close()
        .then(() => {
          menu.depth = 1;
        });
    }
  },
  get clearedState () {
    const state = Object.apply({}, history.state);
    delete state.menuDepth;
    return state;
  },
  _closeOnClickOut (event) { 
    if (!menu.element.contains(event.target)) menu.close();
  },
  element: document.getElementsByTagName("nav")[0],
  get listElement () {
    return this.element.getElementsByTagName("ul")[0];
  },
  _depth: 1,
  get depth () {
    return this._depth;
  },
  set depth (value) {
    if (value === this.depth) return;
    if (value < 1) handle(new RangeError(`Menu depth cannot be set to ${value}, must be 1 or greater`));
    this._depth = value;
    for (let ul of Array.from(document.querySelectorAll("nav" + " ul".repeat(this.depth + 1) + ".sub-open"))) {
      ul.classList.remove("sub-open");
    }
    menu.listElement.style.right = (menu.depth - 1) * menu.listElement.clientWidth + "px";
  },
  get isOpen () {
    return this.element.classList.contains("open");
  }
};
for (let e in menu) {
  if (typeof menu[e] === "function") menu[e] = menu[e].bind(menu);
}
menu.initSubMenus();

openMenuContainer.addEventListener("click", event => {
  event.stopPropagation();
  //menu.pushDepth();
  menu.open();
});
document.getElementById("close-menu").parentNode.addEventListener("click", history.back.bind(history));