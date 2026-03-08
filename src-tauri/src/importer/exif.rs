use chrono::{DateTime, Datelike, NaiveDateTime, Utc};
use exif::{In, Reader, Tag, Value};
use std::fs;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf};

const EXIF_DATE_FORMAT: &str = "%Y:%m:%d %H:%M:%S";
const EXIF_DATE_FORMAT_FRACTIONAL: &str = "%Y:%m:%d %H:%M:%S%.f";

const EXIF_DATE_TAGS: [Tag; 3] = [Tag::DateTimeOriginal, Tag::DateTimeDigitized, Tag::DateTime];

pub fn resolve_capture_datetime(path: &Path) -> io::Result<NaiveDateTime> {
    if let Some(captured_at) = read_exif_datetime(path) {
        return Ok(captured_at);
    }

    let modified = fs::metadata(path)?.modified()?;
    let modified_utc: DateTime<Utc> = modified.into();
    Ok(modified_utc.naive_utc())
}

pub fn build_destination_subpath(captured_at: NaiveDateTime, filename: &str) -> PathBuf {
    let day = captured_at.date();
    let year = day.year();
    let month = day.month();
    let day_of_month = day.day();

    PathBuf::from(format!("{year:04}"))
        .join(format!("{month:02}"))
        .join(format!("{year:04}-{month:02}-{day_of_month:02}"))
        .join(filename)
}

fn read_exif_datetime(path: &Path) -> Option<NaiveDateTime> {
    let file = fs::File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let exif = Reader::new().read_from_container(&mut reader).ok()?;

    for tag in EXIF_DATE_TAGS {
        let Some(field) = exif.get_field(tag, In::PRIMARY) else {
            continue;
        };
        let Value::Ascii(values) = &field.value else {
            continue;
        };

        for raw_value in values {
            let date_text = String::from_utf8_lossy(raw_value)
                .trim_matches(char::from(0))
                .trim()
                .to_string();

            if let Some(parsed) = parse_exif_datetime(&date_text) {
                return Some(parsed);
            }
        }
    }

    None
}

fn parse_exif_datetime(value: &str) -> Option<NaiveDateTime> {
    NaiveDateTime::parse_from_str(value, EXIF_DATE_FORMAT)
        .ok()
        .or_else(|| NaiveDateTime::parse_from_str(value, EXIF_DATE_FORMAT_FRACTIONAL).ok())
        .or_else(|| {
            DateTime::parse_from_str(value, "%Y:%m:%d %H:%M:%S%:z")
                .ok()
                .map(|datetime| datetime.naive_utc())
        })
        .or_else(|| {
            DateTime::parse_from_str(value, "%Y:%m:%d %H:%M:%S%.f%:z")
                .ok()
                .map(|datetime| datetime.naive_utc())
        })
        .or_else(|| {
            DateTime::parse_from_str(value, "%Y:%m:%d %H:%M:%S%z")
                .ok()
                .map(|datetime| datetime.naive_utc())
        })
        .or_else(|| {
            DateTime::parse_from_str(value, "%Y:%m:%d %H:%M:%S%.f%z")
                .ok()
                .map(|datetime| datetime.naive_utc())
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn parses_standard_exif_datetime() {
        let parsed = parse_exif_datetime("2025:02:14 12:34:56");
        assert_eq!(
            parsed,
            Some(
                NaiveDateTime::parse_from_str("2025-02-14 12:34:56", "%Y-%m-%d %H:%M:%S").unwrap()
            )
        );
    }

    #[test]
    fn parses_fractional_exif_datetime() {
        let parsed = parse_exif_datetime("2025:02:14 12:34:56.789");
        assert_eq!(
            parsed,
            Some(
                NaiveDateTime::parse_from_str("2025-02-14 12:34:56.789", "%Y-%m-%d %H:%M:%S%.f")
                    .unwrap()
            )
        );
    }

    #[test]
    fn parses_timezone_exif_datetime() {
        let parsed = parse_exif_datetime("2025:02:14 12:34:56-05:00");
        assert_eq!(
            parsed,
            Some(
                NaiveDateTime::parse_from_str("2025-02-14 17:34:56", "%Y-%m-%d %H:%M:%S").unwrap()
            )
        );
    }

    #[test]
    fn builds_destination_subpath_with_expected_structure() {
        let captured_at =
            NaiveDateTime::parse_from_str("2024-12-03 08:01:15", "%Y-%m-%d %H:%M:%S").unwrap();
        let destination = build_destination_subpath(captured_at, "IMG_1001.CR3");

        assert_eq!(
            destination,
            PathBuf::from("2024")
                .join("12")
                .join("2024-12-03")
                .join("IMG_1001.CR3")
        );
    }

    #[test]
    fn falls_back_to_file_modified_time_when_exif_is_missing() {
        let temp_file = temp_file_path("fallback-time-test");
        let mut file = fs::File::create(&temp_file).unwrap();
        writeln!(file, "not-an-image").unwrap();
        drop(file);

        let resolved = resolve_capture_datetime(&temp_file);
        fs::remove_file(&temp_file).unwrap();

        assert!(resolved.is_ok());
    }

    fn temp_file_path(prefix: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("photo-unloader-{prefix}-{nanos}.tmp"))
    }
}
