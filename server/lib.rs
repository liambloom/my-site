use actix_web::{get, HttpRequest, HttpResponse, Result, http::header, web::Query};
use actix_files::NamedFile;
use chrono::{Utc, Datelike};
use serde::Deserialize;
use tera::Context;

pub mod templates;
pub mod error;
mod theme;

use error::*;
use theme::{Theme, THEME_DATA};
use templates::tera;

#[cfg(not(any(feature = "dev", feature = "release")))]
compile_error!("You must specify either dev or release feature");

#[cfg(all(feature = "dev", feature = "release"))]
compile_error!("You cannot specify both dev and release feature");

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
            .body(tera().render("template.html", &ctx)
                .unwrap_exit())
    }
    
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile> {
    Ok(NamedFile::open("img/favicon/favicon.ico")?)
}

#[get("templates/{path:[^.]*.html}")]
async fn page(req: HttpRequest) -> Result<String, ErrorTemplate> {
    let page_name = req.match_info().query("path");
    tera().render(page_name, &Context::new()).map_err(|e| {
        eprintln!("{}", e);
        e.into()
    })
}
