use std::fs;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub jpg_destination: String,
    pub raw_destination: String,
}

pub fn load_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let settings_path = settings_path(app)?;
    if !settings_path.exists() {
        return Ok(AppSettings::default());
    }

    let file = fs::File::open(&settings_path)
        .map_err(|err| format!("Failed to open settings file {}: {err}", settings_path.display()))?;
    let reader = BufReader::new(file);
    serde_json::from_reader::<_, AppSettings>(reader).map_err(|err| {
        format!(
            "Failed to parse settings file {}: {err}",
            settings_path.display()
        )
    })
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let settings_path = settings_path(app)?;
    let parent = settings_path.parent().ok_or_else(|| {
        format!(
            "Invalid settings path without parent: {}",
            settings_path.display()
        )
    })?;
    fs::create_dir_all(parent)
        .map_err(|err| format!("Failed to create settings directory {}: {err}", parent.display()))?;

    let file = fs::File::create(&settings_path)
        .map_err(|err| format!("Failed to create settings file {}: {err}", settings_path.display()))?;
    let writer = BufWriter::new(file);
    serde_json::to_writer_pretty(writer, settings).map_err(|err| {
        format!(
            "Failed to write settings file {}: {err}",
            settings_path.display()
        )
    })
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app.path().app_config_dir().map_err(|err| {
        format!("Unable to resolve app config directory: {err}")
    })?;
    Ok(app_config_dir.join(SETTINGS_FILE_NAME))
}
