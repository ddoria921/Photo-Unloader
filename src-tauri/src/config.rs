use std::fs;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "settings.json";
const SESSIONS_FILE_NAME: &str = "sessions.json";
const MAX_SESSIONS: usize = 50;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub id: String,
    pub completed_at: String,
    pub source_path: String,
    pub jpg_destination: String,
    pub raw_destination: String,
    pub total_files: usize,
    pub copied_count: usize,
    pub skipped_count: usize,
    pub error_count: usize,
    pub completed_with_errors: bool,
}

pub fn load_sessions(app: &AppHandle) -> Result<Vec<SessionRecord>, String> {
    let path = sessions_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let file = fs::File::open(&path)
        .map_err(|e| format!("Failed to open sessions file: {e}"))?;
    serde_json::from_reader::<_, Vec<SessionRecord>>(BufReader::new(file))
        .map_err(|e| format!("Failed to parse sessions file: {e}"))
}

pub fn append_session(app: &AppHandle, record: SessionRecord) -> Result<(), String> {
    let mut sessions = load_sessions(app).unwrap_or_default();
    sessions.insert(0, record); // newest first
    sessions.truncate(MAX_SESSIONS);

    let path = sessions_path(app)?;
    let parent = path.parent().ok_or("Invalid sessions path")?;
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {e}"))?;
    let file = fs::File::create(&path)
        .map_err(|e| format!("Failed to write sessions file: {e}"))?;
    serde_json::to_writer_pretty(BufWriter::new(file), &sessions)
        .map_err(|e| format!("Failed to serialize sessions: {e}"))
}

fn sessions_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| format!("Config dir error: {e}"))?;
    Ok(dir.join(SESSIONS_FILE_NAME))
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app.path().app_config_dir().map_err(|err| {
        format!("Unable to resolve app config directory: {err}")
    })?;
    Ok(app_config_dir.join(SETTINGS_FILE_NAME))
}
