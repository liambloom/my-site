use actix_web::{get, HttpResponse, Result, http::header, web::Query};
use actix_files::NamedFile;
//use askama::Template;
use chrono::{Utc, Datelike};
//use std::borrow::Borrow;
use std::{sync::Once, ptr, mem};
#[cfg(debug_assertions)]
use std::{time::Duration, sync::{RwLock, RwLockReadGuard, Mutex, mpsc::{channel, Receiver}}, path::{Path, PathBuf}};
#[cfg(debug_assertions)]
use notify::{Watcher, RecursiveMode, RecommendedWatcher, RawEvent, DebouncedEvent};
//use checksums::{Algorithm, hash_file, ops::{create_hashes, compare_hashes}};
use serde::Deserialize;
use tera::{Tera, Context};
//use lazy_static::lazy_static;

/*lazy_static! {
    static ref TEMPLATES: Tera = Tera::new("templates/**/*").unwrap_exit();

    #[cfg(debug_assertions)]
    static ref LAST_LOADED: SystemTime = SystemTime::now();
}*/

//static TEMPLATES: LazyTera = LazyTera;

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
            .body(templates().render("template.html", &ctx)
                .unwrap_exit())
    }
    
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile> {
    Ok(NamedFile::open("img/favicon/favicon.ico")?)
}

fn tera_init() -> Tera {
    Tera::new("templates/**/*").unwrap_exit()
}

#[cfg(debug_assertions)]
pub fn templates() -> RwLockReadGuard<'static, Tera> {
    static ONCE: Once = Once::new();
    static mut TERA: *const RwLock<Tera> = ptr::null();
    static mut WATCHER: *const RecommendedWatcher = ptr::null();
    static mut RCV: *const Mutex<Receiver<DebouncedEvent>> = ptr::null();

    unsafe {
        ONCE.call_once(|| {
            let (tx, rx) = channel();
            TERA = mem::transmute(Box::new(RwLock::new(tera_init())));
            WATCHER = mem::transmute(Box::new({
                let mut watcher: RecommendedWatcher = Watcher::new(tx, Duration::from_millis(0)).unwrap_exit();
                watcher.watch("templates", RecursiveMode::Recursive).unwrap_exit();
                watcher
            }));
            RCV = mem::transmute(Box::new(Mutex::new(rx)));
        });

        let rcv = (*RCV).lock().unwrap_exit();
        let mut changed = false;
        for _ in rcv.try_iter() {
            changed = true;
        }

        if changed {
            (*TERA).write().unwrap_exit().full_reload().unwrap_exit();
        }

        drop(rcv);

        (*TERA).read().unwrap_exit()
    }
}

/*#[cfg(debug_assertions)]
fn templates() -> RwLockReadGuard<'static, Tera> {
    static ONCE: Once = Once::new();
    static mut TERA: *const RwLock<Tera> = ptr::null();
    //static mut HASH: *const Mutex<[u8; 20]> = ptr::null();
    //static mut LAST_LOADED: *const Mutex<SystemTime> = ptr::null();
    // TODO: Can I remove watcher and just initiate it?
    /*static mut WATCHER: *const RecommendedWatcher = ptr::null();
    static mut RCV: *const Mutex<Receiver<RawEvent>> = ptr::null();*/
    static mut HASH: *const Mutex<String> = ptr::null();//Mutex::new(None);

    unsafe {
        ONCE.call_once(|| {
            //let (tx, rx) = channel();
            TERA = mem::transmute(Box::new(RwLock::new(tera_init())));
            /*WATCHER = mem::transmute(Box::new({
                let mut watcher: RecommendedWatcher = Watcher::new(tx, Duration::from_millis(0)).unwrap_exit();
                watcher.watch("templates", RecursiveMode::Recursive).unwrap_exit();
                watcher
            }));
            RCV = mem::transmute(Box::new(rx));*/
            //LAST_LOADED = mem::transmute(Box::new(Mutex::new(SystemTime::now())));
            //HASH = Sha1::digest(fs::read_dir("templates").unwrap_exit());
            HASH = mem::transmute(Box::new(Mutex::new(hash_file(Path::new("templates"), Algorithm::SHA1))));
        });

        
        //let mut last_loaded = (*LAST_LOADED).lock().unwrap_exit();
        //println!("Last Loaded:   {:?}", last_loaded);
        //println!("Last Modified: {:?}", fs::metadata("templates").unwrap_exit().modified().unwrap_exit());

        /*let rcv = (*RCV).lock().unwrap_exit();
        let mut changed = false;
        for _ in rcv.try_iter() {
            changed = true;
        }*/
        let new_hash = hash_file(Path::new("templates"), Algorithm::SHA1);
        let mut old_hash = (*HASH).lock().unwrap_exit();
        if new_hash != *old_hash /*last_loaded.duration_since(fs::metadata("templates").unwrap_exit().modified().unwrap_exit()).is_err()*/ {
            (*TERA).write().unwrap_exit().full_reload().unwrap_exit();
            *old_hash = new_hash;
            // *last_loaded = SystemTime::now();
        }
        drop(old_hash);

        (*TERA).read().unwrap_exit()
    }
}*/

#[cfg(not(debug_assertions))]
fn templates() -> &'static Tera {
    static ONCE: Once = Once::new();
    static mut TERA: *const Tera = ptr::null();

    unsafe {
        ONCE.call_once(|| {
            TERA = mem::transmute(Box::new(tera_init()));
        });

        &*TERA
    }
}

/*#[cfg(debug_assertions)]
async fn update_templates() {
    
}*/

trait UnwrapExit<T> {
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