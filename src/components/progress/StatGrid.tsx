interface StatGridProps {
  queued: number;
  dupes: number;
  imported: number;
  errors: number;
}

function StatBox({
  value,
  label,
  colorClass
}: {
  value: number;
  label: string;
  colorClass?: string;
}) {
  return (
    <div className="stat-box">
      <div className={`stat-box-value${colorClass ? ' ' + colorClass : ''}`}>
        {value.toLocaleString()}
      </div>
      <div className="stat-box-label">{label}</div>
    </div>
  );
}

export function StatGrid({ queued, dupes, imported, errors }: StatGridProps) {
  return (
    <div className="stat-grid">
      <StatBox value={queued}   label="Queued"   colorClass="stat-box-value-yellow" />
      <StatBox value={dupes}    label="Dupes"    />
      <StatBox value={imported} label="Imported" colorClass={imported > 0 ? 'stat-box-value-green' : undefined} />
      <StatBox value={errors}   label="Errors"   colorClass={errors > 0 ? 'stat-box-value-red' : undefined} />
    </div>
  );
}
