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
              ? `<input type="button" value="OK" class="highlight" data-close>`
            : buttons === "ok/cancel"
              ? `<input type="button" value="OK" class="highlight" data-close><input type="button" value="Cancel" data-cancel>`
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
    for (let button of Array.from(e.querySelectorAll("[data-cancel]"))) {
      button.removeEventListener("click", Modal._closeUnaccepted);
      button.addEventListener("click", Modal._closeUnaccepted);
    }
    for (let button of Array.from(e.querySelectorAll("[data-close]"))) {
      button.removeEventListener("click", Modal._closeAccepted);
      button.addEventListener("click", Modal._closeAccepted);
    }
    document.body.classList.add("blur");
    this.overlay.classList.remove("hidden");
    e.classList.add("open");
    e.dispatchEvent(new Event("opened"));
    this.scrollPosition = [scrollX, scrollY];
    document.addEventListener("scroll", this._scrollLock);
    const closeOnBlur = e.getAttribute("data-close-on-blur");
    if (closeOnBlur === "true" || closeOnBlur === "") this.overlay.addEventListener("click", this.close);
  }
  static forceOpen (e) {
    if (Modal.openModal) {
      Modal.queue.unshift(e, Modal.openModal);
      Modal.close();
    }
    else Modal.open(e);
  }
  static close (accepted = false) {
    if (!this.openModal) {
      console.warn(new Error("There are no open modals"));
      return;
    }
    const preEvent = new Event("preclose");
    preEvent.accepted = accepted;
    this.openModal.dispatchEvent(preEvent);
    document.body.classList.remove("blur");
    this.overlay.classList.add("hidden");
    this.openModal.classList.remove("open");
    const event = new Event("close");
    event.accepted = accepted;
    this.openModal.dispatchEvent(event);
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
Modal._closeUnaccepted = Modal.close.bind(Modal, false);
Modal._closeAccepted = Modal.close.bind(Modal, true);
Modal.overlay = document.getElementById("modal-overlay");
Modal.queue = [];
Modal.openModal = document.getElementById("loading-modal");

Modal.loading = {
  start () {
    Modal.forceOpen(this.modal);
  },
  end () {
    if (Modal.openModal === this.modal) Modal.close();
    Modal.queue = Modal.queue.filter(modal => modal !== this.modal);
  },
  modal: document.getElementById("loading-modal"),
  isOpen: true
};
Modal.color = {
  getColor (current = "hsl(0, 0, 100)") {
    try {
      if (Modal.openModal) throw new Error("Cannot ask for two colors at once");
      //if (!/^\s*hsl\(\s*(?:360|3[0-5]\d|[0-2]?\d{1,2})\s*(?:,\s*(?:100|\d{1,2})\s*){2}\)\s*$/.test(current)) throw new Error("The current color must be a valid hsl color function");
      Modal.color.open();
      current = new Color(current);
      this.value = current;
      //const { h, s, l } = current;
      //console.log(h, s, l);
      this.modal.getElementsByClassName("before")[0].style.backgroundColor = current;
      return new Promise(resolve => {
        Modal.color.modal.addEventListener("preclose", ({accepted}) => {
          resolve(accepted ? Modal.color.value : current);
        });
      });
    }
    catch (err) {
      handle(err);
    }
  },
  open () {
    Modal.open(this.modal);
  },
  get isOpen () {
    return Modal.openModal === this.modal;
  },
  get calculatedValue () {
    /*console.log(this.isOpen);
    console.log(parseFloat(hsKnob.style.left), 100 - 100 * parseFloat(hsKnob.style.top) / hsContainer.clientHeight).toFixed(1), lightness.value);*/
    try {
      return this.isOpen ? Color.hsl(+(360 * parseFloat(hsKnob.style.left) / hsContainer.clientWidth).toFixed(1), +(100 - 100 * parseFloat(hsKnob.style.top) / hsContainer.clientHeight).toFixed(1), +lightness.value) : null;
    }
    catch (err) {
      console.warn(err);
      return null;
    }
  },
  get value () {
    return this._value;
  },
  set value (color) {
    color = new Color(color);
    //console.log(color.hsl);
    this._value = color;
    this._value.onchange = function () {
      const cv = Modal.color.calculatedValue;
      console.log(this.hsl, cv && cv.hsl);
      if (cv && Color.hsl(this.h, cv.s, cv.l).h !== cv.h) hsKnob.style.left = this.h / 360 * hsContainer.clientWidth + "px";
      if (cv && Color.hsl(cv.h, this.s, cv.l).s !== cv.s) hsKnob.style.top = (1 - this.s / 100) * hsContainer.clientHeight + "px";
      if (cv && Color.hsl(cv.h, cv.s, this.l).l !== cv.l) lightness.value = this.l;
      lightness.parentNode.style.backgroundImage = `linear-gradient(white, ${Color.hsl(this/*.value*/.h, 100, 50)}, black)`;
      Modal.color.modal.getElementsByClassName("after")[0].style.backgroundColor = this;
    };
    this._value._changed();
  },
  modal: document.getElementById("color-picker")
};

/*for (let input of Array.from(document.querySelectorAll('input[type="color"]:not([data-native])'))) {
  input.addEventListener("click", async event => {
    event.preventDefault();
    const color = await Modal.color.getColor(new Color(input.value));
    console.log(color);
    input.value = color.hex;
    input.dispatchEvent(new Event("change"));
  });
}*/
const hsContainer = document.getElementById("hue-saturation");
const hsKnob = hsContainer.getElementsByTagName("div")[0];
const lightness = document.getElementById("lightness");
const hsMousemove = event => {
  if (event instanceof MouseEvent && event.buttons !== 1) return;
  const x = Math.max(0, Math.min(300, (event.clientX || event.touches[0].clientX) - hsContainer.getBoundingClientRect().x)) + "px";
  const y = Math.max(0, Math.min(300, (event.clientY || event.touches[0].clientY) - hsContainer.getBoundingClientRect().y)) + "px";
  hsKnob.style.left = x;
  hsKnob.style.top = y;
  Modal.color.value = Modal.color.calculatedValue;
  /*hsKnob.style.left = x;
  hsKnob.style.top = y;*/
};
hsContainer.addEventListener("mousedown", hsMousemove);
hsContainer.addEventListener("mousemove", hsMousemove);
hsContainer.addEventListener("touchstart", hsMousemove);
hsContainer.addEventListener("touchmove", hsMousemove);
lightness.addEventListener("input", () => {
  Modal.color.value.l = parseFloat(lightness.value);
});

Color.modal = Modal.color;
window.Modal = Modal;

function alert (text, force = false) {
  const modal = new Modal({ text: text.replace(/<(?!br>)/g, "&lt;") });
  Modal[force ? "forceOpen" : "open"](modal);
  return new Promise(resolve => {
    modal.addEventListener("close", () => {
      resolve(undefined);
    });
  });
}
function confirm (text, force = false) {
  const modal = new Modal({
    text: text.replace(/<(?!br>)/g, "&lt;"),
    buttons: "ok/cancel",
    closeOnBlur: false
  });
  Modal[force ? "forceOpen" : "open"](modal);
  return new Promise(resolve => {
    modal.addEventListener("close", ({accepted}) => {
      resolve(!!accepted);
    });
  });
}
function prompt (text, force = false) {
  const modal = new Modal({
    text: `${text.replace(/<(?!br>)/g, "&lt;")}<br><input type="text">`,
    buttons: "ok/cancel"
  });
  Modal[force ? "forceOpen" : "open"](modal);
  return new Promise(resolve => {
    modal.addEventListener("close", ({accepted}) => {
      resolve(accepted ? modal.querySelector('input[type="text"]').value : null);
    });
  });
}