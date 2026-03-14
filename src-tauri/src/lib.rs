mod commands;
mod config;
mod importer;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(commands::import::ImportCancelToken(Arc::new(AtomicBool::new(false))))
        .invoke_handler(tauri::generate_handler![
            commands::scan::scan_card,
            commands::import::start_import,
            commands::import::cancel_import,
            commands::import::open_in_finder,
            commands::settings::get_app_settings,
            commands::settings::save_app_settings,
            commands::settings::get_sessions,
            commands::settings::save_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
