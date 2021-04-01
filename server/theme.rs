use std::fmt;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum Theme {
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