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

export type AppView = 'source' | 'summary' | 'progress' | 'complete';
