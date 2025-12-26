import React from 'react';
import { Icons } from '../Icons';
import { getMediaKind, isVideo, isAudio } from './mediaUtils';

interface PreviewSourceProps {
  previewMediaUrl?: string;
  source?: string;
  sourceAuthor?: string;
  compact?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const PreviewSource: React.FC<PreviewSourceProps> = ({ previewMediaUrl, source, sourceAuthor, compact = true, showDetails = false, onToggleDetails }) => {
  const url = previewMediaUrl || '';
  const kind = getMediaKind(url);

  const renderCompactPreview = () => {
    return (
      <div className="flex items-center gap-3">
        {previewMediaUrl ? (
          <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-white/6">
            {kind === 'video' ? (
              <video src={url} className="w-full h-full object-cover" />
            ) : kind === 'audio' ? (
              <Icons.Play size={14} className="text-gray-400" />
            ) : (
              <img src={url} alt="preview" className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className="w-16 h-10 rounded-md bg-gray-800 flex items-center justify-center border border-white/6 text-xs text-gray-500">预览</div>
        )}

        <div className="min-w-0">
          <p className="text-sm text-gray-200 truncate">{source || '未设置来源'}</p>
          <p className="text-xs text-gray-400 truncate">{sourceAuthor || ''}</p>
        </div>

        <div className="ml-auto">
          {onToggleDetails && (
            <button onClick={onToggleDetails} className="text-xs text-gray-400 hover:text-white transition-colors">
              {showDetails ? '收起详情' : '展开详情'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderExpandedPreview = () => {
    if (!previewMediaUrl) return null;
    if (isVideo(url)) {
      return <video src={url} controls className="w-full rounded-lg border border-white/10 bg-black" />;
    }
    if (isAudio(url)) {
      return <audio src={url} controls className="w-full rounded-lg" />;
    }
    return <img src={url} alt="preview" className="w-full rounded-lg object-contain border border-white/10" />;
  };

  return compact ? (
    renderCompactPreview()
  ) : (
    <div>
      {renderExpandedPreview()}
      {previewMediaUrl && (
        <div className="flex gap-2 mt-2">
          <a href={previewMediaUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-white">在新标签中打开</a>
        </div>
      )}
    </div>
  );
};

export default PreviewSource;


