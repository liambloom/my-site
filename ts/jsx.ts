
declare global {
  namespace JSX {
    interface Element extends HTMLElement { }
  }
} 

export default function h(tag: string, attrs?: { [key: string]: any }, ...children: (HTMLElement | string)[]): HTMLElement {
  const e = document.createElement(tag);
  attrs = attrs ?? {};

  for (let attr in attrs) {
    if (attrs[attr] === true) {
      e.setAttribute(attr, attr);
    }
    else if (attrs[attr] !== false && attrs[attr] != null)  {
      e.setAttribute(attr == "className" ? "class" : attr, attrs[attr].toString()); // TODO: maybe character map?
    }
  }

  for (let child of children) {
    e.append(child);
  }

  return e;
}