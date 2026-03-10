import { useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ImportProgressEvent } from '@/types';

export function useImportListener() {
  const importUnlistenRef = useRef<UnlistenFn[]>([]);

  const clearListeners = () => {
    for (const unlisten of importUnlistenRef.current) {
      unlisten();
    }
    importUnlistenRef.current = [];
  };

  const listenToImportProgress = async (
    onProgress: (payload: ImportProgressEvent) => void
  ): Promise<void> => {
    clearListeners();
    const unlisten = await listen<ImportProgressEvent>('import-progress', ({ payload }) => {
      onProgress(payload);
    });
    importUnlistenRef.current = [unlisten];
  };

  return { listenToImportProgress, clearListeners };
}
