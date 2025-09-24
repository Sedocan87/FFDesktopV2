#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod old_models;

use tauri::{AppHandle, Manager, State};
use rusqlite::Connection;
use std::sync::Mutex;

pub struct AppState {
    db: Mutex<Option<Connection>>,
}

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error("Mutex lock error")]
    Mutex,
    #[error("Database connection closed")]
    DbClosed,
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

type Result<T, E = Error> = std::result::Result<T, E>;

#[tauri::command]
fn delete_database(app: AppHandle, state: State<AppState>) -> Result<(), String> {
    let mut db = state.db.lock().unwrap();
    if let Some(conn) = db.take() {
        conn.close().map_err(|(_, e)| e.to_string())?;
    }

    let db_path = db::get_db_path(&app);
    if db_path.exists() {
        match std::fs::remove_file(&db_path) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete database: {}", e)),
        }
    } else {
        Ok(())
    }
}

// ... the rest of the file

#[tauri::command]
fn get_clients(state: State<AppState>) -> Result<Vec<models::Client>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, name, email FROM clients")?;
        let clients = stmt.query_map([], |row| {
            Ok(models::Client {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(clients)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_client(state: State<AppState>, name: String, email: Option<String>) -> Result<i64> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO clients (name, email) VALUES (?1, ?2)",
            rusqlite::params![name, email],
        )?;
        Ok(conn.last_insert_rowid())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_client(state: State<AppState>, id: i32, name: String, email: Option<String>) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE clients SET name = ?1, email = ?2 WHERE id = ?3",
            rusqlite::params![name, email, id],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_client(state: State<AppState>, id: i32) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM clients WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_project(state: State<AppState>, name: String, client_id: i32, rate: Option<f64>) -> Result<i64> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO projects (name, client_id, rate) VALUES (?1, ?2, ?3)",
            rusqlite::params![name, client_id, rate],
        )?;
        Ok(conn.last_insert_rowid())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_project(state: State<AppState>, id: i32, name: String, client_id: i32, rate: Option<f64>) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE projects SET name = ?1, client_id = ?2, rate = ?3 WHERE id = ?4",
            rusqlite::params![name, client_id, rate, id],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_project(state: State<AppState>, id: i32) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM projects WHERE id = ?1", rusqlite::params![id])?;
        Ok(())}
     else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_time_entry(state: State<AppState>, project_id: i32, start_time: String, end_time: Option<String>) -> Result<i64> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO time_entries (project_id, start_time, end_time) VALUES (?1, ?2, ?3)",
            rusqlite::params![project_id, start_time, end_time],
        )?;
        Ok(conn.last_insert_rowid())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_time_entry(state: State<AppState>, id: i32, project_id: i32, start_time: String, end_time: Option<String>) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE time_entries SET project_id = ?1, start_time = ?2, end_time = ?3 WHERE id = ?4",
            rusqlite::params![project_id, start_time, end_time, id],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_time_entry(state: State<AppState>, id: i32) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM time_entries WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_projects(state: State<AppState>) -> Result<Vec<models::Project>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, name, client_id, rate FROM projects")?;
        let projects = stmt.query_map([], |row| {
            Ok(models::Project {
                id: row.get(0)?,
                name: row.get(1)?,
                client_id: row.get(2)?,
                rate: row.get(3)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(projects)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_time_entries(state: State<AppState>) -> Result<Vec<models::TimeEntry>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, project_id, start_time, end_time FROM time_entries")?;
        let time_entries = stmt.query_map([], |row| {
            Ok(models::TimeEntry {
                id: row.get(0)?,
                project_id: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(time_entries)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_invoices(state: State<AppState>) -> Result<Vec<models::Invoice>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, client_name, issue_date, due_date, amount, status, currency FROM invoices")?;
        let invoices = stmt.query_map([], |row| {
            Ok(models::Invoice {
                id: row.get(0)?,
                client_name: row.get(1)?,
                issue_date: row.get(2)?,
                due_date: row.get(3)?,
                amount: row.get(4)?,
                status: row.get(5)?,
                currency: row.get(6)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(invoices)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_invoice(state: State<AppState>, invoice: models::Invoice) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO invoices (id, client_name, issue_date, due_date, amount, status, currency) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![invoice.id, invoice.client_name, invoice.issue_date, invoice.due_date, invoice.amount, invoice.status, invoice.currency],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_invoice(state: State<AppState>, invoice: models::Invoice) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE invoices SET client_name = ?1, issue_date = ?2, due_date = ?3, amount = ?4, status = ?5, currency = ?6 WHERE id = ?7",
            rusqlite::params![invoice.client_name, invoice.issue_date, invoice.due_date, invoice.amount, invoice.status, invoice.currency, invoice.id],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_invoice(state: State<AppState>, id: String) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM invoices WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_expenses(state: State<AppState>) -> Result<Vec<models::Expense>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, project_id, description, amount, date, is_billed, is_billable FROM expenses")?;
        let expenses = stmt.query_map([], |row| {
            Ok(models::Expense {
                id: row.get(0)?,
                project_id: row.get(1)?,
                description: row.get(2)?,
                amount: row.get(3)?,
                date: row.get(4)?,
                is_billed: row.get(5)?,
                is_billable: row.get(6)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(expenses)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_expense(state: State<AppState>, expense: models::Expense) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO expenses (id, project_id, description, amount, date, is_billed, is_billable) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![expense.id, expense.project_id, expense.description, expense.amount, expense.date, expense.is_billed, expense.is_billable],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_expense(state: State<AppState>, expense: models::Expense) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE expenses SET project_id = ?1, description = ?2, amount = ?3, date = ?4, is_billed = ?5, is_billable = ?6 WHERE id = ?7",
            rusqlite::params![expense.project_id, expense.description, expense.amount, expense.date, expense.is_billed, expense.is_billable, expense.id],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_expense(state: State<AppState>, id: i32) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM expenses WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_user_profile(state: State<AppState>) -> Result<models::UserProfile> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT company_name, company_email, company_address, logo FROM user_profile")?;
        let profile = stmt.query_row([], |row| {
            Ok(models::UserProfile {
                company_name: row.get(0)?,
                company_email: row.get(1)?,
                company_address: row.get(2)?,
                logo: row.get(3)?,
            })
        })?;
        Ok(profile)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_user_profile(state: State<AppState>, profile: models::UserProfile) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE user_profile SET company_name = ?1, company_email = ?2, company_address = ?3, logo = ?4 WHERE id = 1",
            rusqlite::params![profile.company_name, profile.company_email, profile.company_address, profile.logo],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_recurring_invoices(state: State<AppState>) -> Result<Vec<models::RecurringInvoice>> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT id, client_name, frequency, next_due_date, amount, currency FROM recurring_invoices")?;
        let invoices = stmt.query_map([], |row| {
            Ok(models::RecurringInvoice {
                id: row.get(0)?,
                client_name: row.get(1)?,
                frequency: row.get(2)?,
                next_due_date: row.get(3)?,
                amount: row.get(4)?,
                currency: row.get(5)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        Ok(invoices)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn add_recurring_invoice(state: State<AppState>, invoice: models::RecurringInvoice) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "INSERT INTO recurring_invoices (id, client_name, frequency, next_due_date, amount, currency) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![invoice.id, invoice.client_name, invoice.frequency, invoice.next_due_date, invoice.amount, invoice.currency],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_recurring_invoice(state: State<AppState>, invoice: models::RecurringInvoice) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE recurring_invoices SET client_name = ?1, frequency = ?2, next_due_date = ?3, amount = ?4, currency = ?5 WHERE id = ?6",
            rusqlite::params![invoice.client_name, invoice.frequency, invoice.next_due_date, invoice.amount, invoice.currency, invoice.id],
        )?;
        Ok(())}
     else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn delete_recurring_invoice(state: State<AppState>, id: i32) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute("DELETE FROM recurring_invoices WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_tax_settings(state: State<AppState>) -> Result<models::TaxSettings> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT rate, internal_cost_rate FROM tax_settings")?;
        let settings = stmt.query_row([], |row| {
            Ok(models::TaxSettings {
                rate: row.get(0)?,
                internal_cost_rate: row.get(1)?,
            })
        })?;
        Ok(settings)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_tax_settings(state: State<AppState>, settings: models::TaxSettings) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE tax_settings SET rate = ?1, internal_cost_rate = ?2 WHERE id = 1",
            rusqlite::params![settings.rate, settings.internal_cost_rate],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn get_currency_settings(state: State<AppState>) -> Result<models::CurrencySettings> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        let mut stmt = conn.prepare("SELECT default_currency, invoice_language FROM currency_settings")?;
        let settings = stmt.query_row([], |row| {
            Ok(models::CurrencySettings {
                default: row.get(0)?,
                invoice_language: row.get(1)?,
            })
        })?;
        Ok(settings)
    } else {
        Err(Error::DbClosed)
    }
}

#[tauri::command]
fn update_currency_settings(state: State<AppState>, settings: models::CurrencySettings) -> Result<()> {
    let db = state.db.lock().map_err(|_| Error::Mutex)?;
    if let Some(conn) = &*db {
        conn.execute(
            "UPDATE currency_settings SET default_currency = ?1, invoice_language = ?2 WHERE id = 1",
            rusqlite::params![settings.default, settings.invoice_language],
        )?;
        Ok(())
    } else {
        Err(Error::DbClosed)
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let db_path = db::get_db_path(handle);
            let conn = Connection::open(db_path).expect("Failed to open database");
            db::initialize_db(&conn).expect("Failed to initialize database");
            db::migrate_data(handle, &conn).expect("Failed to migrate data");
            app.manage(AppState {
                db: Mutex::new(Some(conn)),
            });
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            delete_database,
            get_clients,
            add_client,
            update_client,
            delete_client,
            get_projects,
            add_project,
            update_project,
            delete_project,
            get_time_entries,
            add_time_entry,
            update_time_entry,
            delete_time_entry,
            get_invoices,
            add_invoice,
            update_invoice,
            delete_invoice,
            get_expenses,
            add_expense,
            update_expense,
            delete_expense,
            get_user_profile,
            update_user_profile,
            get_recurring_invoices,
            add_recurring_invoice,
            update_recurring_invoice,
            delete_recurring_invoice,
            get_tax_settings,
            update_tax_settings,
            get_currency_settings,
            update_currency_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}