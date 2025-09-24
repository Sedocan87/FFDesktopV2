use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let path = app.path().app_data_dir().expect("Failed to get app data dir");
    if !path.exists() {
        std::fs::create_dir_all(&path).expect("Failed to create app data dir");
    }
    path.join("freelanceflow.db")
}

pub fn initialize_db(conn: &Connection) -> Result<(), rusqlite::Error> {

    conn.execute(
        "CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            client_id INTEGER,
            rate REAL,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            currency TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            is_billed INTEGER NOT NULL,
            is_billable INTEGER NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            company_email TEXT,
            company_address TEXT,
            logo BLOB
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS recurring_invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            frequency TEXT NOT NULL,
            next_due_date TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tax_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rate REAL NOT NULL,
            internal_cost_rate REAL NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS currency_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            default_currency TEXT NOT NULL,
            invoice_language TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

pub fn migrate_data(app: &AppHandle, conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let old_data_path = app.path().app_data_dir().unwrap().join("freelanceflow-data.json");
    if !old_data_path.exists() {
        return Ok(());
    }

    let old_data_json = std::fs::read_to_string(old_data_path)?;
    let old_data: crate::old_models::OldData = serde_json::from_str(&old_data_json)?;

    for client in old_data.clients {
        conn.execute(
            "INSERT OR IGNORE INTO clients (id, name, email) VALUES (?1, ?2, ?3)",
            rusqlite::params![client.id, client.name, client.email],
        )?;
    }

    let client_map: std::collections::HashMap<String, i32> = conn
        .prepare("SELECT id, name FROM clients")?
        .query_map([], |row| Ok((row.get(1)?, row.get(0)?)))?
        .collect::<Result<_, _>>()?;

    for project in old_data.projects {
        if let Some(client_id) = client_map.get(&project.client) {
            conn.execute(
                "INSERT OR IGNORE INTO projects (id, name, client_id, rate) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![project.id, project.name, client_id, project.rate],
            )?;
        }
    }

    for entry in old_data.time_entries {
        let start_time = format!("{}T00:00:00.000Z", entry.date);
        let hours = entry.hours.floor();
        let minutes = ((entry.hours - hours) * 60.0).round();
        let end_time = format!("{}T{:02}:{:02}:00.000Z", entry.date, hours as u32, minutes as u32);

        conn.execute(
            "INSERT OR IGNORE INTO time_entries (id, project_id, start_time, end_time) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![entry.id, entry.project_id, start_time, end_time],
        )?;
    }

    Ok(())
}