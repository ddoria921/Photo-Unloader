import { formatBytes } from '@/lib/utils';
import type { MediaFile } from '@/types';

interface ExifGridProps {
  file: MediaFile;
  jpgDestination: string;
  rawDestination: string;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="exif-row">
      <span className="exif-key">{label}</span>
      <span className={accent ? 'exif-val exif-val-accent' : 'exif-val'}>{value}</span>
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
    case 'Raw':   {
      const ext = file.filename.split('.').pop()?.toUpperCase();
      return ext ? `${ext} RAW` : 'RAW';
    }
    case 'Jpg':   return 'JPEG';
    case 'Video': return 'Video';
    default:      return 'Unknown';
  }
}

function getDestination(file: MediaFile, jpgDest: string, rawDest: string): string {
  if (!jpgDest && !rawDest) return '—';
  switch (file.fileType) {
    case 'Jpg':   return jpgDest || '—';
    case 'Raw':   return rawDest || '—';
    case 'Video': return jpgDest || '—';
    default:      return '—';
  }
}

export function ExifGrid({ file, jpgDestination, rawDestination }: ExifGridProps) {
  const destPath = getDestination(file, jpgDestination, rawDestination);

  return (
    <div className="inspector-exif">
      <Section title="File">
        <Row label="Name"   value={file.filename} accent />
        <Row label="Size"   value={formatBytes(file.sizeBytes)} />
        <Row label="Format" value={getFileTypeLabel(file)} />
        <Row label="Hash"   value="—" />
      </Section>

      <Section title="Camera">
        <Row label="Make"   value="—" />
        <Row label="Model"  value="—" />
        <Row label="Serial" value="—" />
      </Section>

      <Section title="Exposure">
        <Row label="Aperture"    value="—" />
        <Row label="Shutter"     value="—" />
        <Row label="ISO"         value="—" />
        <Row label="Focal Length" value="—" />
        <Row label="Lens"        value="—" />
        <Row label="White Balance" value="—" />
      </Section>

      <Section title="Destination">
        <Row label="Path" value={destPath} accent={destPath !== '—'} />
      </Section>
    </div>
  );
}
