"use strict";

window.modal = { // Make this a class to make it easier to make modals
  open: function (e) {
    if (this.openModal) {
      console.warn(new Error("There is already a module open"));
      this.queue.push(e);
      return;
    }
    if (e instanceof String) e = e.toString();
    if (typeof e === "string") {
      e = document.getElementById(e) || document.querySelector(e);
    }
    else if (!(e instanceof HTMLElement)) new TypeError(`Modal must be of type String or HTMLElement, received type ${e.constructor.name}`);
    this.openModal = e;
    document.body.classList.add("blur");
    this.overlay.classList.remove("hidden");
    e.classList.add("open");
    this.scrollPosition = [scrollX, scrollY];
    this._scrollLock = this._scrollLock.bind(this);
    document.addEventListener("scroll", this._scrollLock);
  },
  close: function () {
    if (!this.openModal) {
      console.warn(new Error("There are no open modules"));
      return;
    }
    document.body.classList.remove("blur");
    this.overlay.classList.add("hidden");
    this.openModal.classList.remove("open");
    this.openModal = undefined;
    document.removeEventListener("scroll", this._scrollLock);
    if (this.queue.length) this.open(this.queue.shift());
  },
  overlay: document.getElementById("modal-overlay"),
  queue: [],
  openModal: document.getElementById("loading-modal"),
  _scrollLock: function () {
    scrollTo(...this.scrollPosition);
  }
};
window.alert = function alert (text) {
  const popup = parseHTML(`
  <!-- HTML goes here -->
  `);
  document.body.appendChild(popup);
  modal.open(popup);
};