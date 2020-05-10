const openMenuContainer = document.getElementById("open-menu-container");

window.menu = {
  open() {
    console.log("pre-open");
    return this._transition(true);
  },
  async close() {
    console.log("pre-close");
    console.log(new Error());
    await this._transition(false);
    while (history.state.menuDepth) {
      console.log(history.state.menuDepth);
      history.back();
    }
    menu.depth = 1;
  },
  _transition (forwards) {
    console.log(this.isOpen, forwards);
    if (this.isOpen === forwards) return Promise.resolve();
    else return new Promise(resolve => {
      console.log(forwards ? "open" : "close");
      menu.element.addEventListener("transitionend", () => resolve());
      if (this.isOpen && this.depth !== 1) handle(new Error("The error should never be thrown: The menu is open but not at the top level"));
      document[(forwards ? "add" : "remove") + "EventListener"]("click", menu._closeOnClickOut);
      this.element.classList[forwards ? "add" : "remove"]("open");
    });
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
            menu.depth++;
            menu.pushDepth();
          }
        });
        this.initSubMenus(li);
      }
    }
  },
  pushDepth () {
    const state = history.state || {};
    delete state.menuDepth;
    if (menu.open) state.menuDepth = menu.depth;
    history.pushState(state, "");
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
  menu.pushDepth();
  menu.open();
});
document.getElementById("close-menu").parentNode.addEventListener("click", history.back.bind(history));