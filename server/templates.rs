use crate::error::UnwrapExit;
use std::{sync::Once, ptr, mem};
use tera::Tera;

#[cfg(debug_assertions)]
use std::{sync::{RwLock, RwLockReadGuard, Mutex}, fs::{read_dir, ReadDir, read, read_link}};
#[cfg(debug_assertions)]
use sha1::{Sha1, Digest};

fn tera_init() -> Tera {
    Tera::new("templates/**/*").unwrap_exit()
}

#[cfg(debug_assertions)]
pub fn tera() -> RwLockReadGuard<'static, Tera> {
    static ONCE: Once = Once::new();
    static mut TERA: *const RwLock<Tera> = ptr::null();
    static mut HASH: *const Mutex<[u8; 20]> = ptr::null();

    unsafe {
        ONCE.call_once(|| {
            TERA = mem::transmute(Box::new(RwLock::new(tera_init())));
            HASH = mem::transmute(Box::new(Mutex::new(get_hash())))
        });

        let new_hash = get_hash();
        let mut old_hash = (*HASH).lock().unwrap_exit();
        if *old_hash != new_hash {
            (*TERA).write().unwrap_exit().full_reload().unwrap_exit();
            *old_hash = new_hash;
        }

        drop(old_hash);

        (*TERA).read().unwrap_exit()
    }
}

#[cfg(debug_assertions)]
fn get_hash() -> [u8; 20] {
    let mut hasher = Sha1::new();
    hash_dir(&mut hasher, read_dir("templates").unwrap_exit());
    *hasher.finalize().as_mut()
}

#[cfg(debug_assertions)]
fn hash_dir(hasher: &mut Sha1, dir: ReadDir) {
    for entry in dir {
        let entry = entry.unwrap_exit();
        hasher.update(entry.file_name().into_string().expect("Failed to convert OsString"));
        let mut meta = entry.file_type().unwrap_exit();
        while meta.is_symlink() {
            meta = read_link(entry.path()).unwrap_exit().metadata().unwrap_exit().file_type();
        }
        if meta.is_dir() {
            hash_dir(hasher, read_dir(entry.path()).unwrap_exit());
        }
        else {
            debug_assert!(meta.is_file());
            hasher.update(read(entry.path()).unwrap_exit());
        }
    }
}

#[cfg(not(debug_assertions))]
fn tera() -> &'static Tera {
    static ONCE: Once = Once::new();
    static mut TERA: *const Tera = ptr::null();

    unsafe {
        ONCE.call_once(|| {
            TERA = mem::transmute(Box::new(tera_init()));
        });

        &*TERA
    }
}