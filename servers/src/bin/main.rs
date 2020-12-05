use actix_web::{App, HttpServer};
use actix_files::Files;
use server::*;
use std::{io::Result, env};

#[actix_web::main]
async fn main() -> Result<()> {
  let port = match env::var("PORT") {
    Ok(port) => port.parse().unwrap(),
    Err(_) => 8080
  };
  HttpServer::new(|| {
    App::new()
      //.wrap_fn(|| {println!()})
      .service(default_template)
      .service(page)
      .service(favicon)
      .service(Files::new("", "../"))
  })
    .bind(("127.0.0.1", port))?
    .bind(("::1", port))?
    .bind(":8080")?
    .run()
    .await
}