const express = require("express");
const url = require("url");
const fs = require("fs");
const util = require("util");

const app = express();
module.exports.app = app;

app.listen(process.env.PORT || 8080); // This doesn't need to go at the end in most cases, but move it if there's bugs
app.set("view engine", "ejs"); // Not actually used because ejs.render is synchronous, which I like much better than res.render
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

const createRoute = name => {
  const router = express.Router();
  app.use("/" + name, router);
  module.exports[name] = router;
  return router;
};

//createRoute("pages");
createRoute("api");