interface FileTableEmptyProps {
  scanning?: boolean;
}

export function FileTableEmpty({ scanning }: FileTableEmptyProps) {
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
    <div className="file-table-empty">
      <span className="file-table-empty-icon">⬡</span>
      <span className="file-table-empty-title">No source selected</span>
      <span className="file-table-empty-hint">Browse a folder to scan for photos</span>
    </div>
  );
}
