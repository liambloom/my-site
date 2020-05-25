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
      this.setHSL(current);
      this.setRGB(current);
      //this.value = current;
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
  get calcH () {
    return +(360 * parseFloat(hsKnob.style.left) / hsContainer.clientWidth).toFixed(1);
  },
  get calcS () {
    return +(100 - 100 * parseFloat(hsKnob.style.top) / hsContainer.clientHeight).toFixed(1);
  },
  get calcL () {
    return +lightness.value;
  },
  get value () {
    /*console.log(this.isOpen);
    console.log(parseFloat(hsKnob.style.left), 100 - 100 * parseFloat(hsKnob.style.top) / hsContainer.clientHeight).toFixed(1), lightness.value);*/
    try {
      return this.isOpen ? Color.rgb(+redTB.value, +greenTB.value, +blueTB.value) : null;
    }
    catch (err) {
      console.warn(err);
      return null;
    }
  },
  setHSL (h, s, l) {
    if (h instanceof Color) ({h, s, l} = h);
    h = Math.round(h);
    s = +s.toFixed(1);
    l = +l.toFixed(1);
    hsKnob.style.left = h / 360 * hsContainer.clientWidth + "px";
    hsKnob.style.top = (1 - s / 100) * hsContainer.clientHeight + "px";
    lightness.value = l;
    lightness.parentNode.style.backgroundImage = `linear-gradient(white, ${Color.hsl(h, 100, 50)}, black)`;
    hueTB.value = h;
    saturationTB.value = s;
    lightnessTB.value = l;
  },
  setRGB (r, g, b) {
    if (r instanceof Color) ({ r, g, b } = r);
    redTB.value = r = Math.round(r);
    greenTB.value = g = Math.round(g);
    blueTB.value = b = Math.round(b);
    const c = Color.rgb(r, g, b);
    hexTB.value = c.hex.slice(1);
    Modal.color.modal.getElementsByClassName("after")[0].style.backgroundColor = c;
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
const hueTB = document.getElementById("h-tb");
const saturationTB = document.getElementById("s-tb");
const lightnessTB = document.getElementById("l-tb");
const redTB = document.getElementById("r-tb");
const greenTB = document.getElementById("g-tb");
const blueTB = document.getElementById("b-tb");
const hexTB = document.getElementById("hex-tb");
const rgbTextboxes = [redTB, greenTB, blueTB];
const hslTextboxes = [hueTB, saturationTB, lightnessTB];
const regex100 = /^1?[0-9]{1,2}(?:\.[0-9])?$/;
const regex255 = /^(?:2(?:5[0-5]|[0-4][0-9])|[0-1]?[0-9]{1,2})$/;
const regex360 = /^(?:3(?:60|[0-5][0-9])|[0-2]?[0-9]{1,2})$/;
const hsMousemove = event => {
  if (event instanceof MouseEvent && event.buttons !== 1) return;
  const h = Math.max(0, Math.min(300, (event.clientX || event.touches[0].clientX) - hsContainer.getBoundingClientRect().x)) / hsContainer.clientWidth * 360;
  const s = (Math.max(0, Math.min(300, (event.clientY || event.touches[0].clientY) - hsContainer.getBoundingClientRect().y)) / hsContainer.clientHeight - 1) * -100;
  const l = +lightness.value;
  Modal.color.setHSL(h, s, l);
  Modal.color.setRGB(Color.hsl(h, s, l));
  /*hsKnob.style.left = x;
  hsKnob.style.top = y;*/
};
hsContainer.addEventListener("mousedown", hsMousemove);
hsContainer.addEventListener("mousemove", hsMousemove);
hsContainer.addEventListener("touchstart", hsMousemove);
hsContainer.addEventListener("touchmove", hsMousemove);
lightness.addEventListener("input", () => {
  const hsl = [Modal.color.calcH, Modal.color.calcS, Modal.color.calcL];
  Modal.color.setHSL(...hsl);
  Modal.color.setRGB(Color.hsl(...hsl));
});
for (let tb of rgbTextboxes.concat(hslTextboxes, [hexTB])) {
  tb.addEventListener("focus", () => {
    tb.prevValue = tb.value;
  });
}
for (let tb of rgbTextboxes) {
  tb.prevValue = 0;
  tb.addEventListener("input", () => {
    if (!tb.value.length) return;
    if (!regex255.test(tb.value)) {
      tb.value = tb.prevValue;
      return;
    }
    tb.prevValue = tb.value;
    const rgb = rgbTextboxes.map(e => parseFloat(e.value));
    Modal.color.setRGB(...rgb);
    Modal.color.setHSL(Color.rgb(...rgb));
  });
  tb.addEventListener("blur", () => {
    if (!regex255.test(tb.value)) tb.value = tb.prevValue;
  });
}
for (let tb of hslTextboxes) {
  tb.addEventListener("input", () => {
    if (!tb.value) return;
    if (tb.value.includes(".") && tb.value.match(/\./g).length === 1) {
      if (tb.value.match(/^\.|\.$/)) return;
    }
    if (!(tb === hueTB ? regex360 : regex100).test(tb.value)) {
      tb.value = tb.prevValue;
      return;
    }
    tb.prevValue = tb.value;
    const hsl = hslTextboxes.map(e => parseFloat(e.value));
    Modal.color.setHSL(...hsl);
    Modal.color.setRGB(Color.hsl(...hsl));
  });
  tb.addEventListener("blur", () => {
    if (!(tb === hueTB ? regex360 : regex100).test(tb.value)) tb.value = tb.prevValue;
    if (tb.value.includes(".") && tb.value.match(/\./g).length === 1) {
      if (tb.value.indexOf(".") === 0) tb.value = "0" + tb.value;
      else if (tb.value.indexOf(".") + 1 === tb.value.length) tb.value += "0";
    }
  });
}
hexTB.addEventListener("input", () => {
  if (!/^[0-9a-f]{0,6}$/i.test(hexTB.value)) hexTB.value = hexTB.prevValue;
  hexTB.prevValue = hexTB.value;
  if (hexTB.value.length !== 6) return;
  hexTB.prevValid = hexTB.value;
  const c = Color.hex("#" + hexTB.value);
  Modal.color.setRGB(c);
  Modal.color.setHSL(c);
});
hexTB.addEventListener("focus", () => {
  hexTB.prevValid = hexTB.value;
});
hexTB.addEventListener("blur", () => {
  if (hexTB.value.length !== 6) hexTB.value = hexTB.prevValid;
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