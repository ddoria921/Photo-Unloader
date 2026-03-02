use std::path::PathBuf;

use crate::importer::scanner::{self, ScanResult};

#[tauri::command]
pub async fn scan_card(source_path: String) -> Result<ScanResult, String> {
    scanner::scan_directory(&PathBuf::from(source_path)).map_err(|err| err.to_string())
}
