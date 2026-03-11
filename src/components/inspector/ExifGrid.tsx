import { formatBytes } from '@/lib/utils';
import type { MediaFile } from '@/types';

interface ExifGridProps {
  file: MediaFile;
  jpgDestination: string;
  rawDestination: string;
}

function Row({ label, value, accent }: { label: string; value: string | number | null | undefined; accent?: boolean }) {
  const display = value != null ? String(value) : '—';
  return (
    <div className="exif-row">
      <span className="exif-key">{label}</span>
      <span className={accent ? 'exif-val exif-val-accent' : 'exif-val'}>{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="exif-section">
      <div className="exif-section-title">{title}</div>
      {children}
    </div>
  );
}

function getFileTypeLabel(file: MediaFile): string {
  switch (file.fileType) {
    case 'raw':   {
      const ext = file.filename.split('.').pop()?.toUpperCase();
      return ext ? `${ext} RAW` : 'RAW';
    }
    case 'jpg':   return 'JPEG';
    case 'video': return 'Video';
    default:      return 'Unknown';
  }
}

function getDestination(file: MediaFile, jpgDest: string, rawDest: string): string {
  if (!jpgDest && !rawDest) return '—';
  switch (file.fileType) {
    case 'jpg':   return jpgDest || '—';
    case 'raw':   return rawDest || '—';
    case 'video': return jpgDest || '—';
    default:      return '—';
  }
}

export function ExifGrid({ file, jpgDestination, rawDestination }: ExifGridProps) {
  const destPath = getDestination(file, jpgDestination, rawDestination);

  return (
    <div className="inspector-exif">
      <Section title="File">
        <Row label="Name"      value={file.filename} accent />
        <Row label="Size"      value={formatBytes(file.sizeBytes)} />
        <Row label="Format"    value={getFileTypeLabel(file)} />
        <Row label="Date"      value={file.capturedAt?.slice(0, 10)} />
        <Row label="Hash"      value={file.sha256 ? `${file.sha256.slice(0, 4)}…${file.sha256.slice(-4)}` : null} />
      </Section>

      <Section title="Camera">
        <Row label="Make"  value={file.cameraMake} />
        <Row label="Model" value={file.cameraModel} />
      </Section>

      <Section title="Exposure">
        <Row label="Aperture"      value={file.aperture} />
        <Row label="Shutter"       value={file.shutterSpeed} />
        <Row label="ISO"           value={file.iso} />
        <Row label="Focal Length"  value={file.focalLength} />
        <Row label="Lens"          value={file.lens} />
        <Row label="White Balance" value={file.whiteBalance} />
      </Section>

      <Section title="Destination">
        <Row label="Path" value={destPath} accent={destPath !== '—'} />
        {file.pairedFile && (
          <Row label="Pair" value={`${file.pairedFile} ✓`} accent />
        )}
      </Section>
    </div>
  );
}
