import React, { useState } from 'react';
import { PromptFormData } from '../types';
import { Icons } from './Icons';

interface AestheticCardProps {
  data: PromptFormData;
  onClose?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onNotify?: (message: string, type: 'success' | 'info' | 'error') => void;
  isModal?: boolean;
  previewMode?: 'raw' | 'interpolated';
  getCompiledPrompt?: () => string;
}

export const AestheticCard: React.FC<AestheticCardProps> = ({
  data,
  onClose,
  onDownload,
  onCopy,
  onNotify,
  isModal,
  previewMode = 'raw',
  getCompiledPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const displayText =
    previewMode === 'interpolated' && getCompiledPrompt
      ? getCompiledPrompt()
      : data.content;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (onCopy) {
        onCopy();
      } else {
        await navigator.clipboard.writeText(displayText);
      }
      setCopied(true);
      onNotify?.('Prompt content copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      onNotify?.('Failed to copy to clipboard', 'error');
    }
  };

  const getGradient = () => {
    switch (data.category) {
      case 'Code':
        return 'from-blue-900/40 via-gray-900 to-gray-950 text-blue-400';
      case 'Writing':
        return 'from-purple-900/40 via-gray-900 to-gray-950 text-purple-400';
      case 'Ideas':
        return 'from-yellow-900/40 via-gray-900 to-gray-950 text-yellow-400';
      case 'Analysis':
        return 'from-green-900/40 via-gray-900 to-gray-950 text-green-400';
      default:
        return 'from-brand-500/20 via-gray-900 to-gray-950 text-brand-400';
    }
  };

  const renderCard = (
    <div
      className={`relative overflow-hidden ${isModal ? 'rounded-3xl w-full' : 'rounded-2xl aspect-[1.85/1] group/card'
        } bg-gray-950 border border-white/10 shadow-2xl transition-all duration-500`}
    >
      {/* Background Section */}
      <div className="absolute inset-0 z-0">
        {data.previewMediaUrl ? (
          <div className="relative w-full h-full">
            {imgStatus === 'loading' && (
              <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
                <Icons.Run className="w-8 h-8 text-white/10 animate-spin" />
              </div>
            )}
            <img
              src={data.previewMediaUrl}
              alt={data.title}
              onLoad={() => setImgStatus('loaded')}
              onError={() => setImgStatus('error')}
              className={`w-full h-full object-cover transition-all duration-1000 ${imgStatus === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                } hover:scale-105`}
              style={{ minWidth: '24px' }} // Ensure clarity on small renders
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/95 via-gray-950/60 to-gray-950/30" />
            {imgStatus === 'error' && (
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-60`} />
            )}
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()}`}>
            <div className="absolute inset-0 bg-noise opacity-[0.07] mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 mix-blend-screen animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 mix-blend-screen" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] opacity-40" />
          </div>
        )}
      </div>

      {/* Top Left: Main Actions (Copy as Priority) */}
      <div
        className={`absolute top-6 left-6 flex items-center gap-2 z-20 transition-all duration-300 ${isModal
            ? 'opacity-100'
            : 'opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0'
          }`}
      >
        <button
          onClick={handleCopy}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2 ${copied
              ? 'bg-green-500/20 border-green-500/50 text-green-400'
              : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
            }`}
          title="Copy Prompt Content"
        >
          {copied ? (
            <Icons.Check size={18} />
          ) : (
            <Icons.Copy size={18} />
          )}
          {isModal && <span className="text-xs font-semibold pr-1">{copied ? 'Copied' : 'Copy Prompt'}</span>}
        </button>

        {onDownload && data.previewMediaUrl && imgStatus !== 'error' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md shadow-lg transition-all active:scale-95"
            title="Download Image"
          >
            <Icons.Download size={18} />
          </button>
        )}
      </div>

      {/* Top Right: System Controls */}
      <div
        className={`absolute top-6 right-6 flex items-center gap-2 z-20 transition-all duration-300 ${isModal
            ? 'opacity-100'
            : 'opacity-0 group-hover/card:opacity-100'
          }`}
      >
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-white/70 backdrop-blur-md shadow-lg transition-all active:scale-95"
            title="Close View"
          >
            <Icons.Close size={18} />
          </button>
        )}
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10 pointer-events-none">
        <div className="flex items-start justify-end pointer-events-auto">
          {/* Category moved to right to make room for copy on left */}
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md shadow-lg flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor] animate-pulse ${getGradient().split(' ').pop()}`} />
            {data.category}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pointer-events-auto">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter drop-shadow-2xl mb-4 leading-tight">
            {data.title || 'Untitled Prompt'}
          </h1>
          <p className="text-sm md:text-base text-gray-300/80 max-w-2xl line-clamp-2 leading-relaxed font-light backdrop-blur-sm px-4 py-1.5 rounded-full bg-black/20 border border-white/5">
            {data.description}
          </p>
        </div>

        <div className="pointer-events-auto">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md shadow-lg group/preview hover:bg-black/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 text-[10px] text-brand-300 font-mono uppercase tracking-wider font-bold opacity-80">
              <Icons.Code size={12} />
              <span>Prompt Preview</span>
            </div>
            <p className="text-xs md:text-sm text-gray-200 font-mono line-clamp-3 leading-relaxed opacity-90 break-words whitespace-pre-wrap">
              {displayText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[96vw] lg:max-w-6xl 2xl:max-w-[1500px]"
        >
          {renderCard}
          <div className="text-center mt-6 text-gray-500 text-xs font-mono tracking-widest uppercase opacity-70">
            Press ESC to close • Rendered by PromptRay
          </div>
        </div>
      </div>
    );
  }

  return renderCard;
};


