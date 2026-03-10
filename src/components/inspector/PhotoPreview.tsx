import { isTauriRuntime } from '@/lib/commands';
import type { MediaFile } from '@/types';

interface PhotoPreviewProps {
  file: MediaFile;
  browserFile?: File | null;
}

export function PhotoPreview({ file, browserFile }: PhotoPreviewProps) {
  // Best-effort preview for JPGs in browser mode
  const canShowPreview = !isTauriRuntime() && file.fileType === 'Jpg' && browserFile;

  if (canShowPreview && browserFile) {
    const url = URL.createObjectURL(browserFile);
    return (
      <div className="inspector-preview">
        <img
          src={url}
          alt={file.filename}
          onLoad={() => URL.revokeObjectURL(url)}
          onError={(e) => { URL.revokeObjectURL(url); (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }

  return (
    <div className="inspector-preview">
      <div className="inspector-preview-placeholder">
        <span className="inspector-preview-icon">⬡</span>
        <span className="inspector-preview-label">
          {file.fileType === 'Raw' ? 'RAW · No Preview' :
           file.fileType === 'Video' ? 'Video · No Preview' :
           'No Preview'}
        </span>
      </div>
    </div>
  );
}
