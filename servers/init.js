const express = require("express");
const url = require("url");

const app = express();

app.listen(process.env.PORT || 8080); // This doesn't need to go at the end in most cases, but move it if there's bugs
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.fullUrl = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  res.locals.url = req.fullUrl;
  res.locals.query = req.query;
  res.locals.theme = "dark";
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