import { useEffect, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriRuntime, isDirectory } from '@/lib/commands';

interface FileTableEmptyProps {
  scanning?: boolean;
  onBrowse: () => void;
  onDropPath: (path: string) => void;
}

type DragState = 'idle' | 'valid' | 'invalid';

export function FileTableEmpty({ scanning, onBrowse, onDropPath }: FileTableEmptyProps) {
  const [dragState, setDragState] = useState<DragState>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const dragCounterRef = useRef(0);
  // Ref so the Tauri drop handler reads current validity without stale closure
  const dragValidRef = useRef(false);

  const triggerShake = () => {
    setIsShaking(false);
    // Force re-trigger if already shaking by flushing first
    requestAnimationFrame(() => setIsShaking(true));
  };

  // Tauri: window-level drag-drop events
  useEffect(() => {
    if (!isTauriRuntime() || scanning) return;

    let unlisten: (() => void) | null = null;

    getCurrentWindow()
      .onDragDropEvent((event) => {
        const p = event.payload;
        if (p.type === 'enter') {
          const paths = 'paths' in p ? p.paths : [];
          if (paths.length > 0) {
            isDirectory(paths[0]).then((isDir) => {
              dragValidRef.current = isDir;
              setDragState(isDir ? 'valid' : 'invalid');
            });
          }
        } else if (p.type === 'leave') {
          dragValidRef.current = false;
          setDragState('idle');
        } else if (p.type === 'drop') {
          const wasValid = dragValidRef.current;
          dragValidRef.current = false;
          setDragState('idle');
          if (wasValid) {
            const paths = 'paths' in p ? p.paths : [];
            if (paths.length > 0) onDropPath(paths[0]);
          } else {
            triggerShake();
          }
        }
      })
      .then((fn) => { unlisten = fn; })
      .catch(() => {});

    return () => { unlisten?.(); };
  }, [scanning, onDropPath]);

  // Browser: HTML drag events (counter avoids flicker on child-element transitions)
  const handleDragEnter = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      const entry = e.dataTransfer.items[0]?.webkitGetAsEntry?.();
      const isValid = entry?.isDirectory ?? false;
      dragValidRef.current = isValid;
      setDragState(isValid ? 'valid' : 'invalid');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      dragValidRef.current = false;
      setDragState('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isTauriRuntime()) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    dragValidRef.current = false;
    setDragState('idle');

    const entry = Array.from(e.dataTransfer.items)[0]?.webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      onBrowse();
    } else {
      triggerShake();
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

  const dropZoneClass = [
    'drop-zone',
    dragState === 'valid' && 'drop-zone-active',
    dragState === 'invalid' && 'drop-zone-invalid',
    isShaking && 'drop-zone-shake',
  ].filter(Boolean).join(' ');

  const label =
    dragState === 'valid' ? 'Release to scan' :
    dragState === 'invalid' ? 'Drop a folder, not individual files' :
    'Drop your SD card folder here';

  return (
    <div
      className="file-table-empty"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={dropZoneClass}
        role="region"
        aria-label="Source folder drop zone"
        onAnimationEnd={() => setIsShaking(false)}
      >
        <svg className="drop-zone-icon" width="36" height="36" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5.5C2 4.67 2.67 4 3.5 4H7.38C7.74 4 8.08 4.15 8.32 4.41L9.68 5.59C9.92 5.85 10.26 6 10.62 6H16.5C17.33 6 18 6.67 18 7.5V14.5C18 15.33 17.33 16 16.5 16H3.5C2.67 16 2 15.33 2 14.5V5.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>

        <span className="drop-zone-label">{label}</span>

        <button
          className="browse-btn drop-zone-browse-btn"
          onClick={(e) => { e.stopPropagation(); onBrowse(); }}
        >
          ⊕ Browse Folder
        </button>
      </div>
    </div>
  );
}
