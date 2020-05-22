"use strict";

const key = Symbol("ext");

class Color { // TODO: Add hsl/hsv functions and add setters for all the getters
  constructor (arg) {
    let r, g, b, a; // These are not used, but they need to be declared in order for the cool&compact one liner on line 11 to work
    if (arg === key) return; // This means that the necessary vars will be set by an external function
    if (/^(?:rgb|hsl)a?\(/.test(arg)) return Color[arg.split("(")[0]](...(arg.match(/\(.*?\)/).slice(1, -1).split(/,/g).map(e => parseFloat(e))));
    else if (arg[0] === "#") return Color.hex(arg.slice(1));
    else if (arg instanceof Color) return Color.rgba(...Object.values({r, g, b, a} = arg));
    else throw new Error("Expected format rgb, rgba, hsl, hsla, or 3, 4, 6, or 8 digit hex code");
  }
  get r () { // red
    return this._r;
  }
  get g () { // green
    return this._g;
  }
  get b () { // blue
    return this._b;
  }
  get a () { // alpha
    return this._a;
  }
  get h () { // hue
    /*let {r, g, b} = this;
    r /= 255;
    g /= 255;
    b /= 255;

    switch (this.max) {
      case r: return (g - b) / this._delta
    }*/
    return (((Math.round((this._max === this.r ? (this.g - this.b) / this._delta % 6 : this._max === this.g ? (this.b - this.r) / this._delta + 2 : (this.r - this.g) / this._delta + 4) * 60) || 0) + 360) % 360);
  }
  get s () { // saturation
    return (this._delta / 2.55 / (1 - Math.abs(2 * this._lRaw - 1))).toFixed(1);
  }
  get _lRaw () {
    return (this._max + this._min) / 510;
  }
  get l () { // lightness
    return (100 * this._lRaw).toFixed(1);
  }
  get v () { // vue/brightness
    return (this._max / 2.55).toFixed(1);
  }
  get _min () {
    return Math.min(this.r, this.g, this.b);
  }
  get _max () {
    return Math.max(this.r, this.g, this.b);
  }
  get _delta () {
    return this._max - this._min;
  }
  get rgb () {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
  get rgba () {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
  get hsl () {
    return `hsl(${this.h}, ${this.s}, ${this.l})`;
  }
  get hsla () {
    return `hsla(${this.h}, ${this.s}, ${this.l}, ${this.a})`;
  }
  get hex () {
    return `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}`;
  }
  get hexAlpha () {
    return this.hex + this.a.toString(16);
  }
  static rgb (r, g, b) {
    return this.rgba(r, g, b, 1);
  }
  static rgba (r, g, b, a) {
    for (let c of [r, g, b]) {
      if (c % 1) throw new TypeError("Each color value (r, g, b) must be a whole number");
      if (c < 0 || c > 255) throw new RangeError("Each color value (r, g, b) must be between 0 and 255 (inclusive)");
    }
    if (a < 0 || a > 1) throw new RangeError("The alpha value of a color must be between 0 and 1 (inclusive)");
    const color = new this(key);
    color._r = r;
    color._g = g;
    color._b = b;
    color._a = a;
    return color;
  }
  static hsl (h, s, l) {
    return this.hsla(h, s, l, 1);
  }
  static hsla (h, s, l, a) {
    let r, g, b;
    // TODO: The actual conversoin;
    return Color.rgba(r * 255, g * 255, b * 255, a);
  }
  static hex (hex) {
    if (hex[0] !== "#") throw new Error("Hex codes must start with a \"#\" symbol");
    hex = hex.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      let newHex = "";
      for (let c of hex) newHex += c.repeat(2);
      newHex = hex;
    }
    if (hex.length === 6) hex += "ff";
    if (hex.length !== 8) throw new Error(`Hex codes must be 3, 4, 6, or 8 characters long. Received hex code that was ${hex.length} long.`);
    if (!/^[0-9a-f]{8}$/i.test(hex)) throw new Error(`Hex codes can only contain the characters 0-9 and A-F`);
    const split = [];
    for (let i = 0; i < 4; i++) split.push(hex.substr(i * 2, 2));
    return this.rgba(...(split.map(e => parseInt(e, 16))));
  }
  static random () {
    return Color.hex("#" + Math.floor(Math.random() * 0x1000000).toString(16));
  }
}

Color.modal = {
  element: document.getElementById("color-picker"),
  open () {
    Modal.open(this.element);
  }
};
const hsContainer = document.getElementById("hue-saturation");
const hsKnob = hsContainer.getElementsByTagName("div")[0];
//Object.defineProperty(element);

window.Color = Color;

const hsMousemove = event => {
  if (event instanceof MouseEvent && event.buttons !== 1) return;
  hsKnob.style.left =  (event.clientX || event.touches[0].clientX) - hsContainer.getBoundingClientRect().x + "px";
  hsKnob.style.top = (event.clientY || event.touches[0].clientY) - hsContainer.getBoundingClientRect().y + "px";
};

hsContainer.addEventListener("mousedown", hsMousemove);
hsContainer.addEventListener("mousemove", hsMousemove);
hsContainer.addEventListener("touchstart", hsMousemove);
hsContainer.addEventListener("touchmove", hsMousemove);