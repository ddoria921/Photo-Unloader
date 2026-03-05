import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import {
  getAppSettings,
  isTauriRuntime,
  openInFinder,
  saveAppSettings,
  scanCard,
  scanFilesInBrowser,
  startImport
} from '@/lib/commands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster, type ToastItem } from '@/components/ui/toaster';
import type {
  AppView,
  AppSettings,
  ImportFileStatus,
  ImportProgressEvent,
  ImportSummary,
  ScanResult
} from '@/types';

interface ImportLogEntry {
  id: number;
  level: 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

interface ProgressState {
  totalFiles: number;
  processedFiles: number;
  copiedCount: number;
  renamedCount: number;
  skippedCount: number;
  errorCount: number;
}

interface CompletionBadge {
  label: string;
  value: number | string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toLocaleString()} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function defaultDestinationsFor(source: string): { jpg: string; raw: string } {
  const normalized = source.trim().replace(/[\\/]+$/, '');
  if (!normalized) {
    return { jpg: '', raw: '' };
  }

  const separator = normalized.includes('/') ? '/' : normalized.includes('\\') ? '\\' : '/';
  const lastSeparator = normalized.lastIndexOf(separator);
  const parent = lastSeparator > 0 ? normalized.slice(0, lastSeparator) : normalized;

  return {
    jpg: `${parent}${separator}JPG`,
    raw: `${parent}${separator}RAW`
  };
}

function withSettingsFallback(source: string, settings: AppSettings): { jpg: string; raw: string } {
  const defaults = defaultDestinationsFor(source);
  return {
    jpg: settings.jpgDestination.trim() || defaults.jpg,
    raw: settings.rawDestination.trim() || defaults.raw
  };
}

function shortFileName(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

function formatImportStatus(status: ImportFileStatus): string {
  switch (status) {
    case 'Copied':
      return 'Copied';
    case 'RenamedAndCopied':
      return 'Renamed + copied';
    case 'SkippedDuplicate':
      return 'Skipped duplicate';
    case 'UnsupportedType':
      return 'Skipped unsupported';
    case 'Error':
      return 'Error';
    default:
      return status;
  }
}

function nowTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function completionBadges(summary: ImportSummary): CompletionBadge[] {
  return [
    {
      label: 'Status',
      value: summary.completedWithErrors ? 'Completed with issues' : 'Completed',
      tone: summary.completedWithErrors ? 'warning' : 'success'
    },
    { label: 'Copied', value: summary.copiedCount, tone: 'success' },
    { label: 'Renamed', value: summary.renamedCount, tone: 'neutral' },
    { label: 'Skipped', value: summary.skippedCount, tone: 'warning' },
    { label: 'Errors', value: summary.errorCount, tone: summary.errorCount > 0 ? 'danger' : 'neutral' }
  ];
}

const EMPTY_SETTINGS: AppSettings = {
  jpgDestination: '',
  rawDestination: ''
};

const TOAST_DURATION_MS = 4500;

function App() {
  const [appView, setAppView] = useState<AppView>('source');
  const [sourcePath, setSourcePath] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [jpgDestination, setJpgDestination] = useState('');
  const [rawDestination, setRawDestination] = useState('');
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importLog, setImportLog] = useState<ImportLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(EMPTY_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(EMPTY_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextToastIdRef = useRef(1);
  const nextLogIdRef = useRef(1);
  const toastTimeoutsRef = useRef<Map<number, number>>(new Map());
  const importUnlistenRef = useRef<UnlistenFn[]>([]);

  const clearImportListeners = () => {
    for (const unlisten of importUnlistenRef.current) {
      unlisten();
    }
    importUnlistenRef.current = [];
  };

  const addImportLog = (entry: Omit<ImportLogEntry, 'id' | 'timestamp'>) => {
    const nextId = nextLogIdRef.current;
    nextLogIdRef.current += 1;

    setImportLog((current) => [
      ...current,
      {
        id: nextId,
        level: entry.level,
        text: entry.text,
        timestamp: nowTimestamp()
      }
    ]);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
  };

  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = nextToastIdRef.current;
    nextToastIdRef.current += 1;

    setToasts((current) => [...current, { id, ...toast }]);

    const timeout = window.setTimeout(() => {
      dismissToast(id);
    }, TOAST_DURATION_MS);
    toastTimeoutsRef.current.set(id, timeout);
  };

  const showScanErrorToast = (message: string) => {
    showToast({
      title: 'Scan failed',
      description: message,
      variant: 'destructive'
    });
  };

  const applyPreferredDestinations = (source: string, settings: AppSettings) => {
    const preferred = withSettingsFallback(source, settings);
    setJpgDestination(preferred.jpg);
    setRawDestination(preferred.raw);
  };

  useEffect(() => {
    return () => {
      for (const timeout of toastTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      toastTimeoutsRef.current.clear();
      clearImportListeners();
    };
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let cancelled = false;
    const hydrateSettings = async () => {
      try {
        const settings = await getAppSettings();
        if (cancelled) {
          return;
        }
        setAppSettings(settings);
        setSettingsDraft(settings);
      } catch (err) {
        if (!cancelled) {
          showToast({
            title: 'Settings unavailable',
            description: err instanceof Error ? err.message : 'Failed to load saved settings.',
            variant: 'destructive'
          });
        }
      }
    };

    hydrateSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const onBrowse = async () => {
    setAppView('source');
    setScanResult(null);
    setProgressState(null);
    setImportSummary(null);
    setImportLog([]);

    if (!isTauriRuntime()) {
      const fileInput = fileInputRef.current;
      if (!fileInput) {
        showScanErrorToast('Directory picker is not available.');
        return;
      }

      fileInput.setAttribute('webkitdirectory', '');
      fileInput.setAttribute('directory', '');
      fileInput.click();
      return;
    }

    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected || typeof selected !== 'string') {
        return;
      }

      setSourcePath(selected);
      setLoading(true);
      const result = await scanCard(selected);
      setScanResult(result);
      applyPreferredDestinations(selected, appSettings);
      setAppView('summary');
    } catch (err) {
      showScanErrorToast(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectBrowserDirectory = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = event.currentTarget.files
      ? Array.from(event.currentTarget.files)
      : [];
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) {
      return;
    }

    setLoading(true);
    setAppView('source');
    setScanResult(null);
    setProgressState(null);
    setImportSummary(null);
    setImportLog([]);

    try {
      const rootFolder =
        selectedFiles[0]?.webkitRelativePath.split('/').filter(Boolean)[0] ?? 'Selected folder';
      setSourcePath(rootFolder);
      const result = scanFilesInBrowser(selectedFiles);
      setScanResult(result);
      applyPreferredDestinations(rootFolder, appSettings);
      setAppView('summary');
    } catch (err) {
      showScanErrorToast(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setLoading(false);
    }
  };

  const onCancelScan = () => {
    if (importing) {
      return;
    }
    setAppView('source');
    setScanResult(null);
    setProgressState(null);
    setImportSummary(null);
    setImportLog([]);
  };

  const onReset = () => {
    if (importing) {
      return;
    }
    setAppView('source');
    setSourcePath('');
    setScanResult(null);
    setProgressState(null);
    setImportSummary(null);
    setImportLog([]);
    setJpgDestination('');
    setRawDestination('');
    clearImportListeners();
  };

  const onImportAnother = async () => {
    onReset();
    await onBrowse();
  };

  const onOpenInFinder = async () => {
    if (!importSummary) {
      return;
    }

    if (!isTauriRuntime()) {
      showToast({
        title: 'Not available in browser mode',
        description: 'Open in Finder is only available in the native app.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await openInFinder(importSummary.jpgDestination);
    } catch (err) {
      showToast({
        title: 'Failed to open Finder',
        description: err instanceof Error ? err.message : 'Unable to open destination folder.',
        variant: 'destructive'
      });
    }
  };

  const onOpenSettings = () => {
    setSettingsDraft(appSettings);
    setSettingsOpen(true);
  };

  const onSaveSettings = async () => {
    if (!isTauriRuntime()) {
      setAppSettings(settingsDraft);
      setSettingsOpen(false);
      showToast({
        title: 'Settings stored in session',
        description: 'Persistence is only available in the native app.',
        variant: 'default'
      });
      return;
    }

    setSettingsSaving(true);
    try {
      const saved = await saveAppSettings(settingsDraft);
      setAppSettings(saved);
      setSettingsOpen(false);
      if (sourcePath) {
        applyPreferredDestinations(sourcePath, saved);
      }
      showToast({
        title: 'Settings saved',
        description: 'Default destination paths were updated.',
        variant: 'default'
      });
    } catch (err) {
      showToast({
        title: 'Failed to save settings',
        description: err instanceof Error ? err.message : 'Could not save settings.',
        variant: 'destructive'
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const onStartImport = async () => {
    if (!scanResult) {
      return;
    }

    const importableCount = scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount;
    if (importableCount === 0) {
      showToast({
        title: 'Nothing to import',
        description: 'No JPG, RAW, or video files were found in the selected folder.',
        variant: 'default'
      });
      return;
    }

    if (!jpgDestination.trim() || !rawDestination.trim()) {
      showToast({
        title: 'Missing destinations',
        description: 'Set both JPG and RAW destination paths before starting import.',
        variant: 'destructive'
      });
      return;
    }

    if (!isTauriRuntime()) {
      showToast({
        title: 'Native app required',
        description: 'Import can only run in the Tauri desktop app.',
        variant: 'destructive'
      });
      return;
    }

    clearImportListeners();
    setAppView('progress');
    setImportSummary(null);
    setProgressState({
      totalFiles: scanResult.files.length,
      processedFiles: 0,
      copiedCount: 0,
      renamedCount: 0,
      skippedCount: 0,
      errorCount: 0
    });
    setImportLog([]);
    addImportLog({
      level: 'info',
      text: `Starting import for ${scanResult.files.length.toLocaleString()} files...`
    });

    setImporting(true);
    try {
      const unlistenProgress = await listen<ImportProgressEvent>('import-progress', ({ payload }) => {
        setProgressState({
          totalFiles: payload.totalFiles,
          processedFiles: payload.processedFiles,
          copiedCount: payload.copiedCount,
          renamedCount: payload.renamedCount,
          skippedCount: payload.skippedCount,
          errorCount: payload.errorCount
        });

        const level = payload.status === 'Error' ? 'error' : payload.status === 'UnsupportedType' ? 'warn' : 'info';
        const description = payload.message ? ` - ${payload.message}` : '';
        addImportLog({
          level,
          text: `${formatImportStatus(payload.status)} - ${shortFileName(payload.currentFile)}${description}`
        });
      });

      const unlistenComplete = await listen<ImportSummary>('import-complete', ({ payload }) => {
        setImportSummary(payload);
        setAppView('complete');
        addImportLog({
          level: payload.completedWithErrors ? 'warn' : 'info',
          text: `Import completed. Copied ${payload.copiedCount}, skipped ${payload.skippedCount}, errors ${payload.errorCount}.`
        });
      });

      importUnlistenRef.current = [unlistenProgress, unlistenComplete];

      const summary = await startImport({
        sourcePath,
        jpgDestination: jpgDestination.trim(),
        rawDestination: rawDestination.trim()
      });

      setImportSummary(summary);
      setAppView('complete');
      showToast({
        title: summary.completedWithErrors ? 'Import finished with issues' : 'Import complete',
        description: `Copied ${summary.copiedCount}, skipped ${summary.skippedCount}, errors ${summary.errorCount}.`,
        variant: summary.completedWithErrors ? 'destructive' : 'default'
      });
    } catch (err) {
      setAppView('summary');
      addImportLog({
        level: 'error',
        text: err instanceof Error ? err.message : 'Unable to start import.'
      });
      showToast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unable to start import.',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      clearImportListeners();
    }
  };

  const progressPercent = progressState
    ? progressState.totalFiles > 0
      ? Math.min(100, Math.round((progressState.processedFiles / progressState.totalFiles) * 100))
      : 0
    : 0;

  const showSummaryView = appView === 'summary' && scanResult !== null;
  const showProgressView = (appView === 'progress' || appView === 'complete') && progressState !== null;
  const showCompleteView = appView === 'complete' && importSummary !== null;
  const importableCount = scanResult ? scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount : 0;
  const canStartImport = !!scanResult && importableCount > 0 && !importing;

  return (
    <main className="app-shell">
      <div className="app-shell__inner">
        <Card className="app-card">
          <CardHeader className="app-card__header">
            <p className="app-eyebrow">Photo Import Utility</p>
            <CardTitle>Photo Unloader</CardTitle>
            <CardDescription>Choose the folder containing your photos to generate a scan summary.</CardDescription>
          </CardHeader>
          <CardContent className="app-card__content">
            <div className="scan-controls">
              <div className="scan-controls__actions">
                <Button onClick={onBrowse} disabled={loading || importing} className="scan-controls__button">
                  {loading ? 'Scanning...' : 'Browse Folder'}
                </Button>
                <Button variant="outline" onClick={onOpenSettings} disabled={importing || loading}>
                  Settings
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                onChange={onSelectBrowserDirectory}
              />
              {sourcePath && (
                <p className="source-path">
                  Source: <span>{sourcePath}</span>
                </p>
              )}
            </div>

            {showSummaryView && (
              <section className="scan-summary">
                <h3>Scan Summary</h3>
                <dl className="scan-summary__grid">
                  <div className="scan-summary__item">
                    <dt>JPG</dt>
                    <dd>{scanResult.jpgCount.toLocaleString()}</dd>
                  </div>
                  <div className="scan-summary__item">
                    <dt>RAW</dt>
                    <dd>{scanResult.rawCount.toLocaleString()}</dd>
                  </div>
                  <div className="scan-summary__item">
                    <dt>Video</dt>
                    <dd>{scanResult.videoCount.toLocaleString()}</dd>
                  </div>
                  <div className="scan-summary__item">
                    <dt>Unknown</dt>
                    <dd>{scanResult.unknownCount.toLocaleString()}</dd>
                  </div>
                </dl>
                <p className="scan-summary__size">
                  Total size: {formatBytes(scanResult.totalSizeBytes)} (
                  {scanResult.totalSizeBytes.toLocaleString()} bytes)
                </p>
                {importableCount === 0 && (
                  <p className="progress-summary-note">
                    No importable files found (JPG, RAW, or video). Choose another folder to continue.
                  </p>
                )}

                <div className="destination-grid">
                  <label className="destination-field">
                    <span>JPG Destination</span>
                    <Input
                      value={jpgDestination}
                      onChange={(event) => setJpgDestination(event.target.value)}
                      placeholder="/Volumes/PhotoNAS/JPG"
                      disabled={importing}
                    />
                  </label>
                  <label className="destination-field">
                    <span>RAW Destination</span>
                    <Input
                      value={rawDestination}
                      onChange={(event) => setRawDestination(event.target.value)}
                      placeholder="/Volumes/PhotoNAS/RAW"
                      disabled={importing}
                    />
                  </label>
                </div>

                <div className="summary-actions">
                  <Button variant="secondary" onClick={onCancelScan} disabled={importing}>
                    Cancel
                  </Button>
                  <Button onClick={onStartImport} disabled={!canStartImport}>
                    {importing ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </section>
            )}

            {showProgressView && (
              <section className="progress-panel">
                <div className="progress-panel__header">
                  <h3>Import Progress</h3>
                  <p>{progressPercent}% complete</p>
                </div>
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
                </div>

                <dl className="progress-counters">
                  <div>
                    <dt>Processed</dt>
                    <dd>
                      {progressState.processedFiles.toLocaleString()} / {progressState.totalFiles.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt>Copied</dt>
                    <dd>{progressState.copiedCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Renamed</dt>
                    <dd>{progressState.renamedCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Skipped</dt>
                    <dd>{progressState.skippedCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Errors</dt>
                    <dd>{progressState.errorCount.toLocaleString()}</dd>
                  </div>
                </dl>

                {showCompleteView && (
                  <p className="progress-summary-note">
                    {importSummary.completedWithErrors
                      ? 'Import finished with some errors. Review the log below.'
                      : 'Import finished successfully.'}
                  </p>
                )}

                <div className="import-log" role="log" aria-live="polite">
                  {importLog.length === 0 ? (
                    <p className="import-log__empty">Waiting for import events...</p>
                  ) : (
                    importLog.map((entry) => (
                      <p key={entry.id} className={`import-log__entry import-log__entry--${entry.level}`}>
                        <span>{entry.timestamp}</span>
                        <span>{entry.text}</span>
                      </p>
                    ))
                  )}
                </div>
              </section>
            )}

            {showCompleteView && (
              <section className="complete-panel">
                <div className="complete-panel__header">
                  <h3>Import Complete</h3>
                  <p>
                    {importSummary.completedWithErrors
                      ? 'Review warning and error rows in the log.'
                      : 'All files processed without errors.'}
                  </p>
                </div>
                <div className="complete-badges">
                  {completionBadges(importSummary).map((badge) => (
                    <div key={badge.label} className={`complete-badge complete-badge--${badge.tone}`}>
                      <span>{badge.label}</span>
                      <strong>{typeof badge.value === 'number' ? badge.value.toLocaleString() : badge.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="complete-paths">
                  <p>
                    JPG Destination: <span>{importSummary.jpgDestination}</span>
                  </p>
                  <p>
                    RAW Destination: <span>{importSummary.rawDestination}</span>
                  </p>
                </div>
                <div className="complete-actions">
                  <Button variant="secondary" onClick={onReset} disabled={importing}>
                    Reset
                  </Button>
                  <Button variant="outline" onClick={onOpenInFinder} disabled={importing}>
                    Open in Finder
                  </Button>
                  <Button onClick={onImportAnother} disabled={importing}>
                    Import Another
                  </Button>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>

      {settingsOpen && (
        <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="Destination settings">
          <div className="settings-dialog">
            <h3>Destination Settings</h3>
            <p>Configure default destination roots used to prefill JPG and RAW paths on each scan.</p>
            <div className="settings-fields">
              <label className="destination-field">
                <span>Default JPG Destination</span>
                <Input
                  value={settingsDraft.jpgDestination}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({ ...current, jpgDestination: event.target.value }))
                  }
                  placeholder="/Volumes/PhotoNAS/JPG"
                  disabled={settingsSaving}
                />
              </label>
              <label className="destination-field">
                <span>Default RAW Destination</span>
                <Input
                  value={settingsDraft.rawDestination}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({ ...current, rawDestination: event.target.value }))
                  }
                  placeholder="/Volumes/PhotoNAS/RAW"
                  disabled={settingsSaving}
                />
              </label>
            </div>
            <div className="settings-actions">
              <Button variant="secondary" onClick={() => setSettingsOpen(false)} disabled={settingsSaving}>
                Cancel
              </Button>
              <Button onClick={onSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

export default App;
