import { Color } from "./Color.js";
import jsx from "./jsx.js";

declare global {
  interface Event {
    accepted: boolean;
  }
}

export function newModal({text, buttons, closeOnBlur}: { text: string, buttons?: "ok" | "ok/cancel", closeOnBlur?: boolean }): HTMLDivElement {
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
  return modal as unknown as HTMLDivElement;
}
export function open(e: string | Element | null): void {
  if (openModal) {
    console.warn(new Error("There is already a modal open"));
    queue.push(e!);
    return;
  }
  if (e instanceof String) e = e.toString();
  if (typeof e === "string") {
    e = document.getElementById(e) || document.querySelector(e);
  }
  if (!(e instanceof HTMLElement)) new TypeError(`Modal must be of type String or HTMLElement, received type ${e == null ? "null" : e.constructor.name}`);
  openModal = e!;
  for (let button of Array.from(e!.querySelectorAll("[data-cancel]"))) {
    button.removeEventListener("click", closeUnaccepted);
    button.addEventListener("click", closeUnaccepted);
  }
  for (let button of Array.from(e!.querySelectorAll("[data-close]"))) {
    button.removeEventListener("click", closeAccepted);
    button.addEventListener("click", closeAccepted);
  }
  document.body.classList.add("blur");
  overlay.classList.remove("hidden");
  e!.classList.add("open");
  e!.dispatchEvent(new Event("opened"));
  scrollPosition = [scrollX, scrollY];
  document.addEventListener("scroll", scrollLock);
  document.addEventListener("focus", noFocus);
  const closeOnBlur = e!.getAttribute("data-close-on-blur");
  if (closeOnBlur === "true" || closeOnBlur === "") overlay.addEventListener("click", close as () => void);
}
export function forceOpen(e: string | Element) {
  if (openModal) {
    queue.unshift(e, openModal);
    close();
  }
  else open(e as (string | Element));
}
export function close(accepted = false) {
  if (!openModal) {
    console.warn(new Error("There are no open modals"));
    return;
  }

  const preEvent = new Event("preclose");
  preEvent.accepted = accepted;
  openModal.dispatchEvent(preEvent);
  document.body.classList.remove("blur");
  overlay.classList.add("hidden");
  openModal.classList.remove("open");
  const event = new Event("close");
  event.accepted = accepted;
  openModal.dispatchEvent(event);
  openModal = undefined;
  document.removeEventListener("scroll", scrollLock);
  document.removeEventListener("focus", noFocus);
  overlay.removeEventListener("click", close as () => void);
  if (queue.length) open(queue.shift()!);
}
function scrollLock() {
  scrollTo(...scrollPosition);
}
function noFocus(event: Event) {
  if (!openModal!.contains(event.target as Node)) 
    (event.target as HTMLElement).blur();
}

const closeUnaccepted: () => void = close.bind(false);
const closeAccepted: () => void = close.bind(true);
const overlay = document.getElementById("modal-overlay")!;
const queue: (string | Element)[] = [];
let scrollPosition: [number, number];
export const color = Color.modal;
export let openModal: Element | undefined;

export function alert(text: string, force = false) {
  const modal = newModal({ text: text.replace(/<(?!br>)/g, "&lt;") });
  (force ? forceOpen : open)(modal);
  return new Promise(resolve => {
    modal.addEventListener("close", () => {
      resolve(undefined);
    });
  });
}
export function confirm(text: string, force = false) {
  const modal = newModal({
    text: text.replace(/<(?!br>)/g, "&lt;"),
    buttons: "ok/cancel",
    closeOnBlur: false
  });
  (force ? forceOpen : open)(modal);
  return new Promise(resolve => {
    modal.addEventListener("close", ({accepted}) => {
      resolve(!!accepted);
    });
  });
}
export function prompt(text: string, force = false) {
  const modal = newModal({
    text: `${text.replace(/<(?!br>)/g, "&lt;")}<br><input type="text">`,
    buttons: "ok/cancel"
  });
  (force ? forceOpen : open)(modal);
  return new Promise(resolve => {
    modal.addEventListener("close", ({accepted}) => {
      resolve(accepted ? (modal.querySelector('input[type="text"]') as HTMLInputElement).value : null);
    });
  });
}