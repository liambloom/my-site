use actix_web::{get, HttpRequest, HttpResponse, Result, error::ResponseError, dev::HttpResponseBuilder,  http::StatusCode};
//use actix_files::NamedFile;
use super::{templates, UnwrapExit};
//use askama::Template;
use std::{io, convert::From, error::Error, fmt};
use tera::Context;
use serde::Serialize;

#[get("templates/{path:[^.]*.html}")]
pub async fn page(req: HttpRequest) -> Result<String, ErrorTemplate> {
    let pagename = req.match_info().query("path");
    //println!("{}", pagename);
    //Ok(NamedFile::open(req.match_info().query("path"))?)
    templates().render(pagename, &Context::new()).map_err(|e| {
        eprintln!("{}", e);
        e.into()
    })
}

#[derive(Debug/*, Template*/)]
//#[template(path = "errors/template.html")]
pub struct ErrorTemplate {
    status: StatusCode,
}

impl ResponseError for ErrorTemplate {
    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status)
            .content_type("text/html")
            .body(self.to_string())
    }

    fn status_code(&self) -> StatusCode {
        self.status
    }
}

impl Error for ErrorTemplate {}

impl fmt::Display for ErrorTemplate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut ctx = Context::new();
        ctx.insert("status", &SerializableStatusCode::from(self.status));
        // TEMPLATES.render_to() takes an io::Write, f implements fmt::Write
        write!(f, "{}", templates().render("errors/template.html", &ctx).unwrap_exit());
        Ok(())
    }
}

impl From<io::Error> for ErrorTemplate {
    fn from(err: io::Error) -> ErrorTemplate {
        use io::ErrorKind::*;

        ErrorTemplate {
            status: match err.kind() {
                NotFound => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            },
        }
    }
}

impl From<tera::Error> for ErrorTemplate {
    fn from(err: tera::Error) -> ErrorTemplate {
        use tera::ErrorKind::*;

        ErrorTemplate {
            status: match err.kind {
                TemplateNotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            }
        }
    }
}

#[derive(Serialize)]
struct SerializableStatusCode {
    status_code: u16,
    canonical_reason: &'static str,
}

impl From<StatusCode> for SerializableStatusCode {
    fn from(status: StatusCode) -> Self {
        Self {
            status_code: status.as_u16(),
            canonical_reason: status.canonical_reason().or(Some("[Reason not found]")).unwrap_exit(),
        }
    }
}