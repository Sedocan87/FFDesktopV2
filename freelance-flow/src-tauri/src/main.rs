#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;

use rusqlite::{Connection, Result, params};
use tauri::{AppHandle, Manager, State};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use models::{
    Client, Project, TimeEntry, Invoice, Expense, UserProfile,
    RecurringInvoice, TaxSettings, CurrencySettings,
};

// The entire state of the application
#[derive(serde::Serialize, serde::Deserialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppData {
    clients: Vec<Client>,
    projects: Vec<Project>,
    time_entries: Vec<TimeEntry>,
    invoices: Vec<Invoice>,
    expenses: Vec<Expense>,
    user_profile: UserProfile,
    recurring_invoices: Vec<RecurringInvoice>,
    tax_settings: TaxSettings,
    currency_settings: CurrencySettings,
}

// A struct to hold the database connection in a thread-safe Mutex
pub struct AppState {
    db: Mutex<Connection>,
}

// A utility function to get the path to the database file
fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).unwrap();
    }
    config_dir.join("app_data.db")
}

#[tauri::command]
fn export_database(app_handle: AppHandle) -> Result<Vec<u8>, String> {
    let db_path = get_db_path(&app_handle);
    fs::read(db_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_database(app_handle: AppHandle, data: Vec<u8>) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    fs::write(db_path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_all_data(app_handle: AppHandle) -> Result<AppData, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, name, email FROM clients").unwrap();
    let clients = stmt.query_map([], |row| {
        Ok(Client {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT id, name, client_id, rate FROM projects").unwrap();
    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            client_id: row.get(2)?,
            rate: row.get(3)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT id, project_id, start_time, end_time FROM time_entries").unwrap();
    let time_entries = stmt.query_map([], |row| {
        Ok(TimeEntry {
            id: row.get(0)?,
            project_id: row.get(1)?,
            start_time: row.get(2)?,
            end_time: row.get(3)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT id, client_name, issue_date, due_date, amount, status, currency FROM invoices").unwrap();
    let invoices = stmt.query_map([], |row| {
        Ok(Invoice {
            id: row.get(0)?,
            client_name: row.get(1)?,
            issue_date: row.get(2)?,
            due_date: row.get(3)?,
            amount: row.get(4)?,
            status: row.get(5)?,
            currency: row.get(6)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT id, project_id, description, amount, date, is_billed, is_billable FROM expenses").unwrap();
    let expenses = stmt.query_map([], |row| {
        Ok(Expense {
            id: row.get(0)?,
            project_id: row.get(1)?,
            description: row.get(2)?,
            amount: row.get(3)?,
            date: row.get(4)?,
            is_billed: row.get(5)?,
            is_billable: row.get(6)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT company_name, company_email, company_address, logo FROM user_profile").unwrap();
    let user_profile = stmt.query_row([], |row| {
        Ok(UserProfile {
            company_name: row.get(0)?,
            company_email: row.get(1)?,
            company_address: row.get(2)?,
            logo: row.get(3)?,
        })
    }).unwrap_or_default();

    let mut stmt = conn.prepare("SELECT id, client_name, frequency, next_due_date, amount, currency, status FROM recurring_invoices").unwrap();
    let recurring_invoices = stmt.query_map([], |row| {
        Ok(RecurringInvoice {
            id: row.get(0)?,
            client_name: row.get(1)?,
            frequency: row.get(2)?,
            next_due_date: row.get(3)?,
            amount: row.get(4)?,
            currency: row.get(5)?,
            status: row.get(6)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    let mut stmt = conn.prepare("SELECT rate, internal_cost_rate FROM tax_settings").unwrap();
    let tax_settings = stmt.query_row([], |row| {
        Ok(TaxSettings {
            rate: row.get(0)?,
            internal_cost_rate: row.get(1)?,
        })
    }).unwrap_or_default();

    let mut stmt = conn.prepare("SELECT default_currency, invoice_language FROM currency_settings").unwrap();
    let currency_settings = stmt.query_row([], |row| {
        Ok(CurrencySettings {
            default_currency: row.get(0)?,
            invoice_language: row.get(1)?,
        })
    }).unwrap_or_default();

    Ok(AppData {
        clients,
        projects,
        time_entries,
        invoices,
        expenses,
        user_profile,
        recurring_invoices,
        tax_settings,
        currency_settings,
    })
}

#[tauri::command]
fn save_all_data(app_handle: AppHandle, data: AppData) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let tx = conn.transaction().unwrap();

    tx.execute("DELETE FROM clients", []).unwrap();
    for client in &data.clients {
        tx.execute(
            "INSERT INTO clients (id, name, email) VALUES (?1, ?2, ?3)",
            params![&client.id, &client.name, &client.email],
        ).unwrap();
    }

    tx.execute("DELETE FROM projects", []).unwrap();
    for project in &data.projects {
        tx.execute(
            "INSERT INTO projects (id, name, client_id, rate) VALUES (?1, ?2, ?3, ?4)",
            params![&project.id, &project.name, &project.client_id, &project.rate],
        ).unwrap();
    }

    tx.execute("DELETE FROM time_entries", []).unwrap();
    for time_entry in &data.time_entries {
        tx.execute(
            "INSERT INTO time_entries (id, project_id, start_time, end_time) VALUES (?1, ?2, ?3, ?4)",
            params![&time_entry.id, &time_entry.project_id, &time_entry.start_time, &time_entry.end_time],
        ).unwrap();
    }

    tx.execute("DELETE FROM invoices", []).unwrap();
    for invoice in &data.invoices {
        tx.execute(
            "INSERT INTO invoices (id, client_name, issue_date, due_date, amount, status, currency) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&invoice.id, &invoice.client_name, &invoice.issue_date, &invoice.due_date, &invoice.amount, &invoice.status, &invoice.currency],
        ).unwrap();
    }

    tx.execute("DELETE FROM expenses", []).unwrap();
    for expense in &data.expenses {
        tx.execute(
            "INSERT INTO expenses (id, project_id, description, amount, date, is_billed, is_billable) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&expense.id, &expense.project_id, &expense.description, &expense.amount, &expense.date, &expense.is_billed, &expense.is_billable],
        ).unwrap();
    }

    tx.execute("DELETE FROM user_profile", []).unwrap();
    tx.execute(
        "INSERT INTO user_profile (company_name, company_email, company_address, logo) VALUES (?1, ?2, ?3, ?4)",
        params![&data.user_profile.company_name, &data.user_profile.company_email, &data.user_profile.company_address, &data.user_profile.logo],
    ).unwrap();

    tx.execute("DELETE FROM recurring_invoices", []).unwrap();
    for recurring_invoice in &data.recurring_invoices {
        tx.execute(
            "INSERT INTO recurring_invoices (id, client_name, frequency, next_due_date, amount, currency, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&recurring_invoice.id, &recurring_invoice.client_name, &recurring_invoice.frequency, &recurring_invoice.next_due_date, &recurring_invoice.amount, &recurring_invoice.currency, &recurring_invoice.status],
        ).unwrap();
    }

    tx.execute("DELETE FROM tax_settings", []).unwrap();
    tx.execute(
        "INSERT INTO tax_settings (rate, internal_cost_rate) VALUES (?1, ?2)",
        params![&data.tax_settings.rate, &data.tax_settings.internal_cost_rate],
    ).unwrap();

    tx.execute("DELETE FROM currency_settings", []).unwrap();
    tx.execute(
        "INSERT INTO currency_settings (default_currency, invoice_language) VALUES (?1, ?2)",
        params![&data.currency_settings.default_currency, &data.currency_settings.invoice_language],
    ).unwrap();

    tx.commit().unwrap();

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            let db_path = get_db_path(&handle);
            let conn = Connection::open(&db_path).expect("Failed to open database");

            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS clients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT
                );
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    client_id TEXT NOT NULL,
                    rate REAL
                );
                CREATE TABLE IF NOT EXISTS time_entries (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT
                );
                CREATE TABLE IF NOT EXISTS invoices (
                    id TEXT PRIMARY KEY,
                    client_name TEXT NOT NULL,
                    issue_date TEXT NOT NULL,
                    due_date TEXT NOT NULL,
                    amount REAL NOT NULL,
                    status TEXT NOT NULL,
                    currency TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS expenses (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    is_billed INTEGER NOT NULL,
                    is_billable INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS user_profile (
                    company_name TEXT NOT NULL,
                    company_email TEXT NOT NULL,
                    company_address TEXT NOT NULL,
                    logo BLOB
                );
                CREATE TABLE IF NOT EXISTS recurring_invoices (
                    id TEXT PRIMARY KEY,
                    client_name TEXT NOT NULL,
                    frequency TEXT NOT NULL,
                    next_due_date TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT NOT NULL,
                    status TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tax_settings (
                    rate REAL NOT NULL,
                    internal_cost_rate REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS currency_settings (
                    default_currency TEXT NOT NULL,
                    invoice_language TEXT NOT NULL
                );
                "
            ).expect("Failed to create tables");

            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            export_database,
            import_database,
            load_all_data,
            save_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}