#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;

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

// A struct to hold the application state in a thread-safe Mutex
pub struct AppState {
    app_data: Mutex<AppData>,
}

// A utility function to get the path to the data file
fn get_data_path(app_handle: &AppHandle) -> PathBuf {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).unwrap();
    }
    config_dir.join("app_data.json")
}

// Command to load all data from the JSON file
#[tauri::command]
fn load_all_data(app_handle: AppHandle, state: State<AppState>) -> Result<AppData, String> {
    let data_path = get_data_path(&app_handle);
    if !data_path.exists() {
        // If the file doesn't exist, return the default (empty) state
        return Ok(AppData::default());
    }

    let data = fs::read_to_string(data_path).map_err(|e| e.to_string())?;
    let app_data: AppData = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    // Update the in-memory state
    let mut state_data = state.app_data.lock().unwrap();
    *state_data = app_data;

    // Return the loaded data to the frontend
    Ok(serde_json::from_str(&data).map_err(|e| e.to_string())?)
}

// Command to save all data to the JSON file
#[tauri::command]
fn save_all_data(app_handle: AppHandle, data: AppData, state: State<AppState>) -> Result<(), String> {
    let data_path = get_data_path(&app_handle);
    let json_data = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(data_path, json_data).map_err(|e| e.to_string())?;

    // Update the in-memory state
    let mut state_data = state.app_data.lock().unwrap();
    *state_data = data;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            app_data: Mutex::new(AppData::default()),
        })
        .setup(|app| {
            let handle = app.handle().clone();
            let app_state: State<AppState> = app.state();
            // Load the data when the app starts up
            match load_all_data(handle, app_state.clone()) {
                Ok(data) => {
                    let mut state_data = app_state.app_data.lock().unwrap();
                    *state_data = data;
                }
                Err(e) => {
                    // This might happen on the first run, so we just log it
                    println!("Could not load data: {}", e);
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_all_data,
            save_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}