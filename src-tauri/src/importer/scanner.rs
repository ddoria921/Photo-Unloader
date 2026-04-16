use super::exif::read_media_exif;
use serde::Serialize;
use std::ffi::OsStr;
use std::io;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const JPG_EXT: &[&str] = &["jpg", "jpeg", "heic", "heif", "png", "tiff"];
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
    pub captured_at: Option<String>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub aperture: Option<String>,
    pub shutter_speed: Option<String>,
    pub iso: Option<u32>,
    pub focal_length: Option<String>,
    pub lens: Option<String>,
    pub white_balance: Option<String>,
    pub sha256: Option<String>,
    pub paired_file: Option<String>,
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
            FileType::Unknown => {
                unknown_count += 1;
                continue;
            }
        }

        total_size_bytes += metadata.len();

        let exif = match file_type {
            FileType::Jpg | FileType::Raw => read_media_exif(&path),
            _ => Default::default(),
        };

        files.push(MediaFile {
            path,
            file_type,
            size_bytes: metadata.len(),
            filename,
            captured_at: exif.captured_at,
            camera_make: exif.camera_make,
            camera_model: exif.camera_model,
            aperture: exif.aperture,
            shutter_speed: exif.shutter_speed,
            iso: exif.iso,
            focal_length: exif.focal_length,
            lens: exif.lens,
            white_balance: exif.white_balance,
            sha256: None, // computed during import, not scan
            paired_file: None, // populated after full scan
        });
    }

    // Detect RAW/JPG pairs by matching base filenames
    let base_to_indices: std::collections::HashMap<String, Vec<usize>> = {
        let mut map: std::collections::HashMap<String, Vec<usize>> = std::collections::HashMap::new();
        for (i, f) in files.iter().enumerate() {
            let base = Path::new(&f.filename)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            map.entry(base).or_default().push(i);
        }
        map
    };

    for indices in base_to_indices.values() {
        if indices.len() < 2 { continue; }
        // Find if there's both a RAW and a JPG/video in this group
        let raw_idx = indices.iter().find(|&&i| matches!(files[i].file_type, FileType::Raw));
        let jpg_idx = indices.iter().find(|&&i| matches!(files[i].file_type, FileType::Jpg));
        if let (Some(&ri), Some(&ji)) = (raw_idx, jpg_idx) {
            let jpg_name = files[ji].filename.clone();
            let raw_name = files[ri].filename.clone();
            files[ri].paired_file = Some(jpg_name);
            files[ji].paired_file = Some(raw_name);
        }
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

    #[test]
    fn scan_excludes_unknown_file_types() {
        use std::fs;
        let dir = std::env::temp_dir().join("photo_unloader_test_scan_unknown");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("photo.jpg"), b"fake").unwrap();
        fs::write(dir.join("debug.log"), b"log data").unwrap();
        fs::write(dir.join("readme.txt"), b"text").unwrap();

        let result = scan_directory(&dir).unwrap();

        // Cleanup
        let _ = fs::remove_dir_all(&dir);

        assert_eq!(result.files.len(), 1, "only the JPG should be included");
        assert_eq!(result.files[0].filename, "photo.jpg");
        assert_eq!(result.unknown_count, 2, "log and txt should be counted as unknown");
        assert_eq!(result.jpg_count, 1);
    }
}
