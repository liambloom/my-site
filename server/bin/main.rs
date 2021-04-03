use actix_web::{App, HttpServer};
use actix_files::Files;
use server::{*, error::UnwrapExit, templates::tera};
use std::{io::Result, env};

#[actix_web::main]
async fn main() -> Result<()> {
    let port = match env::var("PORT") {
        Ok(port) => port.parse().unwrap_exit(),
        Err(_) => 8080
    };

    let _ = tera();
    
    HttpServer::new(|| {
        App::new()
        .service(default_template)
        .service(page)
        .service(favicon)
        .service(Files::new("", "."))
    })
        .bind(("127.0.0.1", port))?
        .bind(("::1", port))?
        .bind(format!(":{}", port))?
        .run()
        .await
}