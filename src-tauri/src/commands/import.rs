use std::path::{Path, PathBuf};
use std::process::Command;
use std::{fs, fs::OpenOptions};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;

use crate::importer::{
    copier::{self, CopyStatus},
    exif, scanner,
    scanner::FileType,
};

const IMPORT_PROGRESS_EVENT: &str = "import-progress";
const IMPORT_COMPLETE_EVENT: &str = "import-complete";

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartImportRequest {
    pub source_path: String,
    pub jpg_destination: String,
    pub raw_destination: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ImportFileStatus {
    Copied,
    SkippedDuplicate,
    RenamedAndCopied,
    UnsupportedType,
    Error,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgressEvent {
    pub total_files: usize,
    pub processed_files: usize,
    pub copied_count: usize,
    pub renamed_count: usize,
    pub skipped_count: usize,
    pub error_count: usize,
    pub current_file: String,
    pub file_type: FileType,
    pub status: ImportFileStatus,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub source_path: String,
    pub jpg_destination: String,
    pub raw_destination: String,
    pub total_files: usize,
    pub copied_count: usize,
    pub renamed_count: usize,
    pub skipped_count: usize,
    pub unsupported_count: usize,
    pub error_count: usize,
    pub completed_with_errors: bool,
}

#[tauri::command]
pub async fn start_import(
    app: AppHandle,
    request: StartImportRequest,
) -> Result<ImportSummary, String> {
    run_import(&app, request)
}

#[tauri::command]
pub async fn open_in_finder(path: String) -> Result<(), String> {
    let status = Command::new("open")
        .arg(path)
        .status()
        .map_err(|err| format!("Failed to launch Finder: {err}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Finder exited with status: {status}"))
    }
}

fn run_import(app: &AppHandle, request: StartImportRequest) -> Result<ImportSummary, String> {
    let source_path = PathBuf::from(&request.source_path);
    let jpg_root = PathBuf::from(&request.jpg_destination);
    let raw_root = PathBuf::from(&request.raw_destination);

    validate_destination_root(&jpg_root, "JPG")?;
    validate_destination_root(&raw_root, "RAW")?;

    let scan_result = scanner::scan_directory(&source_path)
        .map_err(|err| format!("Failed to scan source directory: {err}"))?;

    let mut summary = ImportSummary {
        source_path: request.source_path.clone(),
        jpg_destination: request.jpg_destination.clone(),
        raw_destination: request.raw_destination.clone(),
        total_files: scan_result.files.len(),
        copied_count: 0,
        renamed_count: 0,
        skipped_count: 0,
        unsupported_count: 0,
        error_count: 0,
        completed_with_errors: false,
    };

    for (index, media_file) in scan_result.files.iter().enumerate() {
        let processed_files = index + 1;
        let current_file = media_file.path.display().to_string();
        let destination_root =
            destination_root_for_type(&media_file.file_type, &jpg_root, &raw_root);
        let (status, message) = if let Some(destination_root) = destination_root {
            match exif::resolve_capture_datetime(&media_file.path) {
                Ok(captured_at) => {
                    let destination_path = destination_root.join(exif::build_destination_subpath(
                        captured_at,
                        &media_file.filename,
                    ));
                    match copier::copy_with_conflict_handling(&media_file.path, &destination_path) {
                        Ok(copy_result) => match copy_result.status {
                            CopyStatus::Copied => {
                                summary.copied_count += 1;
                                (ImportFileStatus::Copied, None)
                            }
                            CopyStatus::SkippedDuplicate => {
                                summary.skipped_count += 1;
                                (ImportFileStatus::SkippedDuplicate, None)
                            }
                            CopyStatus::RenamedAndCopied => {
                                summary.copied_count += 1;
                                summary.renamed_count += 1;
                                (
                                    ImportFileStatus::RenamedAndCopied,
                                    Some(format!(
                                        "Copied with new filename: {}",
                                        copy_result.destination_path.display()
                                    )),
                                )
                            }
                        },
                        Err(err) => {
                            summary.error_count += 1;
                            (ImportFileStatus::Error, Some(err.to_string()))
                        }
                    }
                }
                Err(err) => {
                    summary.error_count += 1;
                    (
                        ImportFileStatus::Error,
                        Some(format!("Failed to resolve capture date: {err}")),
                    )
                }
            }
        } else {
            summary.unsupported_count += 1;
            summary.skipped_count += 1;
            (
                ImportFileStatus::UnsupportedType,
                Some("Skipped unsupported file type.".to_string()),
            )
        };

        emit_progress(
            app,
            ImportProgressEvent {
                total_files: summary.total_files,
                processed_files,
                copied_count: summary.copied_count,
                renamed_count: summary.renamed_count,
                skipped_count: summary.skipped_count,
                error_count: summary.error_count,
                current_file,
                file_type: media_file.file_type.clone(),
                status,
                message,
            },
        )?;
    }

    summary.completed_with_errors = summary.error_count > 0;

    app.emit(IMPORT_COMPLETE_EVENT, &summary)
        .map_err(|err| format!("Failed to emit {IMPORT_COMPLETE_EVENT}: {err}"))?;

    send_completion_notification(app, &summary);

    Ok(summary)
}

fn destination_root_for_type<'a>(
    file_type: &FileType,
    jpg_root: &'a Path,
    raw_root: &'a Path,
) -> Option<&'a Path> {
    match file_type {
        FileType::Jpg | FileType::Video => Some(jpg_root),
        FileType::Raw => Some(raw_root),
        FileType::Unknown => None,
    }
}

fn emit_progress(app: &AppHandle, payload: ImportProgressEvent) -> Result<(), String> {
    app.emit(IMPORT_PROGRESS_EVENT, payload)
        .map_err(|err| format!("Failed to emit {IMPORT_PROGRESS_EVENT}: {err}"))
}

fn send_completion_notification(app: &AppHandle, summary: &ImportSummary) {
    let title = if summary.completed_with_errors {
        "Photo import finished with errors"
    } else {
        "Photo import complete"
    };
    let body = format!(
        "Copied: {} (renamed: {}), skipped: {}, errors: {}.",
        summary.copied_count, summary.renamed_count, summary.skipped_count, summary.error_count
    );

    let _ = app.notification().builder().title(title).body(body).show();
}

fn validate_destination_root(path: &Path, label: &str) -> Result<(), String> {
    if let Some(mount_root) = nas_mount_root(path) {
        if !mount_root.exists() {
            return Err(format!(
                "{label} NAS share is not mounted: {}",
                mount_root.display()
            ));
        }
    }

    let probe_dir = if path.exists() {
        if !path.is_dir() {
            return Err(format!(
                "{label} destination is not a directory: {}",
                path.display()
            ));
        }
        path.to_path_buf()
    } else {
        path.ancestors()
            .find(|candidate| candidate.exists())
            .ok_or_else(|| format!("Cannot resolve destination parent for {}.", path.display()))?
            .to_path_buf()
    };

    if !probe_dir.is_dir() {
        return Err(format!(
            "{label} destination parent is not a directory: {}",
            probe_dir.display()
        ));
    }

    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let probe_file = probe_dir.join(format!(".photo-unloader-write-test-{}-{nanos}", std::process::id()));

    let probe = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&probe_file)
        .map_err(|err| {
            format!(
                "{label} destination is not writable: {} ({err})",
                probe_dir.display()
            )
        })?;

    drop(probe);
    let _ = fs::remove_file(&probe_file);

    Ok(())
}

fn nas_mount_root(path: &Path) -> Option<PathBuf> {
    let components: Vec<_> = path.components().collect();
    if components.len() < 3 {
        return None;
    }

    let is_root = matches!(components[0], std::path::Component::RootDir);
    let is_volumes = matches!(
        components[1],
        std::path::Component::Normal(value) if value == "Volumes"
    );
    let std::path::Component::Normal(share) = components[2] else {
        return None;
    };

    if !is_root || !is_volumes {
        return None;
    }

    Some(PathBuf::from("/Volumes").join(share))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn destination_root_maps_file_types() {
        let jpg = PathBuf::from("/tmp/jpg");
        let raw = PathBuf::from("/tmp/raw");

        assert_eq!(
            destination_root_for_type(&FileType::Jpg, &jpg, &raw),
            Some(jpg.as_path())
        );
        assert_eq!(
            destination_root_for_type(&FileType::Video, &jpg, &raw),
            Some(jpg.as_path())
        );
        assert_eq!(
            destination_root_for_type(&FileType::Raw, &jpg, &raw),
            Some(raw.as_path())
        );
        assert_eq!(
            destination_root_for_type(&FileType::Unknown, &jpg, &raw),
            None
        );
    }

    #[test]
    fn nas_mount_root_detects_volume_mount_prefix() {
        assert_eq!(
            nas_mount_root(Path::new("/Volumes/PhotoNAS/JPG")),
            Some(PathBuf::from("/Volumes/PhotoNAS"))
        );
        assert_eq!(nas_mount_root(Path::new("/Users/example/JPG")), None);
    }
}
