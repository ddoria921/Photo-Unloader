use crate::importer::hasher;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CopyStatus {
    Copied,
    SkippedDuplicate,
    RenamedAndCopied,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CopyResult {
    pub status: CopyStatus,
    pub destination_path: PathBuf,
}

pub fn copy_with_conflict_handling(source: &Path, destination: &Path) -> io::Result<CopyResult> {
    let destination_parent = destination.parent().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("Destination path has no parent: {}", destination.display()),
        )
    })?;
    fs::create_dir_all(destination_parent)?;

    let source_hash = hasher::sha256_file(source)?;
    let mut final_destination = destination.to_path_buf();
    let mut status = CopyStatus::Copied;

    if final_destination.exists() {
        let destination_hash = hasher::sha256_file(&final_destination)?;
        if destination_hash == source_hash {
            return Ok(CopyResult {
                status: CopyStatus::SkippedDuplicate,
                destination_path: final_destination,
            });
        }

        final_destination = next_available_destination(destination);
        status = CopyStatus::RenamedAndCopied;
    }

    fs::copy(source, &final_destination)?;

    Ok(CopyResult {
        status,
        destination_path: final_destination,
    })
}

fn next_available_destination(destination: &Path) -> PathBuf {
    let parent = destination.parent().unwrap_or_else(|| Path::new("."));
    let extension = destination
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_owned);
    let stem = destination
        .file_stem()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .unwrap_or("file")
        .to_string();

    for index in 1.. {
        let candidate_name = match &extension {
            Some(ext) => format!("{stem} ({index}).{ext}"),
            None => format!("{stem} ({index})"),
        };
        let candidate = parent.join(candidate_name);
        if !candidate.exists() {
            return candidate;
        }
    }

    unreachable!("Infinite iterator must always produce a destination candidate");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn copies_file_when_destination_does_not_exist() {
        let temp_dir = temp_directory("copy-new");
        fs::create_dir_all(&temp_dir).unwrap();
        let source = temp_dir.join("source.jpg");
        write_file(&source, "abc");
        let destination = temp_dir.join("target").join("photo.jpg");

        let result = copy_with_conflict_handling(&source, &destination).unwrap();

        assert_eq!(result.status, CopyStatus::Copied);
        assert_eq!(result.destination_path, destination);
        assert!(result.destination_path.exists());
        cleanup_dir(&temp_dir);
    }

    #[test]
    fn skips_when_existing_destination_is_identical() {
        let temp_dir = temp_directory("copy-skip");
        fs::create_dir_all(&temp_dir).unwrap();
        let source = temp_dir.join("source.jpg");
        let destination = temp_dir.join("target").join("photo.jpg");
        write_file(&source, "same-content");
        fs::create_dir_all(destination.parent().unwrap()).unwrap();
        write_file(&destination, "same-content");

        let result = copy_with_conflict_handling(&source, &destination).unwrap();

        assert_eq!(result.status, CopyStatus::SkippedDuplicate);
        assert_eq!(result.destination_path, destination);
        cleanup_dir(&temp_dir);
    }

    #[test]
    fn renames_when_destination_exists_with_different_content() {
        let temp_dir = temp_directory("copy-rename");
        fs::create_dir_all(&temp_dir).unwrap();
        let source = temp_dir.join("source.jpg");
        let destination = temp_dir.join("target").join("photo.jpg");
        write_file(&source, "new-content");
        fs::create_dir_all(destination.parent().unwrap()).unwrap();
        write_file(&destination, "old-content");

        let result = copy_with_conflict_handling(&source, &destination).unwrap();

        assert_eq!(result.status, CopyStatus::RenamedAndCopied);
        assert_eq!(
            result.destination_path,
            temp_dir.join("target").join("photo (1).jpg")
        );
        assert!(result.destination_path.exists());
        cleanup_dir(&temp_dir);
    }

    fn write_file(path: &Path, contents: &str) {
        let mut file = fs::File::create(path).unwrap();
        write!(file, "{contents}").unwrap();
    }

    fn temp_directory(prefix: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("photo-unloader-{prefix}-{nanos}"))
    }

    fn cleanup_dir(path: &Path) {
        if path.exists() {
            fs::remove_dir_all(path).unwrap();
        }
    }
}
