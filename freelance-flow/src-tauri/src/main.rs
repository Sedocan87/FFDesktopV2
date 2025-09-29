#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod error;

use crate::error::Error;
use rusqlite::{Connection, OptionalExtension, params};
use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use reqwest;
use dotenv::dotenv;
use std::env;
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
// A utility function to get the path to the database file
fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, Error> {
    let config_dir = app_handle.path().app_config_dir()?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)?;
    }
    Ok(config_dir.join("app_data.db"))
}

#[tauri::command]
fn export_database(app_handle: AppHandle) -> Result<Vec<u8>, Error> {
    let db_path = get_db_path(&app_handle)?;
    Ok(fs::read(db_path)?)
}

#[tauri::command]
fn import_database(app_handle: AppHandle, data: Vec<u8>) -> Result<(), Error> {
    let db_path = get_db_path(&app_handle)?;
    fs::write(db_path, data)?;
    Ok(())
}

#[tauri::command]
fn load_all_data(app_handle: AppHandle) -> Result<AppData, Error> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)?;

    let mut stmt = conn.prepare("SELECT id, name, email FROM clients")?;
    let clients = stmt.query_map([], |row| {
        Ok(Client {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT id, name, client_id, rate FROM projects")?;
    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            client_id: row.get(2)?,
            rate: row.get(3)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT id, project_id, start_time, end_time FROM time_entries")?;
    let time_entries = stmt.query_map([], |row| {
        Ok(TimeEntry {
            id: row.get(0)?,
            project_id: row.get(1)?,
            start_time: row.get(2)?,
            end_time: row.get(3)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT id, client_name, issue_date, due_date, amount, status, currency FROM invoices")?;
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
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT id, project_id, description, amount, date, is_billed, is_billable FROM expenses")?;
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
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT company_name, company_email, company_address, logo FROM user_profile")?;
    let user_profile = stmt.query_row([], |row| {
        Ok(UserProfile {
            company_name: row.get(0)?,
            company_email: row.get(1)?,
            company_address: row.get(2)?,
            logo: row.get(3)?,
        })
    }).optional()?.unwrap_or_default();

    let mut stmt = conn.prepare("SELECT id, client_name, frequency, next_due_date, amount, currency, status FROM recurring_invoices")?;
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
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT rate, internal_cost_rate FROM tax_settings")?;
    let tax_settings = stmt.query_row([], |row| {
        Ok(TaxSettings {
            rate: row.get(0)?,
            internal_cost_rate: row.get(1)?,
        })
    }).optional()?.unwrap_or_default();

    let mut stmt = conn.prepare("SELECT default_currency, invoice_language FROM currency_settings")?;
    let currency_settings = stmt.query_row([], |row| {
        Ok(CurrencySettings {
            default_currency: row.get(0)?,
            invoice_language: row.get(1)?,
        })
    }).optional()?.unwrap_or_default();

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
fn save_all_data(app_handle: AppHandle, data: AppData) -> Result<(), Error> {
    let db_path = get_db_path(&app_handle)?;
    let mut conn = Connection::open(&db_path)?;

    let tx = conn.transaction()?;

    for client in &data.clients {
        tx.execute(
            "INSERT OR REPLACE INTO clients (id, name, email) VALUES (?1, ?2, ?3)",
            params![&client.id, &client.name, &client.email],
        )?;
    }

    for project in &data.projects {
        tx.execute(
            "INSERT OR REPLACE INTO projects (id, name, client_id, rate) VALUES (?1, ?2, ?3, ?4)",
            params![&project.id, &project.name, &project.client_id, &project.rate],
        )?;
    }

    for time_entry in &data.time_entries {
        tx.execute(
            "INSERT OR REPLACE INTO time_entries (id, project_id, start_time, end_time) VALUES (?1, ?2, ?3, ?4)",
            params![&time_entry.id, &time_entry.project_id, &time_entry.start_time, &time_entry.end_time],
        )?;
    }

    for invoice in &data.invoices {
        tx.execute(
            "INSERT OR REPLACE INTO invoices (id, client_name, issue_date, due_date, amount, status, currency) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&invoice.id, &invoice.client_name, &invoice.issue_date, &invoice.due_date, &invoice.amount, &invoice.status, &invoice.currency],
        )?;
    }

    for expense in &data.expenses {
        tx.execute(
            "INSERT OR REPLACE INTO expenses (id, project_id, description, amount, date, is_billed, is_billable) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&expense.id, &expense.project_id, &expense.description, &expense.amount, &expense.date, &expense.is_billed, &expense.is_billable],
        )?;
    }

    tx.execute(
        "INSERT OR REPLACE INTO user_profile (company_name, company_email, company_address, logo) VALUES (?1, ?2, ?3, ?4)",
        params![&data.user_profile.company_name, &data.user_profile.company_email, &data.user_profile.company_address, &data.user_profile.logo],
    )?;

    for recurring_invoice in &data.recurring_invoices {
        tx.execute(
            "INSERT OR REPLACE INTO recurring_invoices (id, client_name, frequency, next_due_date, amount, currency, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&recurring_invoice.id, &recurring_invoice.client_name, &recurring_invoice.frequency, &recurring_invoice.next_due_date, &recurring_invoice.amount, &recurring_invoice.currency, &recurring_invoice.status],
        )?;
    }

    tx.execute(
        "INSERT OR REPLACE INTO tax_settings (rate, internal_cost_rate) VALUES (?1, ?2)",
        params![&data.tax_settings.rate, &data.tax_settings.internal_cost_rate],
    )?;

    tx.execute(
        "INSERT OR REPLACE INTO currency_settings (default_currency, invoice_language) VALUES (?1, ?2)",
        params![&data.currency_settings.default_currency, &data.currency_settings.invoice_language],
    )?;

    tx.commit()?;

    Ok(())
}

use serde::{Deserialize, Serialize};

#[tauri::command]
fn get_trial_start_date(app_handle: AppHandle) -> Result<Option<String>, Error> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)?;
    let mut stmt = conn.prepare("SELECT start_date FROM trial_info")?;
    let mut rows = stmt.query([])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn set_trial_start_date(app_handle: AppHandle, start_date: String) -> Result<(), Error> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)?;
    conn.execute("INSERT INTO trial_info (start_date) VALUES (?1)", params![start_date])?;
    Ok(())
}

#[tauri::command]
fn check_trial_status(app_handle: AppHandle) -> Result<i64, Error> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)?;
    let mut stmt = conn.prepare("SELECT start_date FROM trial_info")?;
    let mut rows = stmt.query([])?;
    if let Some(row) = rows.next()? {
        let start_date_str: String = row.get(0)?;
        let start_date = chrono::NaiveDate::parse_from_str(&start_date_str, "%Y-%m-%d")
            .map_err(|e| Error::DateParse(e.to_string()))?;
        let now = chrono::Local::now().naive_local().date();
        let duration = now.signed_duration_since(start_date);
        let days_left = 14 - duration.num_days();
        Ok(days_left)
    } else {
        Ok(14)
    }
}

// Define structs to match Lemon Squeezy's API response

// Define structs to match Lemon Squeezy's API response
#[derive(Serialize, Deserialize, Debug)]
struct LicenseKey {
    activated: bool,
    // Add other fields you might need from the response
}

#[derive(Serialize, Deserialize, Debug)]
struct ApiResponse {
    valid: bool,
    license_key: LicenseKey,
}

// A new struct for the request body to our proxy
#[derive(Serialize)]
struct ProxyRequestBody<'a> {
    #[serde(rename = "licenseKey")]
    license_key: &'a str,
    #[serde(rename = "instanceId")]
    instance_id: &'a str,
}

#[tauri::command]
async fn activate_license(license_key: String) -> Result<bool, Error> {
    // !!! IMPORTANT !!!
    // 1. REPLACE THIS WITH YOUR REAL VERCEL URL
    const PROXY_URL: &str = "https://your-project-name.vercel.app/api/activate";
    // 2. GENERATE A STRONG, RANDOM SECRET AND REPLACE THIS
    const INTERNAL_API_KEY: &str = "REPLACE_WITH_YOUR_STRONG_SECRET_KEY";

    let instance_id = machine_uid::get().map_err(|_| Error::MachineId)?;

    let client = reqwest::Client::new();

    let body = ProxyRequestBody {
        license_key: &license_key,
        instance_id: &instance_id,
    };

    let res = client.post(PROXY_URL)
        .bearer_auth(INTERNAL_API_KEY)
        .json(&body)
        .send()
        .await?;

    if res.status().is_success() {
        // The proxy forwards the Lemon Squeezy response, so we can use the same ApiResponse struct
        let body: ApiResponse = res.json().await?;
        if body.valid && body.license_key.activated {
            // Here, you should save the license key to a local file or the database
            // to check on future app startups.
            Ok(true)
        } else {
            Err(Error::InvalidLicense)
        }
    } else {
        // Forward the error from the proxy
        let error_message = res.text().await?;
        Err(Error::Api(error_message))
    }
}

fn main() {
    dotenv().ok();
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            let db_path = get_db_path(&handle)?;
            let conn = Connection::open(&db_path)?;

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
                CREATE TABLE IF NOT EXISTS trial_info (
                    start_date TEXT NOT NULL
                );
                "
            )?;

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
            activate_license,
            get_trial_start_date,
            set_trial_start_date,
            check_trial_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}