use crate::error::UnwrapExit;
use std::{sync::Once, ptr, mem};
use tera::Tera;

#[cfg(debug_assertions)]
use std::{time::Duration, sync::{RwLock, RwLockReadGuard, Mutex, mpsc::{channel, Receiver}}};
#[cfg(debug_assertions)]
use notify::{Watcher, RecursiveMode, RecommendedWatcher, DebouncedEvent};

fn tera_init() -> Tera {
    Tera::new("templates/**/*").unwrap_exit()
}

#[cfg(debug_assertions)]
pub fn tera() -> RwLockReadGuard<'static, Tera> {
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