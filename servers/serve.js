const url = require("url");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const statusCodes = require("http-status-codes");

function serve(req, res, next, data = {}, callback = p => p) {
  const page = req.fullUrl.pathname;
  const type = path.extname(page);
  try {
    res.type(type || "html");
    if (type) { // if not ejs
      if (fs.existsSync("." + page)) res.write(fs.readFileSync("." + page));
      else res.status(404);
    }
    else {
      if (!fs.existsSync(`./views/pages/${page}.ejs`)) res.status(404);
      let dir, path;
      if (res.statusCode < 300) {
        dir = "pages";
        path = page;
      }
      else {
        dir = "errors";
        if (fs.existsSync(`./views/errors/${res.statusCode}.ejs`)) path = "/" + res.statusCode;
        else {
          res.locals.msg = `Error ${res.statusCode}: ${statusCodes.getStatusText(res.statusCode)}`;
          path = "/template";
        }
      }
      res.locals.path = `./views/${dir}${path}`;
      const importPath = `./views/${dir}/imports/${path}.ejs`;
      res.locals.hasImports = fs.existsSync(`./views/${importPath}.ejs`);
      res.locals.importPath = importPath;
      res.locals.status = res.statusCode;
      res.write(res.renderSync("./template.ejs", { data }));
    }
  }
  catch (err) {
    res.status(500);
    if (!type || type === ".html") {
      res.type("html");
      res.write(`Uh Oh! Something Broke :(<br>${err}`);
    }
    console.error(err);
  }
  res.end();
}

module.exports = serve;