import { useRef, useState, type ChangeEvent } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { isTauriRuntime, scanCard, scanFilesInBrowser } from '@/lib/commands';
import type { ScanResult } from '@/types';

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

function App() {
  const [sourcePath, setSourcePath] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onBrowse = async () => {
    setError(null);
    setScanResult(null);

    if (!isTauriRuntime()) {
      const fileInput = fileInputRef.current;
      if (!fileInput) {
        setError('Directory picker is not available.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
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
    setError(null);
    setScanResult(null);

    try {
      const rootFolder =
        selectedFiles[0]?.webkitRelativePath.split('/').filter(Boolean)[0] ?? 'Selected folder';
      setSourcePath(rootFolder);
      const result = scanFilesInBrowser(selectedFiles);
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell">
      <header className="header">
        <h1>Photo Unloader</h1>
      </header>

      <section className="card">
        <h2>Select SD Card</h2>
        <p>Choose the folder containing your photos.</p>
        <button onClick={onBrowse} disabled={loading}>
          {loading ? 'Scanning…' : 'Browse…'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={onSelectBrowserDirectory}
        />

        {sourcePath && <p className="muted">Source: {sourcePath}</p>}
        {error && <p className="error">{error}</p>}

        {scanResult && (
          <div className="summary">
            <h3>Scan summary</h3>
            <ul>
              <li>JPG: {scanResult.jpgCount}</li>
              <li>RAW: {scanResult.rawCount}</li>
              <li>Video: {scanResult.videoCount}</li>
              <li>Unknown: {scanResult.unknownCount}</li>
            </ul>
            <p>
              Total size: {formatBytes(scanResult.totalSizeBytes)} (
              {scanResult.totalSizeBytes.toLocaleString()} bytes)
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
