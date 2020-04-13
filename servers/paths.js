const { app } = require("./init");
const serve = require("./serve");

app.get("*", serve);
app.post("/pages*", serve);