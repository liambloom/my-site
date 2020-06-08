import pg from "pg";
const { Pool } = pg;

const pool = new Pool(
  process.env.NODE_ENV === "production"
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
  : {
    user: "me",
    host: "localhost",
    database: "my-site-api",
    password: "password",
    port: "5432",
    ssl: false // I should get an SSL certificate for localhost (localtest.me support ssl)
  }
);

export default pool;