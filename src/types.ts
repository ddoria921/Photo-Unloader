export type FileType = 'jpg' | 'raw' | 'video' | 'unknown';

export interface MediaFile {
  path: string;
  fileType: FileType;
  sizeBytes: number;
  filename: string;
  capturedAt: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  focalLength: string | null;
  lens: string | null;
  whiteBalance: string | null;
  sha256: string | null;
  pairedFile: string | null;
}

export interface ScanResult {
  files: MediaFile[];
  jpgCount: number;
  rawCount: number;
  videoCount: number;
  unknownCount: number;
  totalSizeBytes: number;
}

export interface StartImportRequest {
  sourcePath: string;
  jpgDestination: string;
  rawDestination: string;
  filePaths?: string[];
}

export type ImportFileStatus =
  | 'Copied'
  | 'SkippedDuplicate'
  | 'RenamedAndCopied'
  | 'UnsupportedType'
  | 'Error';

export interface ImportProgressEvent {
  totalFiles: number;
  processedFiles: number;
  copiedCount: number;
  renamedCount: number;
  skippedCount: number;
  errorCount: number;
  currentFile: string;
  fileType: FileType;
  status: ImportFileStatus;
  message?: string | null;
}

export interface ImportSummary {
  sourcePath: string;
  jpgDestination: string;
  rawDestination: string;
  totalFiles: number;
  copiedCount: number;
  renamedCount: number;
  skippedCount: number;
  unsupportedCount: number;
  errorCount: number;
  completedWithErrors: boolean;
}

export interface AppSettings {
  jpgDestination: string;
  rawDestination: string;
}

export interface SessionRecord {
  id: string;
  completedAt: string;
  sourcePath: string;
  jpgDestination: string;
  rawDestination: string;
  totalFiles: number;
  copiedCount: number;
  skippedCount: number;
  errorCount: number;
  completedWithErrors: boolean;
}

/** @deprecated use DashboardPhase */
export type AppView = 'source' | 'summary' | 'progress' | 'complete';

// ── Dashboard state model ──────────────────────────────────────────────────

export type DashboardPhase = 'idle' | 'scanning' | 'ready' | 'importing' | 'done';

export type FileFilter = 'all' | 'raw' | 'jpg' | 'dupes' | 'new' | 'errors';

export type SortKey = 'filename' | 'type' | 'date' | 'size' | 'status';
export type SortDir = 'asc' | 'desc';

export type LogPrefix = 'SCAN' | 'DUPE' | 'EXIF' | 'MOUNT' | 'IMPORT' | 'NAS';

export interface ImportLogEntry {
  id: number;
  level: 'info' | 'warn' | 'error';
  prefix: LogPrefix;
  text: string;
  timestamp: string;
}

export type FileRowStatus = 'ready' | 'new' | 'duplicate' | 'copied' | 'error' | 'skipped';

export interface FileTableRow {
  file: MediaFile;
  status: FileRowStatus;
  destinationPath: string | null;
  destinationBase: string | null;
}

export interface ProgressState {
  totalFiles: number;
  processedFiles: number;
  copiedCount: number;
  renamedCount: number;
  skippedCount: number;
  errorCount: number;
}
