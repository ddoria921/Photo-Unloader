import { isTauriRuntime } from '@/lib/commands';

const IS_TAURI = isTauriRuntime();

interface DestinationSectionProps {
  jpgDestination: string;
  rawDestination: string;
  disabled: boolean;
  locked: boolean;
  onJpgChange: (value: string) => void;
  onRawChange: (value: string) => void;
  onJpgBlur: () => void;
  onRawBlur: () => void;
  onJpgBrowse: () => void;
  onRawBrowse: () => void;
}

function DestField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
  onBlur,
  onBrowse,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  onBrowse: () => void;
}) {
  return (
    <div className="dest-field">
      <span className="dest-field-label">{label}</span>
      {IS_TAURI ? (
        <button
          className="dest-pick-btn"
          onClick={onBrowse}
          disabled={disabled}
          title={value || placeholder}
        >
          <span className="dest-pick-path">{value || <span className="dest-pick-placeholder">{placeholder}</span>}</span>
          <span className="dest-pick-icon">⌄</span>
        </button>
      ) : (
        <input
          className="dest-input"
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

export function DestinationSection({
  jpgDestination,
  rawDestination,
  disabled,
  locked,
  onJpgChange,
  onRawChange,
  onJpgBlur,
  onRawBlur,
  onJpgBrowse,
  onRawBrowse,
}: DestinationSectionProps) {
  return (
    <div className="sidebar-section">
      <span className="sidebar-section-label">Destination</span>
      <div className={`dest-section${locked ? ' dest-section--locked' : ''}`}>
        <DestField
          label="JPG"
          value={jpgDestination}
          placeholder="Choose folder…"
          disabled={disabled || locked}
          onChange={onJpgChange}
          onBlur={onJpgBlur}
          onBrowse={onJpgBrowse}
        />
        <DestField
          label="RAW"
          value={rawDestination}
          placeholder="Choose folder…"
          disabled={disabled || locked}
          onChange={onRawChange}
          onBlur={onRawBlur}
          onBrowse={onRawBrowse}
        />
      </div>
      {locked && (
        <p className="dest-locked-hint">Select a source to configure destinations</p>
      )}
    </div>
  );
}
