export type FileType = 'Jpg' | 'Raw' | 'Video' | 'Unknown';

export interface MediaFile {
  path: string;
  fileType: FileType;
  sizeBytes: number;
  filename: string;
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

/** @deprecated use DashboardPhase */
export type AppView = 'source' | 'summary' | 'progress' | 'complete';

// ── Dashboard state model ──────────────────────────────────────────────────

export type DashboardPhase = 'idle' | 'scanning' | 'ready' | 'importing' | 'done';

export type FileFilter = 'all' | 'raw' | 'jpg' | 'dupes' | 'new' | 'errors';

export type LogPrefix = 'SCAN' | 'DUPE' | 'EXIF' | 'MOUNT' | 'IMPORT';

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
}

export interface ProgressState {
  totalFiles: number;
  processedFiles: number;
  copiedCount: number;
  renamedCount: number;
  skippedCount: number;
  errorCount: number;
}
