import * as db from "./api-internal.js";
import { createRoute } from "./init.js";

const api = createRoute("api");

api.post("/error/log", async (req, res) => {
  try {
    await db.error.log(Object.assign({
      ua: req.get("User-Agent")
    }, req.body));
    res.status(204).end();
  }
  catch (err) {
    console.debug("You're f***ed, the error logger just threw an error");
    console.error(err);
    res.status(500).end();
  }
});