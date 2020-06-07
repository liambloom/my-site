import app from "./init.js";
import serve from "./serve.js";
import "./admin.js";

app.get("*", serve);
app.post("/pages*", serve);