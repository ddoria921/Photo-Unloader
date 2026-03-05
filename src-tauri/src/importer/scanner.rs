use serde::Serialize;
use std::ffi::OsStr;
use std::io;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const JPG_EXT: &[&str] = &["jpg", "jpeg", "heic", "png", "tiff"];
const RAW_EXT: &[&str] = &["cr2", "cr3", "nef", "arw", "orf", "raf", "dng", "rw2"];
const VIDEO_EXT: &[&str] = &["mp4", "mov", "avi", "mkv"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FileType {
    Jpg,
    Raw,
    Video,
    Unknown,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaFile {
    pub path: PathBuf,
    pub file_type: FileType,
    pub size_bytes: u64,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub files: Vec<MediaFile>,
    pub jpg_count: usize,
    pub raw_count: usize,
    pub video_count: usize,
    pub unknown_count: usize,
    pub total_size_bytes: u64,
}

pub fn scan_directory(source_dir: &Path) -> io::Result<ScanResult> {
    if !source_dir.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Source path does not exist: {}", source_dir.display()),
        ));
    }

    if !source_dir.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("Source path is not a directory: {}", source_dir.display()),
        ));
    }

    let mut files = Vec::new();
    let mut jpg_count = 0usize;
    let mut raw_count = 0usize;
    let mut video_count = 0usize;
    let mut unknown_count = 0usize;
    let mut total_size_bytes = 0u64;

    for entry in WalkDir::new(source_dir)
        .into_iter()
        .filter_entry(|entry| !is_hidden(entry.file_name()))
    {
        let entry = match entry {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path().to_path_buf();
        let metadata = entry.metadata()?;
        let filename = entry.file_name().to_string_lossy().to_string();
        let file_type = classify_file_type(&path);

        match file_type {
            FileType::Jpg => jpg_count += 1,
            FileType::Raw => raw_count += 1,
            FileType::Video => video_count += 1,
            FileType::Unknown => unknown_count += 1,
        }

        total_size_bytes += metadata.len();

        files.push(MediaFile {
            path,
            file_type,
            size_bytes: metadata.len(),
            filename,
        });
    }

    Ok(ScanResult {
        files,
        jpg_count,
        raw_count,
        video_count,
        unknown_count,
        total_size_bytes,
    })
}

fn classify_file_type(path: &Path) -> FileType {
    let ext = path
        .extension()
        .and_then(OsStr::to_str)
        .map(str::to_ascii_lowercase);

    let Some(ext) = ext else {
        return FileType::Unknown;
    };

    if JPG_EXT.contains(&ext.as_str()) {
        FileType::Jpg
    } else if RAW_EXT.contains(&ext.as_str()) {
        FileType::Raw
    } else if VIDEO_EXT.contains(&ext.as_str()) {
        FileType::Video
    } else {
        FileType::Unknown
    }
}

fn is_hidden(name: &OsStr) -> bool {
    name.to_str().is_some_and(|value| value.starts_with('.'))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_extensions_case_insensitively() {
        assert!(matches!(
            classify_file_type(Path::new("a.JPG")),
            FileType::Jpg
        ));
        assert!(matches!(
            classify_file_type(Path::new("a.cr3")),
            FileType::Raw
        ));
        assert!(matches!(
            classify_file_type(Path::new("a.MOV")),
            FileType::Video
        ));
        assert!(matches!(
            classify_file_type(Path::new("a.xyz")),
            FileType::Unknown
        ));
    }
}
