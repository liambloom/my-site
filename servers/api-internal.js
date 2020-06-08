import pool from "./database.js";

export const error = {
  // This can be api.error.log(error: Error) OR api.error.log(req, res)
  log (error) {
    return pool.query("INSERT INTO errors VALUES ($1, $2, $3, $4, NOW(), $5)", [error.message, error.page || null, error.ua || null, error.name, error.stack]);
  }
};