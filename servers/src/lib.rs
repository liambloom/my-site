use actix_web::*;
//use actix_files::NamedFile;
use askama::Template;
use std::fs;

#[derive(Template)]
#[template(path = "../../views/template.html")]
struct Base<'a> {
  theme: Option<&'a str>,
  page: String
}

#[get("{path:[^.]*}")]
async fn index(req: HttpRequest) -> Result<HttpResponse> {
  println!("index");
  Ok(HttpResponse::Ok()
    .content_type("text/html")
    .body(
      Base {
        theme: Some("light"),
        page: fs::read_to_string(format!("../../views/pages/{}.html", req.match_info().query("path"))).unwrap()
      }
      .render()
      .unwrap())
  )
}

/*#[get("{path:.*}.{ext}")]
async fn recourse() -> Result<HttpRespnose> {
  todo!()
}*/

#[get("/")]
async fn hello() -> impl Responder {
  HttpResponse::Ok().body("Hello World")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
  HttpResponse::Ok().body(req_body)
}

pub async fn manual_hello() -> impl Responder {
  HttpResponse::Ok().body("Hey there!")
}