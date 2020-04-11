const { main } = require("./init");
const serve = require("./serve");

main.get(/.*/, serve);