const url = require("url");
const path = require("path");
const fs = require("fs");
const statusCodes = require("http-status-codes");

function serve(req, res, next, data = {}, callback = p => p) {
  let page = "." + req.fullUrl.pathname.replace(/\/$/, "/index");
  const type = path.extname(page);
  try {
    res.type(type || "html");
    if (type) { // if not ejs
      if (fs.existsSync(page)) res.write(fs.readFileSync(page));
      else res.status(404);
      res.end();
    }
    else {
      let isTemplate = true;
      if (/\/pages\//.test(page)) {
        isTemplate = false;
        if (!fs.existsSync(path.join("./views", page) + ".ejs")) res.status(404);
      }
      if (res.statusCode >= 300) {
        if (fs.existsSync(path.join("./views/errors/", res.statusCode.toString()) + ".ejs")) page = path.join("./errors/", res.statusCode.toString());
        else {
          res.locals.errorCode = res.statusCode;
          res.locals.errorMessage = `Error ${res.statusCode}: ${statusCodes.getStatusText(res.statusCode)}`;
          page = "./errors/template";
        }
      }
      else if (!/\/pages\//.test(page)) page = "./template";
      res.render(page, { data }, (err, html) => {
        if (err) throw err;
        else {
          res.write(html);
          res.end();
        }
      });
    }
  }
  catch (err) {
    res.status(500);
    if (!type || type === ".html") {
      res.type("html");
      res.write(`Uh Oh! Something Broke :(<br>${err.toString().replace(/</g, "&lt;")}`);
      res.end();
    }
    console.error(err);
  }
}

module.exports = serve;