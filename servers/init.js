const express = require("express");
const url = require("url");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const app = express();

app.listen(process.env.PORT || 8080); // This doesn't need to go at the end in most cases, but move it if there's bugs
app.set("view engine", "ejs"); // Not actually used because ejs.render is synchronous, which I like much better than res.render
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.fullUrl = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  req.fullUrl.pathname = req.fullUrl.pathname.replace(/\/$/, "/index");
  res.locals.url = req.fullUrl;
  res.locals.query = req.query;
  res.locals.theme = "dark";
  res.renderSync = function (view, locals = {}) {
    const viewsPath = res.get("views") || /*process.cwd() + */ "./views";
    if (fs.existsSync(path.join(viewsPath, view))) return ejs.render(fs.readFileSync(path.join(viewsPath, view), { encoding: "utf8" }), Object.assign(locals, this.locals, { __dirname: process.cwd() }));
    else throw new Error(`Path "${view}" does not exist`);
  };
  next();
});
app.use((req, res, next) => {
  const now = new Date();
  if (now.getMonth() === 3 && now.getDate() === 1) res.redirect("https://youtu.be/dQw4w9WgXcQ");
  else next();
});

const main = express.Router();
const api = express.Router();
app.use(/^(?!\/(?:api))/, main);
app.use("/api", api);

module.exports = {
  main,
  api
};