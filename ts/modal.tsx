import { Color } from "./Color.js";
import jsx from "./jsx.js";

declare global {
  interface Event {
    accepted: boolean;
  }
}


export class Modal { // Make this a class to make it easier to make modals
  constructor({text, buttons, closeOnBlur}: { text: string, buttons: "ok" | "ok/cancel", closeOnBlur: boolean }) {
    buttons = buttons || "ok";
    buttons.toLowerCase();
    if (typeof closeOnBlur !== "boolean") closeOnBlur = true;
    const modal = 
      <div className="modal popup" {...closeOnBlur ? "data-close-on-blur" : ""}>
        <div className="content">{text}</div>
          {
            buttons === "ok"
            ? <div className="bottom"><input type="button" value="OK" className="highlight" data-close /></div>
            : buttons === "ok/cancel"
            ? <div className="bottom">
                <input type="button" value="OK" className="highlight" data-close />
                <input type="button" value="Cancel" data-cancel />
              </div>
            : (() => { throw new Error(`Invalid button type "${buttons}". Valid types are: "ok", "ok/cancel"`); })()
          }
      </div>;
    document.body.appendChild(modal);
    return modal;
  }
  static open(e: string | Element) {
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
      button.removeEventListener("click", Modal.closeUnaccepted);
      button.addEventListener("click", Modal.closeUnaccepted);
    }
    for (let button of Array.from(e.querySelectorAll("[data-close]"))) {
      button.removeEventListener("click", Modal.closeAccepted);
      button.addEventListener("click", Modal.closeAccepted);
    }
    document.body.classList.add("blur");
    this.overlay.classList.remove("hidden");
    e.classList.add("open");
    e.dispatchEvent(new Event("opened"));
    this.scrollPosition = [scrollX, scrollY];
    document.addEventListener("scroll", this.scrollLock);
    const closeOnBlur = e.getAttribute("data-close-on-blur");
    if (closeOnBlur === "true" || closeOnBlur === "") this.overlay.addEventListener("click", this.closeListener);
  }
  static forceOpen (e: string | Element) {
    if (Modal.openModal) {
      Modal.queue.unshift(e, Modal.openModal);
      Modal.close();
    }
    else Modal.open(e);
  }
  static closeListener = close.bind(Modal, false);
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
    document.removeEventListener("scroll", this.scrollLock);
    this.overlay.removeEventListener("click", this.closeListener);
    if (this.queue.length) this.open(this.queue.shift());
  }
  private static scrollLock() {
    scrollTo(...Modal.scrollPosition);
  }
  static _noFocus(event) {
    if (!this.openModal.contains(event.target)) event.target.blur();
  }

  private static closeUnaccepted = Modal.close.bind(Modal, false);
  private static closeAccepted = Modal.close.bind(Modal, true);
  private static overlay = document.getElementById("modal-overlay");
  private static queue = [];
  private static scrollPosition: [number, number];
  public static loading = {
    start() {
      /*Modal.forceOpen(this.modal);*/
      /*main.style.opacity = 0;
      main.style.cursor = "wait";*/
    },
    end() {
      /*if (Modal.openModal === this.modal) Modal.close();
      Modal.queue = Modal.queue.filter(modal => modal !== this.modal);*/
      /*main.style.removeProperty("cursor");
      main.style.opacity = 1;*/
    },
    //modal: document.getElementById("loading-modal"),
    //isOpen: true
  }
  public static color = Color.modal;
  public static openModal: Element;
}

//Modal.scrollLock = Modal.scrollLock.bind(Modal);
Modal._noFocus = Modal._noFocus.bind(Modal);
Modal.close = Modal.close.bind(Modal);

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