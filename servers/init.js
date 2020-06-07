import * as fs from "fs";
import express from "express";
import serve from "./serve.js";

const app = express();
export default app;

app.subdomains = [];
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
  console.log(fs.readFileSync("./servers/domains.txt", "utf8").split("\n").map(e => e.match(/.*?(?=#|$|\r)/)[0].trim()).filter(e => e.length));
  for (let domain of fs.readFileSync("./servers/domains.txt", "utf8").split("\n").map(e => e.match(/.*?(?=#|$|\r)/)[0].trim()).filter(e => e.length)) {
    //console.log(domain);
    if (!req.fullUrl.hostname.endsWith(domain)) {
      console.log(req.fullUrl.hostname, "did not match", domain);
      continue;
    }
    console.log(req.fullUrl.hostname, "did match", domain);
    app.set("subdomain offset", domain.match(/\./g).length + 1);
    if (req.subdomains.length && (req.subdomains.length > 1 || !app.subdomains.includes(req.subdomains[0]))) {
      if (req.fullUrl.pathname.startsWith("/pages")) {
        res.status(404);
        res.locals.sub = true;
        res.namedError = req.subdomains.length > 1 ? "multipleSubdomains" : "invalidDomain";
      }
      boundServe();
    }
    else next();
    console.log("returned");
    return;
  }
  console.log("not returned");
  // Not a valid domain
  if (req.fullUrl.pathname.startsWith("/pages")) {
    res.status(422);
    res.namedError = "invalidDomain";
  }
  boundServe();
});

export function createRoute (name) { // create files for each router (api, admin, etc.) and import this function
  const router = express.Router();
  app.use("/" + name, router);
  return router;
}
export function createSubdomain (name) {
  const router = express.Router();
  app.subdomains = name;
  app.use((req, res, next) => {
    if (req.subdomains[0] === name) router(req, res, next);
    else next();
  });
  return router;
}