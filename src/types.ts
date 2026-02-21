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
