use actix_web::{get, HttpRequest, HttpResponse, Result, error::ResponseError, dev::HttpResponseBuilder,  http::StatusCode};
use actix_files::NamedFile;
use askama::Template;
use std::{io, convert::From, error::Error};

#[get("{path:[^.]*.html}")]
pub async fn page(req: HttpRequest) -> Result<NamedFile, ErrorTemplate> {
    let pagename = req.match_info().query("path");
    println!("{}", pagename);
    Ok(NamedFile::open(req.match_info().query("path"))?)
}

#[derive(Debug, Template)]
#[template(path = "errors/template.html")]
pub struct ErrorTemplate {
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