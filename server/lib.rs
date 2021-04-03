use actix_web::{get, HttpResponse, Result, http::header, web::Query};
use actix_files::NamedFile;
//use askama::Template;
use chrono::{Utc, Datelike};
//use std::borrow::Borrow;
use std::{fs, time::SystemTime};
use serde::Deserialize;
use tera::{Tera, Context};
use lazy_static::lazy_static;

lazy_static! {
    static ref TEMPLATES: Tera = Tera::new("templates/**/*").unwrap();

    #[cfg(debug_assertions)]
    static ref LAST_LOADED: SystemTime = SystemTime::now();
}

mod pages;
mod theme;

pub use pages::page;
use theme::{Theme, THEME_DATA};

/*#[derive(Template)]
#[template(path = "template.html")]
struct Base {
    theme: Theme,
}

#[derive(Template)]
#[template(path = "pages/index.html")]
struct EmptyTemplate;*/

/*#[get("templates/pages/index.html")]
async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(
            EmptyTemplate
                .render()
                .expect("Index template failed"))
}*/

#[derive(Debug, Deserialize)]
struct DefaultQuery {
    april1: Option<String>,
}

#[get("{path:[^.]*}")]
async fn default_template(Query(info): Query<DefaultQuery>) -> HttpResponse {
    let today = Utc::today();
    if info.april1 != Some(String::from("disabled")) && today.month() == 4 && today.day() == 1 {
        HttpResponse::SeeOther()
            .header(header::LOCATION, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            .finish()
    }
    else {
        let mut ctx = Context::new();
        ctx.insert("theme", &Theme::Auto);
        ctx.insert("theme_data", &THEME_DATA);
        HttpResponse::Ok()
            .content_type("text/html")
            .body(TEMPLATES.render("template.html", &ctx)
                .unwrap())
    }
    
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile> {
    Ok(NamedFile::open("img/favicon/favicon.ico")?)
}

/*#[cfg(debug_assertions)]
async fn update_templates() {
    if LAST_LOADED.duration_since(fs::metadata("templates").unwrap().modified().unwrap()).is_err() {
        TEMPLATES.full_reload().unwrap();
    }
}*/