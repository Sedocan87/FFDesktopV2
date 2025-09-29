use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Rusqlite(#[from] rusqlite::Error),

    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error("Database not initialized")]
    DatabaseNotInitialized,

    #[error("Failed to get machine ID")]
    MachineId,

    #[error("API request failed: {0}")]
    Api(String),

    #[error("License is not valid")]
    InvalidLicense,

    #[error("Date parsing error: {0}")]
    DateParse(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}