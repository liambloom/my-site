use crate::tera;
use std::{io, convert::From, error::Error, fmt};
use actix_web::{HttpResponse, error::ResponseError, dev::HttpResponseBuilder,  http::StatusCode};
use serde::Serialize;
use ::tera::Context;

#[derive(Debug)]
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
        write!(f, "{}", tera().render("errors/template.html", &ctx).unwrap_exit())
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

pub trait UnwrapExit<T> {
    fn unwrap_exit(self) -> T;
}

impl<T, E: std::fmt::Display> UnwrapExit<T> for std::result::Result<T, E> {
    fn unwrap_exit(self) -> T {
        match self {
            Ok(v) => v,
            Err(e) => {
                eprintln!("{}", e);
                std::process::exit(1);
            }
        }
    }
}

impl<T> UnwrapExit<T> for Option<T> {
    fn unwrap_exit(self) -> T {
        match self {
            Some(v) => v,
            None => {
                eprintln!("Tried to unwrap `None` value");
                std::process::exit(1);
            }
        }
    }
}