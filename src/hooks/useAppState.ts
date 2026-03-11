import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  getAppSettings,
  getSessions,
  isTauriRuntime,
  openInFinder,
  saveAppSettings,
  saveSession,
  scanCard,
  scanFilesInBrowser,
  startImport
} from '@/lib/commands';
import { formatBytes, nowTimestamp, shortFileName } from '@/lib/utils';
import type {
  AppSettings,
  DashboardPhase,
  FileFilter,
  FileRowStatus,
  FileTableRow,
  ImportFileStatus,
  ImportLogEntry,
  ImportProgressEvent,
  ImportSummary,
  LogPrefix,
  MediaFile,
  ProgressState,
  ScanResult,
  SessionRecord,
  SortDir,
  SortKey
} from '@/types';
import { useImportListener } from './useImportListener';
import { useToast } from './useToast';

const EMPTY_SETTINGS: AppSettings = { jpgDestination: '', rawDestination: '' };

function defaultDestinationsFor(source: string): { jpg: string; raw: string } {
  const normalized = source.trim().replace(/[\\/]+$/, '');
  if (!normalized) return { jpg: '', raw: '' };
  const sep = normalized.includes('/') ? '/' : normalized.includes('\\') ? '\\' : '/';
  const lastSep = normalized.lastIndexOf(sep);
  const parent = lastSep > 0 ? normalized.slice(0, lastSep) : normalized;
  return { jpg: `${parent}${sep}JPG`, raw: `${parent}${sep}RAW` };
}

function withSettingsFallback(source: string, settings: AppSettings): { jpg: string; raw: string } {
  const defaults = defaultDestinationsFor(source);
  return {
    jpg: settings.jpgDestination.trim() || defaults.jpg,
    raw: settings.rawDestination.trim() || defaults.raw
  };
}

function statusFromImportStatus(status: ImportFileStatus): FileRowStatus {
  switch (status) {
    case 'Copied':           return 'copied';
    case 'RenamedAndCopied': return 'copied';
    case 'SkippedDuplicate': return 'duplicate';
    case 'UnsupportedType':  return 'skipped';
    case 'Error':            return 'error';
    default:                 return 'ready';
  }
}

function prefixFromImportStatus(status: ImportFileStatus): LogPrefix {
  return status === 'SkippedDuplicate' ? 'DUPE' : 'IMPORT';
}

function getBaseForFile(file: MediaFile, jpgDest: string, rawDest: string): string | null {
  const base = file.fileType === 'raw' ? rawDest.trim()
    : (file.fileType === 'jpg' || file.fileType === 'video') ? jpgDest.trim()
    : null;
  return base || null;
}

function computeDestForFile(
  file: MediaFile,
  jpgDest: string,
  rawDest: string
): { destinationPath: string | null; destinationBase: string | null } {
  const base = getBaseForFile(file, jpgDest, rawDest);
  if (!base) return { destinationPath: null, destinationBase: null };
  if (file.capturedAt) {
    const date = file.capturedAt.slice(0, 10); // "2026-03-15"
    const [year, month] = date.split('-');
    const sub = `${year}/${month}/${date}/`;
    return { destinationPath: `${base}/${sub}`, destinationBase: `${base}/` };
  }
  return { destinationPath: `${base}/`, destinationBase: `${base}/` };
}

function buildFileRows(result: ScanResult, jpgDest = '', rawDest = ''): FileTableRow[] {
  return result.files.map((file) => ({
    file,
    status: 'ready' as FileRowStatus,
    ...computeDestForFile(file, jpgDest, rawDest)
  }));
}

let logEntryId = 0;

function makeLogEntry(
  level: 'info' | 'warn' | 'error',
  prefix: LogPrefix,
  text: string
): ImportLogEntry {
  return { id: logEntryId++, level, prefix, text, timestamp: nowTimestamp() };
}

export interface AppStateReturn {
  // State
  phase: DashboardPhase;
  sourcePath: string;
  sessions: SessionRecord[];
  scanResult: ScanResult | null;
  loading: boolean;
  importing: boolean;
  jpgDestination: string;
  rawDestination: string;
  progressState: ProgressState | null;
  importSummary: ImportSummary | null;
  importLog: ImportLogEntry[];
  appSettings: AppSettings;
  selectedFileIndex: number | null;
  activeFilter: FileFilter;
  fileRows: FileTableRow[];

  // Computed
  importableCount: number;
  selectedCount: number;
  canStartImport: boolean;
  progressPercent: number;
  filteredRows: FileTableRow[];
  duplicateCount: number;
  importedCount: number;
  errorCount: number;
  selectedFile: MediaFile | null;
  estimatedSecondsRemaining: number | null;
  sortKey: SortKey;
  sortDir: SortDir;
  excludedFiles: Set<string>;

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // Toast
  toasts: ReturnType<typeof useToast>['toasts'];
  dismissToast: (id: number) => void;

  // Actions
  onBrowse: () => Promise<void>;
  onSelectBrowserDirectory: (event: ChangeEvent<HTMLInputElement>) => void;
  onRescan: () => Promise<void>;
  onStartImport: () => Promise<void>;
  onReset: () => void;
  onImportAnother: () => Promise<void>;
  onOpenInFinder: () => Promise<void>;
  onJpgDestinationChange: (value: string) => void;
  onRawDestinationChange: (value: string) => void;
  onJpgDestinationBlur: () => Promise<void>;
  onRawDestinationBlur: () => Promise<void>;
  onBrowseJpgDestination: () => Promise<void>;
  onBrowseRawDestination: () => Promise<void>;
  onSelectFile: (index: number) => void;
  onFilterChange: (filter: FileFilter) => void;
  onSortChange: (key: SortKey) => void;
  onToggleFileExclusion: (path: string) => void;
  onToggleAllFiles: () => void;
}

export function useAppState(): AppStateReturn {
  const [phase, setPhase] = useState<DashboardPhase>('idle');
  const [sourcePath, setSourcePath] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [jpgDestination, setJpgDestination] = useState('');
  const [rawDestination, setRawDestination] = useState('');
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importLog, setImportLog] = useState<ImportLogEntry[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(EMPTY_SETTINGS);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [fileRows, setFileRows] = useState<FileTableRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('filename');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [excludedFiles, setExcludedFiles] = useState<Set<string>>(new Set());
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const importStartTimeRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toasts, showToast, dismissToast, clearAllToastTimers } = useToast();
  const { listenToImportProgress, clearListeners } = useImportListener();

  // Load settings and sessions on mount
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let cancelled = false;
    getAppSettings()
      .then((settings) => { if (!cancelled) setAppSettings(settings); })
      .catch(() => {});
    getSessions()
      .then((s) => { if (!cancelled) setSessions(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Recompute destination paths when destinations change
  useEffect(() => {
    if (fileRows.length === 0) return;
    setFileRows((rows) => {
      let changed = false;
      const next = rows.map((row) => {
        const dest = computeDestForFile(row.file, jpgDestination, rawDestination);
        if (dest.destinationPath === row.destinationPath && dest.destinationBase === row.destinationBase) return row;
        changed = true;
        return { ...row, ...dest };
      });
      return changed ? next : rows;
    });
  }, [jpgDestination, rawDestination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllToastTimers();
      clearListeners();
    };
  }, []);

  const addLog = (level: 'info' | 'warn' | 'error', prefix: LogPrefix, text: string) => {
    setImportLog((current) => [...current, makeLogEntry(level, prefix, text)]);
  };

  const applyPreferredDestinations = (source: string, settings: AppSettings) => {
    const preferred = withSettingsFallback(source, settings);
    setJpgDestination(preferred.jpg);
    setRawDestination(preferred.raw);
  };

  const resetScan = () => {
    setScanResult(null);
    setProgressState(null);
    setImportSummary(null);
    setImportLog([]);
    setFileRows([]);
    setSelectedFileIndex(null);
    setExcludedFiles(new Set());
    setPhase('idle');
  };

  const runScan = async (source: string) => {
    setLoading(true);
    setPhase('scanning');
    setImportLog([]);
    setProgressState(null);
    setImportSummary(null);
    setFileRows([]);
    setSelectedFileIndex(null);

    try {
      addLog('info', 'SCAN', `Scanning ${source}…`);
      const result = await scanCard(source);
      const preferred = withSettingsFallback(source, appSettings);
      setScanResult(result);
      setFileRows(buildFileRows(result, preferred.jpg, preferred.raw));
      applyPreferredDestinations(source, appSettings);
      setPhase('ready');
      addLog(
        'info',
        'SCAN',
        `Found ${result.files.length.toLocaleString()} files · ${formatBytes(result.totalSizeBytes)}`
      );
    } catch (err) {
      showToast({
        title: 'Scan failed',
        description: err instanceof Error ? err.message : 'Scan failed.',
        variant: 'destructive'
      });
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const onBrowse = async () => {
    resetScan();

    if (!isTauriRuntime()) {
      const fileInput = fileInputRef.current;
      if (!fileInput) {
        showToast({ title: 'Scan failed', description: 'Directory picker unavailable.', variant: 'destructive' });
        return;
      }
      fileInput.setAttribute('webkitdirectory', '');
      fileInput.setAttribute('directory', '');
      fileInput.click();
      return;
    }

    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected || typeof selected !== 'string') return;
      setSourcePath(selected);
      await runScan(selected);
    } catch (err) {
      showToast({
        title: 'Scan failed',
        description: err instanceof Error ? err.message : 'Scan failed.',
        variant: 'destructive'
      });
      setPhase('idle');
    }
  };

  const onSelectBrowserDirectory = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = event.currentTarget.files
      ? Array.from(event.currentTarget.files)
      : [];
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;

    const rootFolder =
      selectedFiles[0]?.webkitRelativePath.split('/').filter(Boolean)[0] ?? 'Selected folder';
    setSourcePath(rootFolder);
    resetScan();
    setLoading(true);
    setPhase('scanning');

    try {
      const result = scanFilesInBrowser(selectedFiles);
      const preferred = withSettingsFallback(rootFolder, appSettings);
      setScanResult(result);
      setFileRows(buildFileRows(result, preferred.jpg, preferred.raw));
      applyPreferredDestinations(rootFolder, appSettings);
      setPhase('ready');
      addLog('info', 'SCAN', `Found ${result.files.length.toLocaleString()} files in browser mode`);
    } catch (err) {
      showToast({
        title: 'Scan failed',
        description: err instanceof Error ? err.message : 'Scan failed.',
        variant: 'destructive'
      });
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const onRescan = async () => {
    if (!sourcePath || loading || importing) return;
    await runScan(sourcePath);
  };

  const onStartImport = async () => {
    if (!scanResult) return;

    const importableCount = scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount;
    if (importableCount === 0) {
      showToast({ title: 'Nothing to import', description: 'No importable files found.', variant: 'default' });
      return;
    }

    if (!jpgDestination.trim() || !rawDestination.trim()) {
      showToast({ title: 'Missing destinations', description: 'Set both destination paths first.', variant: 'destructive' });
      return;
    }

    if (!isTauriRuntime()) {
      showToast({ title: 'Native app required', description: 'Import only works in the desktop app.', variant: 'destructive' });
      return;
    }

    const filePaths = fileRows
      .filter((r) => !excludedFiles.has(r.file.path))
      .map((r) => r.file.path);

    clearListeners();
    setPhase('importing');
    setImportSummary(null);
    setEstimatedSecondsRemaining(null);
    importStartTimeRef.current = Date.now();
    setProgressState({
      totalFiles: filePaths.length,
      processedFiles: 0,
      copiedCount: 0,
      renamedCount: 0,
      skippedCount: 0,
      errorCount: 0
    });
    addLog('info', 'IMPORT', `Starting import · ${filePaths.length.toLocaleString()} files…`);

    setImporting(true);
    try {
      await listenToImportProgress((payload: ImportProgressEvent) => {
        setProgressState({
          totalFiles: payload.totalFiles,
          processedFiles: payload.processedFiles,
          copiedCount: payload.copiedCount,
          renamedCount: payload.renamedCount,
          skippedCount: payload.skippedCount,
          errorCount: payload.errorCount
        });

        // Compute estimated time remaining
        if (importStartTimeRef.current !== null && payload.processedFiles > 0) {
          const elapsedMs = Date.now() - importStartTimeRef.current;
          const msPerFile = elapsedMs / payload.processedFiles;
          const remaining = payload.totalFiles - payload.processedFiles;
          setEstimatedSecondsRemaining(Math.ceil((msPerFile * remaining) / 1000));
        }

        const filename = shortFileName(payload.currentFile);
        const level = payload.status === 'Error' ? 'error'
          : payload.status === 'SkippedDuplicate' ? 'warn'
          : 'info';
        const prefix = prefixFromImportStatus(payload.status);
        const detail = payload.message ? ` · ${payload.message}` : '';
        addLog(level, prefix, `${filename}${detail}`);

        const rowStatus = statusFromImportStatus(payload.status);
        setFileRows((current) =>
          current.map((row) =>
            row.file.filename === filename
              ? { ...row, status: rowStatus }
              : row
          )
        );
      });

      const summary = await startImport({
        sourcePath,
        jpgDestination: jpgDestination.trim(),
        rawDestination: rawDestination.trim(),
        filePaths
      });

      setImportSummary(summary);
      setEstimatedSecondsRemaining(null);
      importStartTimeRef.current = null;
      setPhase('done');

      // Persist session record
      if (isTauriRuntime()) {
        const record: SessionRecord = {
          id: String(Date.now()),
          completedAt: new Date().toISOString(),
          sourcePath,
          jpgDestination: jpgDestination.trim(),
          rawDestination: rawDestination.trim(),
          totalFiles: summary.totalFiles,
          copiedCount: summary.copiedCount,
          skippedCount: summary.skippedCount,
          errorCount: summary.errorCount,
          completedWithErrors: summary.completedWithErrors
        };
        saveSession(record)
          .then(() => getSessions())
          .then((s) => setSessions(s))
          .catch(() => {});
      }
      addLog(
        summary.completedWithErrors ? 'warn' : 'info',
        'IMPORT',
        `Complete · copied ${summary.copiedCount} · skipped ${summary.skippedCount} · errors ${summary.errorCount}`
      );
      showToast({
        title: summary.completedWithErrors ? 'Import finished with issues' : 'Import complete',
        description: `Copied ${summary.copiedCount}, skipped ${summary.skippedCount}, errors ${summary.errorCount}.`,
        variant: summary.completedWithErrors ? 'destructive' : 'default'
      });
    } catch (err) {
      setPhase('ready');
      addLog('error', 'IMPORT', err instanceof Error ? err.message : 'Import failed.');
      showToast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unable to start import.',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      clearListeners();
    }
  };

  const onReset = () => {
    if (importing) return;
    resetScan();
    setSourcePath('');
    setJpgDestination('');
    setRawDestination('');
    clearListeners();
  };

  const onImportAnother = async () => {
    setSourcePath('');
    setJpgDestination('');
    setRawDestination('');
    clearListeners();
    await onBrowse();
  };

  const onOpenInFinder = async () => {
    if (!importSummary) return;
    if (!isTauriRuntime()) {
      showToast({ title: 'Not available', description: 'Open in Finder requires the native app.', variant: 'destructive' });
      return;
    }
    try {
      await openInFinder(importSummary.jpgDestination);
    } catch (err) {
      showToast({
        title: 'Failed to open Finder',
        description: err instanceof Error ? err.message : 'Could not open folder.',
        variant: 'destructive'
      });
    }
  };

  const persistDestinations = async (jpg: string, raw: string) => {
    if (!isTauriRuntime()) return;
    try {
      const saved = await saveAppSettings({ jpgDestination: jpg.trim(), rawDestination: raw.trim() });
      setAppSettings(saved);
    } catch { /* silently ignore */ }
  };

  const onJpgDestinationChange = (value: string) => setJpgDestination(value);
  const onRawDestinationChange = (value: string) => setRawDestination(value);
  const onJpgDestinationBlur = () => persistDestinations(jpgDestination, rawDestination);
  const onRawDestinationBlur = () => persistDestinations(jpgDestination, rawDestination);

  const onBrowseJpgDestination = async () => {
    if (!isTauriRuntime()) return;
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setJpgDestination(selected);
        await persistDestinations(selected, rawDestination);
      }
    } catch { /* silently ignore */ }
  };

  const onBrowseRawDestination = async () => {
    if (!isTauriRuntime()) return;
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setRawDestination(selected);
        await persistDestinations(jpgDestination, selected);
      }
    } catch { /* silently ignore */ }
  };

  const onSelectFile = (index: number) => {
    setSelectedFileIndex((prev) => (prev === index ? null : index));
  };

  const onFilterChange = (filter: FileFilter) => setActiveFilter(filter);

  const onToggleFileExclusion = (path: string) => {
    setExcludedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const onToggleAllFiles = () => {
    const allVisibleSelected = filteredRows.length > 0 &&
      filteredRows.every((r) => !excludedFiles.has(r.file.path));
    setExcludedFiles((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredRows.forEach((r) => next.add(r.file.path));
      } else {
        filteredRows.forEach((r) => next.delete(r.file.path));
      }
      return next;
    });
  };

  const onSortChange = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  // Computed values
  const totalImportable = scanResult
    ? scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount
    : 0;
  const selectedCount = useMemo(
    () => fileRows.filter((r) => !excludedFiles.has(r.file.path) && r.file.fileType !== 'unknown').length,
    [fileRows, excludedFiles]
  );
  const importableCount = selectedCount;
  const canStartImport = !!scanResult && importableCount > 0 && !importing && phase === 'ready';

  const progressPercent = progressState && progressState.totalFiles > 0
    ? Math.min(100, Math.round((progressState.processedFiles / progressState.totalFiles) * 100))
    : 0;

  const filteredRows = useMemo(() => {
    const filtered = fileRows.filter((row) => {
      switch (activeFilter) {
        case 'raw':    return row.file.fileType === 'raw';
        case 'jpg':    return row.file.fileType === 'jpg';
        case 'dupes':  return row.status === 'duplicate';
        case 'new':    return row.status === 'copied';
        case 'errors': return row.status === 'error';
        default:       return true;
      }
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'filename': return dir * a.file.filename.localeCompare(b.file.filename);
        case 'type':     return dir * a.file.fileType.localeCompare(b.file.fileType);
        case 'date':     return dir * (a.file.capturedAt ?? '').localeCompare(b.file.capturedAt ?? '');
        case 'size':     return dir * (a.file.sizeBytes - b.file.sizeBytes);
        case 'status':   return dir * a.status.localeCompare(b.status);
        default:         return 0;
      }
    });
  }, [fileRows, activeFilter, sortKey, sortDir]);

  const duplicateCount = useMemo(() => fileRows.filter((r) => r.status === 'duplicate').length, [fileRows]);
  const importedCount  = useMemo(() => fileRows.filter((r) => r.status === 'copied').length,    [fileRows]);
  const errorCount     = useMemo(() => fileRows.filter((r) => r.status === 'error').length,      [fileRows]);

  const selectedFile = selectedFileIndex !== null ? fileRows[selectedFileIndex]?.file ?? null : null;

  return {
    phase,
    sourcePath,
    sessions,
    scanResult,
    loading,
    importing,
    jpgDestination,
    rawDestination,
    progressState,
    importSummary,
    importLog,
    appSettings,
    selectedFileIndex,
    activeFilter,
    fileRows,
    importableCount,
    selectedCount,
    canStartImport,
    progressPercent,
    filteredRows,
    duplicateCount,
    importedCount,
    errorCount,
    selectedFile,
    estimatedSecondsRemaining,
    fileInputRef,
    toasts,
    dismissToast,
    onBrowse,
    onSelectBrowserDirectory,
    onRescan,
    onStartImport,
    onReset,
    onImportAnother,
    onOpenInFinder,
    onJpgDestinationChange,
    onRawDestinationChange,
    onJpgDestinationBlur,
    onRawDestinationBlur,
    onBrowseJpgDestination,
    onBrowseRawDestination,
    onSelectFile,
    onFilterChange,
    onSortChange,
    onToggleFileExclusion,
    onToggleAllFiles,
    sortKey,
    sortDir,
    excludedFiles
  };
}
