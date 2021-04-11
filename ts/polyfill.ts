type cb = (arg0: any) => void;

interface Indexable {
  [index: string]: any
}
interface Window extends Indexable { }
interface Object extends Indexable { }

interface ObjectConstructor {
  values(obj: Object): any[]
  //entries(obj: Object): [string, any][]
}

interface String {
  padStart(maxLength: number, padString?: string): string
}

var require = (target: string) => new Promise<any>((resolve, reject) => requireQueue.push({ target, resolve, reject }));
const requireQueue: {target: string, resolve: cb, reject: cb}[] = [];

try {
  new Function("import('')")()
    .catch(() => {
      require = new Function("p", "return import(p);") as ((target: string) => Promise<any>);
    });
}
catch (e) {
  require = (p: string) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `import * as mod from ${p}; window["${p}"] = mod`;

    script.addEventListener("load", () => {
      resolve(window[p]);
      delete window[p];
      script.remove();
    });

    script.addEventListener("error", e => {
      reject(e.error);
      script.remove();
    });

    document.head.appendChild(script);
  });
}
finally {
  for (let e of requireQueue) {
    let rejected = false;
    require(e.target)
      .catch(e => {
        rejected = true;
        e.reject(e);
      })
      .then(m => {
        if (!rejected)
          e.resolve(m);
      });
  }
}

if (!Object.values) {
  Object.defineProperty(Object, "values", {
    value(obj: Object) {
      let values = [];
      for (let e in obj) { // FIXME: This shouldn't return everything
        values.push(e);
      }
      return values;
    }
  });
}

if (!String.prototype.padStart) {
  Object.defineProperty(String.prototype, "padStart", {
    value(maxLength: number, padString = " ") {
      let s = this;
      for (let i = 0; s.length < maxLength; i++) {
        s = padString[i % padString.length] + s;
      }
      return s;
    }
  })
}

/*if (!Object.entries) {
  Object.defineProperty(Object, "entries", {
    value(obj: Object) {
      let values = [];
      for (let e in obj) {
        values.push([e, obj[e]]);
      }
      return values;
    }
  });
}*/

