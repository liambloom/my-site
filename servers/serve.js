import * as path from "path";
import * as fs from "fs";
import statusCodes from "http-status-codes";

export default function serve(req, res, next, data = {}, callback = p => p) {
  let page = "." + req.fullUrl.pathname.replace(/\/$/, "/index");
  const type = path.extname(page);
  try {
    res.type(type || "html");
    if (type) { // if not ejs
      if (fs.existsSync(page)) res.write(callback(fs.readFileSync(page)));
      else res.status(404);
      res.end();
    }
    else {
      if (/\/pages\//.test(page)) {
        if (req.subdomains.length) page = page.split(/(?<=\/pages)(?=\/)/).join("/" + req.subdomains[0]);
        if (res.statusCode >= 300) {
          const errorName = res.namedError || res.statusCode.toString();
          if (fs.existsSync(path.join("./views/errors/", errorName) + ".ejs")) page = path.join("./errors/", errorName);
          else {
            res.locals.errorCode = res.statusCode;
            res.locals.errorMessage = `Error ${res.statusCode}: ${statusCodes.getStatusText(res.statusCode)}`;
            page = "./errors/template";
          }
        }
        else if (!fs.existsSync(path.join("./views", page) + ".ejs")) res.status(404);
      }
      else {
        res.status(200);
        page = "./template";
      }
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