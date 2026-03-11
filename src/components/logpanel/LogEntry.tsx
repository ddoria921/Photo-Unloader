import React from 'react';
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
    case 'NAS':    return 'log-prefix log-prefix-nas';
    default:       return 'log-prefix log-prefix-import';
  }
}

// Match file paths (starts with / or ~) or status keywords
const LOG_HIGHLIGHT_PATTERN = /(\/[^\s]+|~\/[^\s]+|COPIED|SKIPPED|DUPLICATE|ERROR|SKIP)/g;

// Parse log text and highlight file paths and status keywords
function highlightLogText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  LOG_HIGHLIGHT_PATTERN.lastIndex = 0;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = LOG_HIGHLIGHT_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token === 'COPIED' || token === 'DUPLICATE') {
      parts.push(<span key={match.index} className="log-hl-ok">{token}</span>);
    } else if (token === 'SKIPPED' || token === 'SKIP' || token === 'ERROR') {
      parts.push(<span key={match.index} className="log-hl-warn">{token}</span>);
    } else {
      parts.push(<span key={match.index} className="log-hl-path">{token}</span>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? <>{parts}</> : text;
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
      <span className={textClass(entry.level)} title={entry.text}>{highlightLogText(entry.text)}</span>
    </div>
  );
}
