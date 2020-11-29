use actix_web::*;
use actix_files as afs;
use server::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  HttpServer::new(|| {
    App::new()
      .service(default_template)
      .service(page)
      .service(afs::Files::new("", "../"))
      /*.service(
        afs::Files::new("", "../")*/
      /*.default_handler(|| {}))*/
      //.service(fs::Files::new("/", "/views/pages"))
      /*.service(hello)
      .service(echo)
      .route("/hey", web::get().to(manual_hello))*/
  })
  .bind(std::net::SocketAddr::from(([127, 0, 0, 1], match std::env::var("PORT") {
    Ok(port) => port.parse().unwrap(),
    Err(_) => 8080
  })))?
  .run()
  .await
}