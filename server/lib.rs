use actix_web::{get, HttpResponse, Result, http::header, web::Query};
use actix_files::NamedFile;
use askama::Template;
use chrono::{Utc, Datelike};
use std::borrow::Borrow;
use serde::Deserialize;

mod pages;
mod theme;

pub use pages::page;
use theme::Theme;

#[derive(Template)]
#[template(path = "template.html")]
struct Base {
    theme: Theme,
}

#[derive(Template)]
#[template(path = "pages/index.html")]
struct EmptyTemplate;

#[get("templates/pages/index.html")]
async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(
            EmptyTemplate
                .render()
                .expect("Index template failed"))
}

#[derive(Debug, Deserialize)]
struct DefaultQuery {
    april1: Option<String>,
}

#[get("{path:[^.]*}")]
async fn default_template(Query(info): Query<DefaultQuery>) -> HttpResponse {
    let today = Utc::today();
    if info.april1 != Some(String::from("disabled")) && today.month() == 4 && today.day() == 1/* && std::env::var("DISABLE_RICKROLL") == Ok(String::from("1"))*/ {
        HttpResponse::SeeOther()
        .header(header::LOCATION, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        .finish()
    }
    else {
        HttpResponse::Ok()
            .content_type("text/html")
            .body(
                Base {
                    theme: Theme::Auto,
                }
                    .render()
                    .expect("Base template failed"))
    }
    
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile> {
    Ok(NamedFile::open("img/favicon/favicon.ico")?)
}