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
    <div className={`bg-gray-900/50 border border-white/10 rounded-lg p-4 ${compact ? 'p-3' : 'p-6'} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Icons.Tag size={16} className="text-yellow-400" /> 标签
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

      <div className="flex flex-wrap gap-2 p-3 bg-gray-950/70 border border-white/10 rounded-lg min-h-[56px]">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1.5 text-sm font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-full border border-white/10">
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="hover:text-red-400 transition-colors">
              <Icons.Close size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={onInputKeyDown}
          className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[100px] py-1 placeholder:text-gray-600"
          placeholder={tags.length === 0 ? '输入标签并按 Enter...' : ''}
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 w-full bg-gray-900/95 border border-white/15 rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 bg-gray-950/50">建议</div>
          {suggestions.map(s => (
            <button key={s} onClick={() => onSuggestionClick(s)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
              <Icons.Tag size={14} className="opacity-50" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tags;


