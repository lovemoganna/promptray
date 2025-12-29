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
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddTag(tagInput || 'new-tag')}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            title="添加标签"
          >
            添加
          </button>
          {onAutoTag && (
            <button
              onClick={() => onAutoTag()}
              disabled={isTagging}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
              title="自动标记"
            >
              {isTagging ? '标记中...' : '自动标记'}
            </button>
          )}
        </div>
      </div>

      {/* 标签输入区域 - 统一协调的视觉设计 */}
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-3 bg-gray-900/40 border border-white/10 rounded-lg min-h-[48px] focus-within:border-blue-400/50 focus-within:bg-gray-900/60 transition-all duration-200">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/20 text-blue-200 px-2.5 py-1 rounded-full border border-blue-400/30">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="hover:text-red-400 hover:bg-red-500/20 rounded-full p-0.5 transition-all duration-150"
                title={`删除标签 "${tag}"`}
              >
                <Icons.Close size={9} />
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
        <div className="mt-2 w-full bg-gray-900/95 border border-white/15 rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
          <div className="px-1 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-gray-950/50">建议</div>
          {suggestions.map(s => (
            <button key={s} onClick={() => onSuggestionClick(s)} className="w-full text-left px-1 py-1 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tags;


