import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { scanCard } from '@/lib/commands';
import type { ScanResult } from '@/types';

function App() {
  const [sourcePath, setSourcePath] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBrowse = async () => {
    setError(null);
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== 'string') {
      return;
    }

    setSourcePath(selected);
    setLoading(true);
    try {
      const result = await scanCard(selected);
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
            <p>Total size: {scanResult.totalSizeBytes.toLocaleString()} bytes</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
