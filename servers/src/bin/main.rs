use actix_web::*;
//use actix_files as fs;
use server::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  HttpServer::new(|| {
    App::new()
      .service(index)
      //.service(fs::Files::new("/", "/views/pages"))
      /*.service(hello)
      .service(echo)
      .route("/hey", web::get().to(manual_hello))*/
  })
  .bind("127.0.0.1:8080")?
  .run()
  .await
}