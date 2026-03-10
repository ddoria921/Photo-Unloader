interface DestinationSectionProps {
  jpgDestination: string;
  rawDestination: string;
  disabled: boolean;
  onJpgChange: (value: string) => void;
  onRawChange: (value: string) => void;
  onJpgBlur: () => void;
  onRawBlur: () => void;
}

export function DestinationSection({
  jpgDestination,
  rawDestination,
  disabled,
  onJpgChange,
  onRawChange,
  onJpgBlur,
  onRawBlur
}: DestinationSectionProps) {
  return (
    <div className="sidebar-section">
      <span className="sidebar-section-label">Destination</span>
      <div className="dest-section">
        <div className="dest-field">
          <span className="dest-field-label">JPG</span>
          <input
            className="dest-input"
            type="text"
            value={jpgDestination}
            placeholder="/Volumes/NAS/JPG"
            disabled={disabled}
            onChange={(e) => onJpgChange(e.target.value)}
            onBlur={onJpgBlur}
          />
        </div>
        <div className="dest-field">
          <span className="dest-field-label">RAW</span>
          <input
            className="dest-input"
            type="text"
            value={rawDestination}
            placeholder="/Volumes/NAS/RAW"
            disabled={disabled}
            onChange={(e) => onRawChange(e.target.value)}
            onBlur={onRawBlur}
          />
        </div>
      </div>
    </div>
  );
}
