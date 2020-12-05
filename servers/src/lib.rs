use actix_web::{get, HttpResponse, Result};
use actix_files::NamedFile;
use askama::Template;
use std::borrow::Borrow;

mod pages;
mod theme;

pub use pages::page;
use theme::Theme;

#[derive(Template)]
#[template(path = "../../views/template.html")]
struct Base {
  theme: Theme,
}


#[get("{path:[^.]*}")]
async fn default_template() -> HttpResponse {
  HttpResponse::Ok()
    .content_type("text/html")
    .body(
      Base {
        theme: Theme::Auto,
      }
        .render()
        .expect("Base template failed"))
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile> {
  Ok(NamedFile::open("../img/favicon/favicon.ico")?)
}