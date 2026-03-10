import type { ImportLogEntry, LogPrefix } from '@/types';

interface LogEntryProps {
  entry: ImportLogEntry;
}

function prefixClass(prefix: LogPrefix): string {
  switch (prefix) {
    case 'SCAN':   return 'log-prefix log-prefix-scan';
    case 'DUPE':   return 'log-prefix log-prefix-dupe';
    case 'IMPORT': return 'log-prefix log-prefix-import';
    case 'MOUNT':  return 'log-prefix log-prefix-mount';
    case 'EXIF':   return 'log-prefix log-prefix-exif';
    default:       return 'log-prefix log-prefix-import';
  }
}

function textClass(level: ImportLogEntry['level']): string {
  switch (level) {
    case 'warn':  return 'log-text log-text-warn';
    case 'error': return 'log-text log-text-error';
    default:      return 'log-text';
  }
}

export function LogEntry({ entry }: LogEntryProps) {
  return (
    <div className="log-entry">
      <span className="log-time">{entry.timestamp}</span>
      <span className={prefixClass(entry.prefix)}>{entry.prefix}</span>
      <span className={textClass(entry.level)} title={entry.text}>{entry.text}</span>
    </div>
  );
}
