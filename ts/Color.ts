import * as modal from "./modal";
import { handle } from "./globals";

const key = Symbol("ext");

interface Indexable {
  [key: string]: any;
}

interface ColorModal {
  getColor(current: Color | string): Promise<Color>;
  open(): void;
  isOpen: boolean;
  calcH: number;
  calcS: number;
  calcL: number;
  value: Color | null;
  setHSL(color: Color): void;
  setHSL(h: number, s: number, l: number): void;
  setRGB(color: Color): void;
  setRGB(h: number, s: number, l: number): void;
  modal: HTMLElement
}

export class Color {
  constructor(arg: Symbol | string | Color) {
    let r, g, b, a; // These are not used, but they need to be declared in order for the cool&compact one liner on line 11 to work
    if (arg === key) 
      return; // This means that the necessary vars will be set by an external function
    else if (arg instanceof Symbol)
      throw new TypeError("Expected string, received type Symbol");
    else if (arg instanceof Color) return Color.rgba(...(Object.values({ r, g, b, a } = arg) as [number, number, number, number]));
    else if (/^\s*(?:rgb|hsl)/.test(arg)) {
      if (!/^\s*(?:rgb(?=[^(]*\(\s*(?:(?:25[0-5]|2[0-4]\d|[0-1]?\d{1,2})\D+){3})|hsl(?=[^(]*\(\s*(?:360|3[0-5]\d|[0-2]?\d{1,2})(?:\D+(?:100|\d{1,2})(?!\d)){2}))(?:a\s*\((?=(?:[^,]*,){3}[^,]*$)|\s*\((?=(?:[^,]*,){2}[^,]*$))(?:\s*\d+\s*(?:,(?!\s*\))|(?=\s*\)))\s*){3}(?:[0-1](?:\.0*)?|0?\.\d*)?\s*\)$/i.test(arg))
        throw new Error("Badly formatted rgb(a)/hsl(a) color function");
      return ((Color as Indexable)[arg.split("(")[0].toLowerCase().trim()] as ((arg0: number, arg1: number, arg2: number, arg3?: number) => Color))(...(arg.match(/\(.*?\)/)![0].slice(1, -1).split(/,/g).map(e => parseFloat(e)) as [number, number, number, number?]));
    }
    else if (arg[0] === "#") return Color.hex(arg);
    else throw new Error("Expected format rgb, rgba, hsl, hsla, or 3, 4, 6, or 8 digit hex code");
    
  }
  private changed() {
    if (typeof this.onchange === "function") this.onchange.call(this);
  }
  toString () {
    return this.hex;
  }
  get r() { // red
    return this._r;
  }
  set r(value: number) {
    checkRange(value, 0, 255);
    this._r = value;
    this.changed();
  }
  get g() { // green
    return this._g;
  }
  set g(value: number) {
    checkRange(value, 0, 255);
    this._r = value;
    this.changed();
  }
  get b() { // blue
    return this._b;
  }
  set b(value: number) {
    checkRange(value, 0, 255);
    this._r = value;
    this.changed();
  }
  get a() { // alpha
    return this._a;
  }
  set a(value: number) {
    checkRange(value, 0, 1);
    this._r = value;
    this.changed();
  }
  get h() { // hue
    return (((Math.round((this.max === this.r ? (this.g - this.b) / this.delta % 6 : this.max === this.g ? (this.b - this.r) / this.delta + 2 : (this.r - this.g) / this.delta + 4) * 60) || 0) + 360) % 360);
  }
  set h(value: number) {
    const n = Color.hsl(value, this.s, this.l);
    this.r = n.r;
    this.g = n.g;
    this.b = n.b;
    this.changed();
  }
  get s() { // saturation
    return !(this.lRaw % 1) ? 0 : +(this.delta / 2.55 / (1 - Math.abs(2 * this.lRaw - 1))).toFixed(1);
  }
  set s(value: number) {
    const n = Color.hsl(this.h, value, this.l);
    this.r = n.r;
    this.g = n.g;
    this.b = n.b;
    this.changed();
  }
  private get lRaw() {
    return (this.max + this.min) / 510;
  }
  get l() { // lightness
    return +(100 * this.lRaw).toFixed(1);
  }
  set l(value: number) {
    const n = Color.hsl(this.h, this.s, value);
    console.log(n);
    this._r = n.r;
    this._g = n.g;
    this._b = n.b;
    this.changed();
  }
  private get min () {
    return Math.min(this.r, this.g, this.b);
  }
  private get max () {
    return Math.max(this.r, this.g, this.b);
  }
  private get delta () {
    return this.max - this.min;
  }
  get rgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
  get rgba() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
  get hsl() {
    return `hsl(${this.h}, ${this.s}, ${this.l})`;
  }
  get hsla() {
    return `hsla(${this.h}, ${this.s}, ${this.l}, ${this.a})`;
  }
  get hex() {
    return `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`;
  }
  get hexAlpha() {
    return this.hex + this.a.toString(16);
  }
  static rgb(r: number, g: number, b: number) {
    return this.rgba(r, g, b, 1);
  }
  static rgba(r: number, g: number, b: number, a: number) {
    for (let c of [r, g, b]) {
      if (c % 1) throw new TypeError("Each color value (r, g, b) must be a whole number");
      checkRange(c, 0, 255);
    }
    checkRange(a, 0, 1);
    const color = new this(key);
    color._r = r;
    color._g = g;
    color._b = b;
    color._a = a;
    return color;
  }
  static hsl(h: number, s: number, l: number) {
    return this.hsla(h, s, l, 1);
  }
  static hsla(h: number, s: number, l: number, a: number) {
    checkRange(h, 0, 360);
    checkRange(s, 0, 100);
    checkRange(l, 0, 100);

    let r: number, g: number, b: number;
    h %= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    switch (Math.floor(h / 60)) {
      case 0:
        r = c; g = x; b = 0;
        break;
      case 1:
        r = x; g = c; b = 0;
        break;
      case 2:
        r = 0; g = c; b = x;
        break;
      case 3:
        r = 0; g = x; b = c;
        break;
      case 4:
        r = x; g = 0; b = c;
        break;
      case 5:
        r = c; g = 0; b = x;
        break;
    }

    return Color.rgba(Math.round((r! + m) * 255), Math.round((g! + m) * 255), Math.round((b! + m) * 255), a);
  }
  static hex(hex: string) {
    if (hex[0] !== "#") throw new Error("Hex codes must start with a \"#\" symbol");
    hex = hex.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      let newHex = "";
      for (let c of hex) newHex += c.repeat(2);
      hex = newHex;
    }
    if (hex.length === 6) hex += "ff";
    if (hex.length !== 8) throw new Error(`Hex codes must be 3, 4, 6, or 8 characters long. Received hex code that was ${hex.length} long.`);
    if (!/^[0-9a-f]{8}$/i.test(hex)) throw new Error(`Hex codes can only contain the characters 0-9 and A-F`);
    const split = [];
    for (let i = 0; i < 4; i++) split.push(hex.substr(i * 2, 2));
    return this.rgba(...(split.slice(0, 3).map(e => parseInt(e, 16)) as [number, number, number]), parseInt(split[3], 16) / 0xff);
  }
  static random () {
    return Color.hex("#" + Math.floor(Math.random() * 0x1000000).toString(16));
  }
  _r!: number;
  _g!: number;
  _b!: number;
  _a!: number;
  onchange?: (this: Color) => void;

  static modal: ColorModal = {
    getColor(current: Color | string = "hsl(0, 0, 100)"): Promise<Color> {
      try {
        if (modal.openModal) throw new Error("Cannot ask for two colors at once");
        //if (!/^\s*hsl\(\s*(?:360|3[0-5]\d|[0-2]?\d{1,2})\s*(?:,\s*(?:100|\d{1,2})\s*){2}\)\s*$/.test(current)) throw new Error("The current color must be a valid hsl color function");
        Color.modal.open();
        current = new Color(current);
        this.setHSL(current);
        this.setRGB(current);
        //this.value = current;
        //const { h, s, l } = current;
        //console.log(h, s, l);
        (this.modal.getElementsByClassName("before")[0] as HTMLElement).style.backgroundColor = current.toString();
        return new Promise(resolve => {
          Color.modal.modal.addEventListener("preclose", ({ accepted }) => {
            resolve(accepted ? Color.modal.value! : (current as Color));
          });
        });
      }
      catch (err) {
        handle(err);
        return Promise.reject()
      }
    },
    open() {
      modal.open(this.modal);
    },
    get isOpen() {
      return modal.openModal === this.modal;
    },
    get calcH() {
      return +(360 * parseFloat(hsKnob.style.left) / hsContainer.clientWidth).toFixed(1);
    },
    get calcS() {
      return +(100 - 100 * parseFloat(hsKnob.style.top) / hsContainer.clientHeight).toFixed(1);
    },
    get calcL() {
      return +lightness.value;
    },
    get value() {
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
    setHSL(h: number | Color, s?: number, l?: number) {
      if (h instanceof Color) ({ h, s, l } = h);
      h = Math.round(h);
      s = +s!.toFixed(1);
      l = +l!.toFixed(1);
      hsKnob.style.left = h / 360 * hsContainer.clientWidth + "px";
      hsKnob.style.top = (1 - s / 100) * hsContainer.clientHeight + "px";
      lightness.value = l.toString();
      (lightness.parentNode as HTMLElement).style.backgroundImage = `linear-gradient(white, ${Color.hsl(h, 100, 50)}, black)`;
      hueTB.value = h.toString();
      saturationTB.value = s.toString();
      lightnessTB.value = l.toString();
    },
    setRGB(r: number | Color, g?: number, b?: number) {
      if (r instanceof Color) ({ r, g, b } = r);
      redTB.value = (r = Math.round(r)).toString();
      greenTB.value = (g = Math.round(g!)).toString();
      blueTB.value = (b = Math.round(b!)).toString();
      const c = Color.rgb(r, g, b);
      hexTB.value = c.hex.slice(1);
      (Color.modal.modal.getElementsByClassName("after")[0] as HTMLElement).style.backgroundColor = c.toString();
    },
    modal: document.getElementById("color-picker")!
  }
}

const hsContainer = document.getElementById("hue-saturation")!;
const hsKnob = hsContainer.getElementsByTagName("div")[0]!;
const lightness = document.getElementById("lightness") as HTMLInputElement;
const hueTB = document.getElementById("h-tb") as HTMLInputElement;
const saturationTB = document.getElementById("s-tb") as HTMLInputElement;
const lightnessTB = document.getElementById("l-tb") as HTMLInputElement;
const redTB = document.getElementById("r-tb") as HTMLInputElement;
const greenTB = document.getElementById("g-tb") as HTMLInputElement;
const blueTB = document.getElementById("b-tb") as HTMLInputElement;
const hexTB = document.getElementById("hex-tb") as HTMLInputElement;
const rgbTextboxes = [redTB, greenTB, blueTB];
const hslTextboxes = [hueTB, saturationTB, lightnessTB];
const regex100 = /^1?[0-9]{1,2}(?:\.[0-9])?$/;
const regex255 = /^(?:2(?:5[0-5]|[0-4][0-9])|[0-1]?[0-9]{1,2})$/;
const regex360 = /^(?:3(?:60|[0-5][0-9])|[0-2]?[0-9]{1,2})$/;
const hsMousemove = (event: MouseEvent | TouchEvent) => {
  if (event instanceof MouseEvent && event.buttons !== 1) return;
  const h = Math.max(0, Math.min(300, (event.clientX || event.touches[0].clientX) - hsContainer.getBoundingClientRect().x)) / hsContainer.clientWidth * 360;
  const s = (Math.max(0, Math.min(300, (event.clientY || event.touches[0].clientY) - hsContainer.getBoundingClientRect().y)) / hsContainer.clientHeight - 1) * -100;
  const l = +lightness.value;
  Color.modal.setHSL(h, s, l);
  Color.modal.setRGB(Color.hsl(h, s, l));
  /*hsKnob.style.left = x;
  hsKnob.style.top = y;*/
};
hsContainer.addEventListener("mousedown", hsMousemove);
hsContainer.addEventListener("mousemove", hsMousemove);
hsContainer.addEventListener("touchstart", hsMousemove);
hsContainer.addEventListener("touchmove", hsMousemove);
lightness.addEventListener("input", () => {
  const hsl = [Color.modal.calcH, Color.modal.calcS, Color.modal.calcL];
  Color.modal.setHSL(...hsl);
  Color.modal.setRGB(Color.hsl(...hsl));
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
    Color.modal.setRGB(...rgb);
    Color.modal.setHSL(Color.rgb(...rgb));
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
    Color.modal.setHSL(...hsl);
    Color.modal.setRGB(Color.hsl(...hsl));
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
  Color.modal.setRGB(c);
  Color.modal.setHSL(c);
});
hexTB.addEventListener("focus", () => {
  hexTB.prevValid = hexTB.value;
});
hexTB.addEventListener("blur", () => {
  if (hexTB.value.length !== 6) hexTB.value = hexTB.prevValid;
});

function checkRange(value: number, min = -Infinity, max = Infinity) {
  if (value < min || value > max) 
    throw new RangeError(`Expected value between ${min} and ${max}; received ${value}`);
}