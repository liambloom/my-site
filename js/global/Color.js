"use strict";

const key = Symbol("ext");

class Color {
  constructor (arg) {
    let r, g, b, a; // These are not used, but they need to be declared in order for the cool&compact one liner on line 11 to work
    if (arg === key) return; // This means that the necessary vars will be set by an external function
    if (/^(?:rgb|hsl)a?\(/.test(arg)) return Color[arg.split("(")[0]](...(arg.match(/\(.*?\)/)[0].slice(1, -1).split(/,/g).map(e => parseFloat(e))));
    else if (arg[0] === "#") return Color.hex(arg);
    else if (arg instanceof Color) return Color.rgba(...Object.values({r, g, b, a} = arg));
    else throw new Error("Expected format rgb, rgba, hsl, hsla, or 3, 4, 6, or 8 digit hex code");
  }
  _changed () {
    if (typeof this.onchange === "function") this.onchange.call(this);
  }
  toString () {
    return this.hex;
  }
  get r () { // red
    return this._r;
  }
  set r (value) {
    type.checkRange(value, 0, 255);
    this._r = value;
    this._changed();
  }
  get g () { // green
    return this._g;
  }
  set g (value) {
    type.checkRange(value, 0, 255);
    this._r = value;
    this._changed();
  }
  get b () { // blue
    return this._b;
  }
  set b (value) {
    type.checkRange(value, 0, 255);
    this._r = value;
    this._changed();
  }
  get a () { // alpha
    return this._a;
  }
  set a (value) {
    type.checkRange(value, 0, 1);
    this._r = value;
    this._changed();
  }
  get h () { // hue
    return (((Math.round((this._max === this.r ? (this.g - this.b) / this._delta % 6 : this._max === this.g ? (this.b - this.r) / this._delta + 2 : (this.r - this.g) / this._delta + 4) * 60) || 0) + 360) % 360);
  }
  set h (value) {
    const n = Color.hsl(value, this.s, this.l);
    this.r = n.r;
    this.g = n.g;
    this.b = n.b;
    this._changed();
  }
  get s () { // saturation
    return !(this._lRaw % 1) ? 0 : +(this._delta / 2.55 / (1 - Math.abs(2 * this._lRaw - 1))).toFixed(1);
  }
  set s (value) {
    const n = Color.hsl(this.h, value, this.l);
    this.r = n.r;
    this.g = n.g;
    this.b = n.b;
    this._changed();
  }
  get _lRaw () {
    return (this._max + this._min) / 510;
  }
  get l () { // lightness
    return +(100 * this._lRaw).toFixed(1);
  }
  set l (value) {
    const n = Color.hsl(this.h, this.s, value);
    console.log(n);
    this._r = n.r;
    this._g = n.g;
    this._b = n.b;
    this._changed();
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
      type.checkRange(c, 0, 255);
    }
    type.checkRange(a, 0, 1);
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
    //console.log(typeof h, typeof s, l, a);
    type.checkRange(h, 0, 360);
    type.checkRange(s, 0, 100);
    type.checkRange(l, 0, 100);

    let r, g, b;
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

    return Color.rgba(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), a);
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
    return this.rgba(...(split.slice(0, 3).map(e => parseInt(e, 16))), parseInt(split[3], 16) / 0xff);
  }
  static random () {
    return Color.hex("#" + Math.floor(Math.random() * 0x1000000).toString(16));
  }
}

window.Color = Color;