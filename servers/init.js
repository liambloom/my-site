import * as fs from "fs";
import { format } from "util";
import express from "express";
import serve from "./serve.js";
import * as db from "./api-internal.js";

const app = express();
export default app;
const ALL_SUBS = Symbol("all");

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
  for (let domain of fs.readFileSync("./servers/domains.dat", "utf8").split("\n").map(e => e.match(/.*?(?=#|$|\r)/)[0].trim()).filter(e => e.length)) {
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

//------------------------------------------------------------------ This section doesn't fit in with the rest of this file ------------
console.error = function error(data, ...args) { // red
  this._stderr.write("\x1b[31m" + format(data, ...args) + "\x1b[0m\n");
};
console.warn = function warn(data, ...args) { // yellow
  this._stderr.write("\x1b[33m" + format(data, ...args) + "\x1b[0m\n");
};
console.debug = function debug(data, ...args) { // cyan
  this._stdout.write("\x1b[36m" + format(data, ...args) + "\x1b[0m\n");
};

export function handle(error, res) { // this kind of fits in, it's for handling errors when processing a request
  if (res) res.status(500).end(); // TODO: Improve this, make it send the error
  console.error(error);
  db.error.log(error);
}
//--------------------------------------------------------------------------------------------------------------------------------------

app.addRoute = function (name, wildcard = false) { // create files for each router (api, admin, etc.) and import this function
  if (wildcard && this !== app) throw new Error("Wildcard routes are only allowed on the app, not on other routers");
  const router = express.Router();
  this.use("/" + name, (req, res, next) => {
    // double equals is on purpose, if router.subdomain is null and req.subdomains[0] is undefined, it returns the correct answer
    if (router.subdomain === ALL_SUBS || router.subdomain == req.subdomains[0]) router(req, res, next);
    else next(); 
  });
  router.addRoute = this.addRoute;
  if (wildcard) router.subdomain = ALL_SUBS;
  else if (this === app) router.subdomain = null;
  else router.subdomain = this.subdomain;
  return router;
};
export function createSubdomain (name) {
  const router = express.Router();
  if (global.subdomains.includes(name)) console.warn(new Error(`The subdomain name ${name} was initiated twice`));
  global.subdomains.push(name);
  app.use((req, res, next) => {
    if (req.subdomains[0] === name) router(req, res, next);
    else next();
  });
  router.addRoute = app.addRoute;
  router.isSubdomain = true;
  router.subdomain = name;
  return router;
}