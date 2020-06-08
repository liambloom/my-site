import * as fs from "fs";
import { format } from "util";
import express from "express";
import serve from "./serve.js";

const app = express();
export default app;

global.subdomains = [];
app.listen(process.env.PORT || 8080); // This doesn't need to go at the end in most cases, but move it if there's bugs
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.fullUrl = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  req.fullUrl.pathname = req.fullUrl.pathname;
  res.locals.url = req.fullUrl;
  res.locals.query = req.query;
  res.locals.theme = undefined;
  next();
});
app.use((req, res, next) => {
  const now = new Date(req.body.timestamp);
  if (now.getMonth() === 3 && now.getDate() === 1) res.redirect("https://youtu.be/dQw4w9WgXcQ");
  else next();
});
app.use((req, res, next) => {
  const boundServe = serve.bind(null, req, res, next);
  for (let domain of fs.readFileSync("./servers/domains.txt", "utf8").split("\n").map(e => e.match(/.*?(?=#|$|\r)/)[0].trim()).filter(e => e.length)) {
    if (!req.fullUrl.hostname.endsWith(domain)) {
      continue;
    }
    app.set("subdomain offset", domain.match(/\./g).length + 1);
    if (req.subdomains.length && (req.subdomains.length > 1 || !subdomains.includes(req.subdomains[0]))) {
      if (req.fullUrl.pathname.startsWith("/pages")) {
        res.status(404);
        res.locals.sub = true;
        res.namedError = req.subdomains.length > 1 ? "multipleSubdomains" : "invalidDomain";
      }
      boundServe();
    }
    else next();
    return;
  }
  // Not a valid domain
  if (req.fullUrl.pathname.startsWith("/pages")) {
    res.status(422);
    res.namedError = "invalidDomain";
  }
  boundServe();
});

// Changes color text for a few console functions
console.error = function error(data, ...args) { // red
  this._stderr.write("\x1b[31m" + format(data, ...args) + "\x1b[0m\n");
};
console.warn = function warn(data, ...args) { // yellow
  this._stderr.write("\x1b[33m" + format(data, ...args) + "\x1b[0m\n");
};
console.debug = function debug(data, ...args) { // cyan
  this._stdout.write("\x1b[36m" + format(data, ...args) + "\x1b[0m\n");
};

export function createRoute (name) { // create files for each router (api, admin, etc.) and import this function
  const router = express.Router();
  app.use("/" + name, router);
  return router;
}
export function createSubdomain (name) {
  const router = express.Router();
  global.subdomains.push(name);
  app.use((req, res, next) => {
    if (req.subdomains[0] === name) router(req, res, next);
    else next();
  });
  return router;
}
export function handle (error, res) {
  if (res) res.status(500).end();
  console.error(error);
   
}