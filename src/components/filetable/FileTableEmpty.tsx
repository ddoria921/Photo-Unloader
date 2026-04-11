import { useEffect, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriRuntime } from '@/lib/commands';

interface FileTableEmptyProps {
  scanning?: boolean;
  onBrowse: () => void;
  onDropPath: (path: string) => void;
}

export function FileTableEmpty({ scanning, onBrowse, onDropPath }: FileTableEmptyProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  // Tauri: window-level drag-drop events
  useEffect(() => {
    if (!isTauriRuntime() || scanning) return;

    let unlisten: (() => void) | null = null;

    getCurrentWindow()
      .onDragDropEvent((event) => {
        const p = event.payload;
        if (p.type === 'enter' || p.type === 'over') {
          setIsDragOver(true);
          setDropError(null);
        } else if (p.type === 'leave') {
          setIsDragOver(false);
        } else if (p.type === 'drop') {
          setIsDragOver(false);
          const paths = 'paths' in p ? p.paths : [];
          if (paths.length > 0) {
            onDropPath(paths[0]);
          }
        }
      })
      .then((fn) => { unlisten = fn; })
      .catch(() => {});

    return () => {
      unlisten?.();
    };
  }, [scanning, onDropPath]);

  // Browser: HTML drag events (counter avoids flicker on child-element transitions)
  const handleDragEnter = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragOver(true);
    setDropError(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const items = Array.from(e.dataTransfer.items);
    const entry = items[0]?.webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      onBrowse();
    } else {
      setDropError('Please drop a folder, not individual files.');
    }
  };

  if (scanning) {
    return (
      <div className="file-table-scanning">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="shimmer-row" style={{ opacity: 1 - i * 0.06 }} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="file-table-empty"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`drop-zone${isDragOver ? ' drop-zone-active' : ''}`}>
        <svg className="drop-zone-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5.5C2 4.67 2.67 4 3.5 4H7.38C7.74 4 8.08 4.15 8.32 4.41L9.68 5.59C9.92 5.85 10.26 6 10.62 6H16.5C17.33 6 18 6.67 18 7.5V14.5C18 15.33 17.33 16 16.5 16H3.5C2.67 16 2 15.33 2 14.5V5.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>

        <span className="drop-zone-label">
          {isDragOver ? 'Release to scan' : 'Drop a folder or SD card'}
        </span>

        <span className="drop-zone-sub">
          or{' '}
          <button className="drop-zone-link" onClick={onBrowse} type="button">
            Browse Folder
          </button>
        </span>

        {dropError && (
          <span className="drop-zone-error">{dropError}</span>
        )}
      </div>
    </div>
  );
}
