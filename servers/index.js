import app from "./init.js";
import serve from "./serve.js";

import "./admin.js";
import "./api-external.js";

app.get("*", serve);
app.post("/pages*", serve);