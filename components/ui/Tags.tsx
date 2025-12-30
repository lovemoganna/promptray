import React from 'react';
import { Icons } from '../Icons';

interface TagsProps {
  tags: string[];
  tagInput: string;
  suggestions: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onInputChange: (v: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
  onSuggestionClick: (tag: string) => void;
  compact?: boolean;
  onAutoTag?: () => void;
  isTagging?: boolean;
}

export const Tags: React.FC<TagsProps> = ({
  tags,
  tagInput,
  suggestions,
  onAddTag,
  onRemoveTag,
  onInputChange,
  onInputKeyDown,
  onSuggestionClick,
  compact = false,
  onAutoTag,
  isTagging = false,
}) => {
  return (
    <div className={`p-0 bg-transparent transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-400 uppercase tracking-wider`}>
          标签
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddTag(tagInput || 'new-tag')}
            className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
            title="添加标签"
          >
            <Icons.Plus size={12} className="inline mr-1" />
            添加
          </button>
          {onAutoTag && (
            <button
              onClick={() => onAutoTag()}
              disabled={isTagging}
              className={`text-xs font-medium px-2 py-1 rounded-md transition-all duration-200 ${
                isTagging
                  ? 'text-blue-400 bg-blue-500/20 cursor-not-allowed'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              title="自动标记"
            >
              {isTagging ? (
                <>
                  <div className="inline-block w-3 h-3 border border-blue-400/50 border-t-blue-400 rounded-full animate-spin mr-1"></div>
                  标记中...
                </>
              ) : (
                <>
                  <Icons.Sparkles size={12} className="inline mr-1" />
                  自动标记
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 标签输入区域 - 统一协调的视觉设计 */}
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg min-h-[44px] focus-within:border-[var(--color-border-focus)] focus-within:bg-[var(--color-bg-secondary)] transition-all duration-200">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs font-medium bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-200 px-2 py-1 rounded-full border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="hover:text-red-400 hover:bg-red-500/20 rounded-full p-0.5 transition-all duration-150 transform hover:scale-110"
                title={`删除标签 "${tag}"`}
              >
                <Icons.Close size={8} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[120px] py-1 placeholder:text-gray-500 focus:placeholder:text-gray-400"
            placeholder=""
          />
        </div>

        {/* 简洁的装饰线 */}
        <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg overflow-hidden backdrop-blur-md">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)]">建议标签</div>
          <div className="max-h-32 overflow-y-auto">
            {suggestions.map(s => (
              <button key={s} onClick={() => onSuggestionClick(s)} className="w-full text-left px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-all duration-150 border-b border-[var(--color-border-secondary)] last:border-b-0">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;


