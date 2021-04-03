use std::fmt;
use serde::Serialize;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize)]
pub enum Theme {
    Light,
    Dark,
    Auto,
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

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize)]
pub struct ThemeData {
    auto: Theme,
    variants: [Theme; 3],
}

pub const THEME_DATA: ThemeData = ThemeData {
    auto: Theme::Auto,
    variants: [Theme::Light, Theme::Dark, Theme::Auto],
};