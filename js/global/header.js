// The menu isn't perfect, but I spent way too long on it, and it works good enough

const openMenuContainer = document.getElementById("open-menu-container");

var menu = {
  async open() {
    if (await this._transition(true)) this.pushDepth();
  },
  async close() {
    this.forceClosed = true;
    if (await this._transition(false)) {
      try {
        const depth = history.state && history.state.menuDepth || 0;
        if (depth) history.go(-depth);
        history.replaceState(this.clearedState, "");
        if (currentPage !== location.href) throw new Error("Menu cannot be closed if it was never opened"); // This will probably never run, as it only runs after use is redirected
        menu._depth = -1;
        menu.depth = 1;
      }
      catch (err) {
        handle(err);
      }
    }
    await setImmediateAsync(() => {
      this.forceClosed = false;
    });
  },
  _transition (forwards) {
    if (this.isOpen === forwards) return Promise.resolve(false);
    else return new Promise(resolve => {
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
      const liSubMenu = li.getElementsByTagName("ul")[0];
      if (li.getElementsByTagName("ul").length) {
        li.classList.add("menu");
        li.addEventListener("click", event => {
          event.stopPropagation();
          menu.depth++;
          liSubMenu.classList.add("sub-open");
          menu.pushDepth();
        });
        if (liSubMenu) this.initSubMenus(liSubMenu);
      }
      else {
        li.addEventListener("click", event => {
          event.stopPropagation();
        });
      }
    }
  },
  pushDepth () {
    const state = this.clearedState;
    if (menu.open) state.menuDepth = menu.depth;
    history.pushState(state, "");
  },
  async updateMenuState () {
    if (this.forceClosed && history.state && history.state.menuDepth) history.replaceState(this.clearedState, "");
    if (history.state && history.state.menuDepth) {
      if (menu.depth !== (history.state && history.state.menuDepth)) menu.depth = history.state.menuDepth;
      await menu.open();
    }
    else await menu.close();
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
  listContainer: document.getElementById("lists"),
  _depth: 1,
  get depth () {
    return this._depth;
  },
  set depth (value) {
    const prev = this.depth;
    if (value === this.depth) return;
    if (value < 1) handle(new RangeError(`Menu depth cannot be set to ${value}, must be 1 or greater`));
    this._depth = value;
    if (value < prev) setTimeout(this._invisablify, 500);
    else this._invisablify();
    menu.listContainer.style.right = (menu.depth - 1) * menu.listContainer.clientWidth + "px";
  },
  _invisablify () {
    if (new Error().stack.includes("loadPage")) return;
    const uls = Array.from(document.querySelectorAll("#lists > ul" + " > li > ul".repeat(this.depth - 1) + ".sub-open"));
    if (this.depth === 2 && settings.classList.contains("sub-open")) uls.push(settings);
    for (let ul of uls) ul.classList.remove("sub-open");
  },
  get isOpen () {
    return this.element.classList.contains("open");
  },
  forceClosed: false
};
for (let e in menu) {
  if (typeof menu[e] === "function") menu[e] = menu[e].bind(menu);
}
menu.initSubMenus();

openMenuContainer.addEventListener("click", event => {
  event.stopPropagation();
  menu.open();
});
document.getElementById("close-menu").parentNode.addEventListener("click", history.back.bind(history));