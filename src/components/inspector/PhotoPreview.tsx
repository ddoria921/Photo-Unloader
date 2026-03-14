import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { MediaFile } from '@/types';
import { isTauriRuntime } from '@/lib/commands';

interface PhotoPreviewProps {
  file: MediaFile;
}

const VIEWABLE_TYPES = new Set(['jpg']);

export function PhotoPreview({ file }: PhotoPreviewProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (isTauriRuntime() && VIEWABLE_TYPES.has(file.fileType)) {
      try {
        setImgSrc(convertFileSrc(file.path.toString()));
      } catch {
        setImgSrc(null);
      }
    } else {
      setImgSrc(null);
    }
  }, [file.path, file.fileType]);

  if (imgSrc && !failed) {
    return (
      <div className="inspector-preview">
        <img
          src={imgSrc}
          alt={file.filename}
          className="inspector-preview-image"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const label =
    file.fileType === 'raw' ? 'RAW · No Preview' :
    file.fileType === 'video' ? 'Video · No Preview' :
    'No Preview';

  return (
    <div className="inspector-preview">
      <div className="inspector-preview-placeholder">
        <span className="inspector-preview-icon">⬡</span>
        <span className="inspector-preview-label">{label}</span>
      </div>
    </div>
  );
}
