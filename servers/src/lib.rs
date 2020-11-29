use actix_web::{*, http::StatusCode};
use dev::HttpResponseBuilder;
use std::fs as fs;
use actix_files as afs;
use askama::Template;
use std::path::PathBuf;
use std::error::Error;
use std::fmt;
use std::convert::From;

#[derive(Template)]
#[template(path = "../../views/template.html")]
struct Base<'a> {
  theme: Option<&'a str>,
}

#[derive(Template)]
#[template(path = "../../views/errors/template.html")]
struct ErrorTemplate {
  status: StatusCode,
}

#[derive(Debug)]
enum BasicError {
  NotFound,
  InternalError,
}

impl error::ResponseError for BasicError {
  fn status_code(&self) -> StatusCode {
    use BasicError::*;

    match self {
      NotFound => StatusCode::NOT_FOUND,
      InternalError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

impl Error for BasicError {}

impl fmt::Display for BasicError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self)
  }
}

impl From<std::io::Error> for BasicError {
  fn from(err: std::io::Error) -> BasicError {
    use std::io::ErrorKind::*;

    match err.kind() {
      NotFound => BasicError::NotFound,
      _ => BasicError::InternalError,
    }
  }
}

#[derive(Debug)]
struct ErrorPage {
  status: StatusCode,
}

impl error::ResponseError for ErrorPage {
  fn error_response(&self) -> HttpResponse {
      HttpResponseBuilder::new(self.status)
        .content_type("text/html")
        .body(
          ErrorTemplate {
            status: self.status
          }
            .render()
            .unwrap())
  }

  fn status_code(&self) -> StatusCode {
      self.status
  }
}

impl Error for ErrorPage {}

impl fmt::Display for ErrorPage {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self)
  }
}

impl From<std::io::Error> for ErrorPage {
  fn from(err: std::io::Error) -> ErrorPage {
    use std::io::ErrorKind::*;

    match err.kind() {
      NotFound => ErrorPage { status: StatusCode::NOT_FOUND },
      _ => ErrorPage { status: StatusCode::INTERNAL_SERVER_ERROR },
    }
  }
}

#[get("{path:[^.]*}")]
async fn default_template() -> Result<HttpResponse> {
  Ok(HttpResponse::Ok()
    .content_type("text/html")
    .body(
      Base {
        theme: None,
      }
      .render()
      .unwrap())
  )
}

#[get("{path:[^.]*}.html")]
async fn page(req: HttpRequest) -> Result<afs::NamedFile, ErrorPage> {
  Ok(afs::NamedFile::open(format!("../{}.html", req.match_info().query("path")))?)
}

#[get("{path:[^.]*}.{ext}")]
async fn file(req: HttpRequest) -> Result<afs::NamedFile, BasicError> {
  Ok(afs::NamedFile::open(format!("../{}.{}", req.match_info().query("path"), req.match_info().query("ext")))?)
}