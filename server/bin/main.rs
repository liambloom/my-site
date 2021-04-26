// use actix_web::{App, HttpServer};
// use actix_files::Files;
// use server::{*, error::UnwrapExit, templates::tera};
// use std::{io::Result, env};

// #[actix_web::main]
// async fn main() -> Result<()> {
//     let port = match env::var("PORT") {
//         Ok(port) => port.parse().unwrap_exit(),
//         Err(_) => 8080
//     };

//     let _ = tera();
    
//     HttpServer::new(|| {
//         App::new()
//         .service(default_template)
//         .service(page)
//         .service(favicon)
//         .service(Files::new("", "."))
//     })
//         .bind(("127.0.0.1", port))?
//         .bind(("::1", port))?
//         .bind(format!(":{}", port))?
//         .run()
//         .await
// }

#[cfg(not(any(feature = "dev", feature = "release")))]
compile_error!("You must specify either dev or release feature");

#[cfg(all(feature = "dev", feature = "release"))]
compile_error!("You cannot specify both dev and release feature");

#[cfg(all(feature = "dev", not(debug_assertions)))]
compile_error!("Feature dev is requires with debug_assertions");

#[cfg(all(feature = "release", debug_assertions))]
compile_error!("Feature release is mutually exclusive with debug_assertions");

fn main() {
    println!("Hello, world!");
}