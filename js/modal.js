"use strict";

window.modal = {
  open: e => {
    if (this.openModal) {
      console.warn(new Error("There is already a module open"));
      queue.push(e);
    }
    if (e instanceof String) e = e.toString();
    if (typeof e === "string") {
      e = document.getElementById(e) || document.querySelector(e);
    }
    else if (!(e instanceof HTMLElement)) new TypeError(`Modal must be of type String or HTMLElement, received type ${e.constructor.name}`);
    document.body.classList.add("blur");
    this.overlay.classList.remove("hidden");
    e.classList.remove("hidden");
    this.openModule = e;
  },
  close: () => {
    if (!this.openModal) {
      console.warn(new Error("There are no open modules"));
      return;
    }
    document.body.classList.add("blur");
    this.overlay.classList.remove("hidden");
    document.classList.remove("hidden");
    this.openModal.classList.add("hidden");
    this.openModal = undefined;
  },
  overlay: document.getElementById("modal-overlay"),
  queue: []
};
window.alert = function alert (text) {
  const popup = parseHTML(`
  <!-- HTML goes here -->
  `);
  document.body.appendChild(popup);
  modal.open(popup);
};