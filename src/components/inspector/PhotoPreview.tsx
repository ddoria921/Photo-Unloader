import type { MediaFile } from '@/types';

interface PhotoPreviewProps {
  file: MediaFile;
}

export function PhotoPreview({ file }: PhotoPreviewProps) {
  return (
    <div className="inspector-preview">
      <div className="inspector-preview-placeholder">
        <span className="inspector-preview-icon">⬡</span>
        <span className="inspector-preview-label">
          {file.fileType === 'raw' ? 'RAW · No Preview' :
           file.fileType === 'video' ? 'Video · No Preview' :
           'No Preview'}
        </span>
      </div>
    </div>
  );
}
