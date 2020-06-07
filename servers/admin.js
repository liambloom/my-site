import { createSubdomain } from "./init.js";
import serve from "./serve.js";

const admin = createSubdomain("admin");
export default admin;

admin.get("*", serve);
admin.use((req, res, next) => {
  // TODO: Check is logged in as admin
  res.status(403);
  next();
});
admin.get("/pages*", serve);