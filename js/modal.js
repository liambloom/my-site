"use strict";

class Modal { // Make this a class to make it easier to make modals
  constructor({text, buttons, closeOnBlur}) {
    buttons = buttons || "ok";
    buttons.toLowerCase();
    if (typeof closeOnBlur !== "boolean") closeOnBlur = true;
    const modal = parseHTML(`
      <div class="modal popup" ${closeOnBlur ? "data-close-on-blur" : ""}>
        <div class="content">${text}</div>
        <div class="bottom">
          ${
            buttons === "ok"
              ? `<input type="button" value="OK" class="highlight">`
            : buttons === "ok/cancel"
              ? `<input type="button" value="OK" class="highlight"> <input type="button" value="Cancel">`
            : (() => { throw new Error(`Invalid button type "${buttons}". Valid types are: "ok", "ok/cancel"`); })()
          }
        </div>
      </div>
    `).children[0];
    document.body.appendChild(modal);
    return modal;
  }
  static open(e) {
    if (this.openModal) {
      console.warn(new Error("There is already a modal open"));
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
    e.dispatchEvent(new Event("opened"));
    this.scrollPosition = [scrollX, scrollY];
    document.addEventListener("scroll", this._scrollLock);
    const closeOnBlur = e.getAttribute("data-close-on-blur");
    if (closeOnBlur === "true" || closeOnBlur === "") this.overlay.addEventListener("click", this.close);
  }
  static close() {
    if (!this.openModal) {
      console.warn(new Error("There are no open modals"));
      return;
    }
    document.body.classList.remove("blur");
    this.overlay.classList.add("hidden");
    this.openModal.classList.remove("open");
    this.openModal.dispatchEvent(new Event("closed"));
    this.openModal = undefined;
    document.removeEventListener("scroll", this._scrollLock);
    this.overlay.removeEventListener("click", this.close);
    if (this.queue.length) this.open(this.queue.shift());
  }
  static _scrollLock() {
    scrollTo(...this.scrollPosition);
  }
  static _noFocus(event) {
    if (!this.openModal.contains(event.target)) event.target.blur();
  }
}
Modal._scrollLock = Modal._scrollLock.bind(Modal);
Modal._noFocus = Modal._noFocus.bind(Modal);
Modal.close = Modal.close.bind(Modal);
Modal.overlay = document.getElementById("modal-overlay");
Modal.queue = [];
Modal.openModal = document.getElementById("loading-modal");
Modal.loading = {
  start () {
    if (Modal.openModal) {
      Modal.queue.unshift(this.modal, Modal.openModal);
      Modal.close();
    }
    else Modal.open(this.modal);
  },
  end () {
    if (Modal.openModal === this.modal) Modal.close();
    Modal.queue = Modal.queue.filter(modal => modal !== this.modal);
  },
  modal: document.getElementById("loading-modal"),
  isOpen: true
};
window.Modal = Modal;
function alert (text) {
  const modal = new Modal({ text: text.replace(/<(?!br>)/g, "&lt;") });
  Modal.open(modal);
  modal.querySelector('input[type="button"]').addEventListener("click", Modal.close);
  return new Promise(resolve => {
    modal.addEventListener("close", () => {
      resolve(undefined);
    });
  });
};
 function confirm (text) {
  const modal = new Modal({
    text: text.replace(/<(?!br>)/g, "&lt;"),
    buttons: "ok/cancel",
    closeOnBlur: false
  });
  Modal.open(modal);
  for (let button of Array.from(modal.querySelectorAll('input[type="button"]'))) {
    button.addEventListener("click", Modal.close);
  }
  return new Promise(resolve => {
    modal.querySelector('input[value="OK"]').addEventListener("click", () => {
      resolve(true);
    });
    modal.querySelector('input[value="Cancel"]').addEventListener("click", () => {
      resolve(false);
    });
  });
};
function confirm (text) {
  const modal = new Modal({
    text: `${text.replace(/<(?!br>)/g, "&lt;")}<br><input type="text">`,
    buttons: "ok/cancel"
  });
  Modal.open(modal);
  for (let button of Array.from(modal.querySelectorAll('input[type="button"]'))) {
    button.addEventListener("click", Modal.close);
  }
  return new Promise(resolve => {
    modal.querySelector('input[value="OK"]').addEventListener("click", () => {
      resolve(modal.querySelector('input[type="text"]').value);
    });
    modal.querySelector('input[value="Cancel"]').addEventListener("click", () => {
      resolve(null);
    });
    Modal.overlay.addEventListener("click", () => {
      resolve(null);
    });
  });
};