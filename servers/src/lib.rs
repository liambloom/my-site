use actix_web::{get, HttpRequest, HttpResponse, Result, error::ResponseError, dev::HttpResponseBuilder,  http::StatusCode};
use actix_files::NamedFile;
use askama::Template;
use std::{io, fmt, convert::From, error::Error};
use std::borrow::Borrow;

#[derive(Template)]
#[template(path = "../../views/template.html")]
struct Base {
  theme: Theme,
}

#[derive(Debug, Template)]
#[template(path = "../../views/errors/template.html")]
struct ErrorTemplate {
  status: StatusCode,
}

impl ResponseError for ErrorTemplate {
  fn error_response(&self) -> HttpResponse {
      HttpResponseBuilder::new(self.status)
        .content_type("text/html")
        .body(
          self
            .render()
            .unwrap())
  }

  fn status_code(&self) -> StatusCode {
      self.status
  }
}

impl Error for ErrorTemplate {}

impl From<io::Error> for ErrorTemplate {
  fn from(err: io::Error) -> ErrorTemplate {
    use io::ErrorKind::*;

    ErrorTemplate {
      status: match err.kind() {
        NotFound => StatusCode::NOT_FOUND,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
      }
    }
    
  }
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

#[get("{path:[^.]*}.html")]
async fn page(req: HttpRequest) -> Result<NamedFile, ErrorTemplate> {
  Ok(NamedFile::open(format!("../{}.html", req.match_info().query("path")))?)
}

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
enum Theme {
  Light,
  Dark,
  Auto,
}

impl Theme {
  pub const VARIANTS: [Theme; 3] = [Theme::Light, Theme::Dark, Theme::Auto];
}

impl fmt::Display for Theme {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Theme::Light => write!(f, "Light"),
      Theme::Dark => write!(f, "Dark"),
      Theme::Auto => write!(f, "Auto"),
    }
  }
}