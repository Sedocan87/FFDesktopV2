#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;

#[tauri::command]
async fn load_data(app: AppHandle) -> String {
    let path = get_data_path(&app);
    if !path.exists() {
        return "{}".to_string();
    }
    fs::read_to_string(path).unwrap_or("{}".to_string())
}

#[tauri::command]
async fn save_data(app: AppHandle, data: String) {
    let path = get_data_path(&app);
    fs::write(path, data).expect("Failed to write data");
}

fn get_data_path(app: &AppHandle) -> PathBuf {
    let path = app.path().app_data_dir().expect("Failed to get app data dir");
    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create app data dir");
    }
    path.join("freelanceflow-data.json")
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![load_data, save_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}