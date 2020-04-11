const url = require("url");
const path = require("path");
const fs = require("fs");

function respond(res, data, status, type, callback = p => p) {
  res.status(status).type(type);
  res.write(callback(data));
  res.end();
}
function respondEjs(res, path, options, status, callback) {
  res.render(path, options, (err, html) => {
    if (err) throw err;
    else respond(res, html, status, "html", callback);
  });
}

function serve(req, res, next, data = {}, callback = p => p) {
  const page = "." + req.fullUrl.pathname.replace(/\/$/, "/index");
  const type = path.extname(page);
  try {
    if (type) { // if not ejs
      if (fs.existsSync(page)) respond(res, fs.readFileSync(page), 200, type);
      else res.status(404).end();
    }
    else {
      if (fs.existsSync(`./views/${page}.ejs`)) respondEjs(res, page, data, 200, callback);
      else respondEjs(res, "./404", {}, 404);
    }
  }
  catch (err) {
    res.status(500);
    if (!type || type === ".html") {
      res.type("html");
      res.write(`Uh Oh! Something Broke :(<br>${err}`);
    }
    res.end();
    console.error(err);
  }
}

module.exports = serve;