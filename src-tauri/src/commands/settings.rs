use tauri::AppHandle;

use crate::config::{self, AppSettings};

#[tauri::command]
pub async fn get_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    config::load_settings(&app)
}

#[tauri::command]
pub async fn save_app_settings(
    app: AppHandle,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    config::save_settings(&app, &settings)?;
    Ok(settings)
}
