use serde::Deserialize;

#[derive(Deserialize)]
pub struct OldData {
    pub clients: Vec<OldClient>,
    pub projects: Vec<OldProject>,
    pub time_entries: Vec<OldTimeEntry>,
}

#[derive(Deserialize)]
pub struct OldClient {
    pub id: i32,
    pub name: String,
    pub email: String,
}

#[derive(Deserialize)]
pub struct OldProject {
    pub id: i32,
    pub name: String,
    pub client: String,
    pub rate: Option<f64>,
}

#[derive(Deserialize)]
pub struct OldTimeEntry {
    pub id: i32,
    pub projectId: i32,
    pub hours: f64,
    pub date: String,
}