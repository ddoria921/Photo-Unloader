use chrono::{DateTime, Datelike, NaiveDateTime, Utc};
use exif::{In, Reader, Tag, Value};
use serde::Serialize;
use std::fs;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf};

const EXIF_DATE_FORMAT: &str = "%Y:%m:%d %H:%M:%S";
const EXIF_DATE_FORMAT_FRACTIONAL: &str = "%Y:%m:%d %H:%M:%S%.f";

const EXIF_DATE_TAGS: [Tag; 3] = [Tag::DateTimeOriginal, Tag::DateTimeDigitized, Tag::DateTime];

// ── Rich EXIF metadata ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MediaFileExif {
    pub captured_at: Option<String>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub aperture: Option<String>,
    pub shutter_speed: Option<String>,
    pub iso: Option<u32>,
    pub focal_length: Option<String>,
    pub lens: Option<String>,
    pub white_balance: Option<String>,
}

pub fn read_media_exif(path: &Path) -> MediaFileExif {
    let Ok(file) = fs::File::open(path) else {
        return MediaFileExif::default();
    };
    let mut buf = BufReader::new(file);
    let Ok(exif) = Reader::new().read_from_container(&mut buf) else {
        return MediaFileExif::default();
    };

    // Helper: read first non-empty ASCII value for a tag
    let ascii = |tag: Tag| -> Option<String> {
        let field = exif.get_field(tag, In::PRIMARY)?;
        if let Value::Ascii(values) = &field.value {
            for raw in values {
                let s = String::from_utf8_lossy(raw)
                    .trim_matches(char::from(0))
                    .trim()
                    .to_string();
                if !s.is_empty() {
                    return Some(s);
                }
            }
        }
        None
    };

    // captured_at: try date tags in priority order
    let captured_at = EXIF_DATE_TAGS.iter().find_map(|&tag| {
        let field = exif.get_field(tag, In::PRIMARY)?;
        if let Value::Ascii(values) = &field.value {
            for raw in values {
                let s = String::from_utf8_lossy(raw)
                    .trim_matches(char::from(0))
                    .trim()
                    .to_string();
                if let Some(dt) = parse_exif_datetime(&s) {
                    return Some(dt.format("%Y-%m-%d %H:%M:%S").to_string());
                }
            }
        }
        None
    });

    // aperture: FNumber is a Rational
    let aperture = exif.get_field(Tag::FNumber, In::PRIMARY).and_then(|f| {
        if let Value::Rational(vals) = &f.value {
            if let Some(r) = vals.first() {
                if r.denom != 0 {
                    let v = r.num as f64 / r.denom as f64;
                    return Some(format!("f/{v:.1}"));
                }
            }
        }
        None
    });

    // shutter speed: ExposureTime is a Rational
    let shutter_speed = exif
        .get_field(Tag::ExposureTime, In::PRIMARY)
        .and_then(|f| {
            if let Value::Rational(vals) = &f.value {
                if let Some(r) = vals.first() {
                    if r.denom == 0 {
                        return None;
                    }
                    let v = r.num as f64 / r.denom as f64;
                    if v >= 1.0 {
                        return Some(format!("{v:.0}s"));
                    }
                    let denom = (r.denom as f64 / r.num as f64).round() as u32;
                    return Some(format!("1/{denom}"));
                }
            }
            None
        });

    // ISO: PhotographicSensitivity is Short or Long
    let iso = exif
        .get_field(Tag::PhotographicSensitivity, In::PRIMARY)
        .and_then(|f| match &f.value {
            Value::Short(vals) => vals.first().map(|&v| v as u32),
            Value::Long(vals) => vals.first().copied(),
            _ => None,
        });

    // focal length: FocalLength is Rational
    let focal_length = exif
        .get_field(Tag::FocalLength, In::PRIMARY)
        .and_then(|f| {
            if let Value::Rational(vals) = &f.value {
                if let Some(r) = vals.first() {
                    if r.denom != 0 {
                        let v = r.num as f64 / r.denom as f64;
                        return Some(format!("{v:.0}mm"));
                    }
                }
            }
            None
        });

    // white balance: 0 = auto, 1 = manual
    let white_balance = exif
        .get_field(Tag::WhiteBalance, In::PRIMARY)
        .and_then(|f| {
            if let Value::Short(vals) = &f.value {
                return vals
                    .first()
                    .map(|&v| if v == 0 { "Auto".to_string() } else { "Manual".to_string() });
            }
            None
        });

    MediaFileExif {
        captured_at,
        camera_make: ascii(Tag::Make),
        camera_model: ascii(Tag::Model),
        aperture,
        shutter_speed,
        iso,
        focal_length,
        lens: ascii(Tag::LensModel),
        white_balance,
    }
}

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
