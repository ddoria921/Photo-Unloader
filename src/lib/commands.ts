import { invoke } from '@tauri-apps/api/core';
import type { ScanResult } from '@/types';

export async function scanCard(sourcePath: string): Promise<ScanResult> {
  return invoke<ScanResult>('scan_card', { sourcePath });
}
