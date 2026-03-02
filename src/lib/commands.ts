import { invoke } from '@tauri-apps/api/core';
import type { FileType, MediaFile, ScanResult } from '@/types';

const JPG_EXTENSIONS = new Set(['jpg', 'jpeg', 'heic', 'png', 'tiff']);
const RAW_EXTENSIONS = new Set(['cr2', 'cr3', 'nef', 'arw', 'orf', 'raf', 'dng', 'rw2']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv']);

export async function scanCard(sourcePath: string): Promise<ScanResult> {
  return invoke<ScanResult>('scan_card', { sourcePath });
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
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
      case 'Jpg':
        jpgCount += 1;
        break;
      case 'Raw':
        rawCount += 1;
        break;
      case 'Video':
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
      filename: file.name
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
  if (!extension) {
    return 'Unknown';
  }

  if (JPG_EXTENSIONS.has(extension)) {
    return 'Jpg';
  }

  if (RAW_EXTENSIONS.has(extension)) {
    return 'Raw';
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return 'Video';
  }

  return 'Unknown';
}

function isHiddenPath(relativePath: string): boolean {
  return relativePath.split('/').some((segment) => segment.startsWith('.'));
}
