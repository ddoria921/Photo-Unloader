pub mod import;
pub mod scan;
pub mod settings;

#[tauri::command]
pub fn is_directory(path: String) -> bool {
    std::path::Path::new(&path).is_dir()
}
