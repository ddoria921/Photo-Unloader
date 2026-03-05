mod commands;
mod config;
mod importer;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan::scan_card,
            commands::import::start_import,
            commands::import::open_in_finder,
            commands::settings::get_app_settings,
            commands::settings::save_app_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
