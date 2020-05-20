const key = Symbol("ext");

class Color { // TODO: Add hsl/hsv functions and add setters for all the getters
  constructor (arg) {
    if (arg === key) return; // This means that the necessary vars will be set by an external function
    if (/^(?:rgb|hsl)a?\(/.text(arg)) return Color[arg.split("(")[0]](...(arg.match(/\(.*?\)/).slice(1, -1).split(/,/g).map(e => parseFloat(e))));
    else if (arg[0] === "#") return Color.hex(arg.slice(1));
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
    // TODO
  }
  get s () { // saturation
    // TODO
  }
  get l () { // lightness
    // TODO
  }
  get v () { // vue/brightness
    // TODO
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
    const color = this(key);
    color._r = r;
    color._g = g;
    color._b = b;
    color._a = a;
  }
  static hsl (h, s, l) {
    return this.hsla(h, s, l, 1);
  }
  static hsla (h, s, l, a) {
    // TODO
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
Color.hsContainer = document.getElementById("hue-saturation");
Color.hsKnob = Color.hsContainer.getElementsByTagName("div")[0];
//Object.defineProperty(element);

window.Color = Color;

const hsMousemove = event => {
  if (event instanceof MouseEvent && event.buttons !== 1) return;
  Color.hsKnob.style.left =  (event.clientX || event.touches[0].clientX) - Color.hsContainer.getBoundingClientRect().x + "px";
  Color.hsKnob.style.top = (event.clientY || event.touches[0].clientY) - Color.hsContainer.getBoundingClientRect().y + "px";
};

Color.hsContainer.addEventListener("mousedown", hsMousemove);
Color.hsContainer.addEventListener("mousemove", hsMousemove);
Color.hsContainer.addEventListener("touchstart", hsMousemove);
Color.hsContainer.addEventListener("touchmove", hsMousemove);