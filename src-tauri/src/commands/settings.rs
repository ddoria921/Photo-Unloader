use tauri::AppHandle;

use crate::config::{self, AppSettings, SessionRecord};

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

#[tauri::command]
pub async fn get_sessions(app: AppHandle) -> Result<Vec<SessionRecord>, String> {
    if cfg!(debug_assertions) {
        return Ok(Vec::new());
    }
    config::load_sessions(&app)
}

#[tauri::command]
pub async fn save_session(app: AppHandle, record: SessionRecord) -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Ok(());
    }
    config::append_session(&app, record)
}
