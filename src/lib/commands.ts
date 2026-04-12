import { invoke } from '@tauri-apps/api/core';
import type {
  AppSettings,
  FileType,
  ImportSummary,
  MediaFile,
  ScanResult,
  SessionRecord,
  StartImportRequest
} from '@/types';

const JPG_EXTENSIONS = new Set(['jpg', 'jpeg', 'heic', 'heif', 'png', 'tiff']);
const RAW_EXTENSIONS = new Set(['cr2', 'cr3', 'nef', 'arw', 'orf', 'raf', 'dng', 'rw2']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv']);

export async function scanCard(sourcePath: string): Promise<ScanResult> {
  return invoke<ScanResult>('scan_card', { sourcePath });
}

export async function startImport(request: StartImportRequest): Promise<ImportSummary> {
  return invoke<ImportSummary>('start_import', { request });
}

export async function cancelImport(): Promise<void> {
  return invoke('cancel_import');
}

export async function openInFinder(path: string): Promise<void> {
  return invoke('open_in_finder', { path });
}

export async function getAppSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_app_settings');
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  return invoke<AppSettings>('save_app_settings', { settings });
}

export async function getSessions(): Promise<SessionRecord[]> {
  return invoke<SessionRecord[]>('get_sessions');
}

export async function saveSession(record: SessionRecord): Promise<void> {
  return invoke('save_session', { record });
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function isDirectory(path: string): Promise<boolean> {
  return invoke<boolean>('is_directory', { path });
}

export function scanFilesInBrowser(files: File[]): ScanResult {
  const scannedFiles: MediaFile[] = [];
  let jpgCount = 0;
  let rawCount = 0;
  let videoCount = 0;
  let unknownCount = 0;
  let totalSizeBytes = 0;

  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    if (isHiddenPath(relativePath)) {
      continue;
    }

    const fileType = classifyFileType(file.name);
    totalSizeBytes += file.size;

    switch (fileType) {
      case 'jpg':
        jpgCount += 1;
        break;
      case 'raw':
        rawCount += 1;
        break;
      case 'video':
        videoCount += 1;
        break;
      default:
        unknownCount += 1;
        break;
    }

    scannedFiles.push({
      path: relativePath,
      fileType,
      sizeBytes: file.size,
      filename: file.name,
      capturedAt: null,
      cameraMake: null,
      cameraModel: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
      focalLength: null,
      lens: null,
      whiteBalance: null,
      sha256: null,
      pairedFile: null
    });
  }

  return {
    files: scannedFiles,
    jpgCount,
    rawCount,
    videoCount,
    unknownCount,
    totalSizeBytes
  };
}

function classifyFileType(filename: string): FileType {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return 'unknown';
  if (JPG_EXTENSIONS.has(extension)) return 'jpg';
  if (RAW_EXTENSIONS.has(extension)) return 'raw';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return 'unknown';
}

function isHiddenPath(relativePath: string): boolean {
  return relativePath.split('/').some((segment) => segment.startsWith('.'));
}
