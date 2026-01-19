import React, { useMemo } from 'react';
import { Prompt } from '../types';
import { Icons, getIconForCategory, getColorForCategory } from './Icons';

type ActionHandler = (id: string, e: React.MouseEvent) => void;

type CardTheme = 'light' | 'dark' | 'accent';

interface PromptCardProps {
  prompt: Prompt;
  index: number;
  isTrash: boolean;
  onOpen: (prompt: Prompt) => void;
  onToggleFavorite: ActionHandler;
  onDuplicate: ActionHandler;
  onDelete: ActionHandler;
  onRestore?: ActionHandler;
  onCopy: (text: string, e: React.MouseEvent) => void;
  themeVariant?: CardTheme;
  isSelected?: boolean;
  isLoading?: boolean;
}

const PromptContentPreview: React.FC<{ content: string; variant: CardTheme }> = ({ content, variant }) => {
  const parts = useMemo(() => content.split(/(\{.*?\})/g), [content]);
  const textTone = variant === 'light' ? 'text-slate-700' : 'text-slate-100';
  const braceTone =
    variant === 'light'
      ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
      : 'text-brand-200 bg-brand-500/10 border-brand-500/25';

  return (
    <code
      className={`block text-xs ${textTone} font-mono break-words leading-relaxed`}
      style={{ wordBreak: 'break-word' }}
    >
      {parts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          return (
            <span key={i} className={`font-semibold rounded-md px-1.5 py-0.5 border ${braceTone} mr-1`}>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </code>
  );
};

// Build a formatted bilingual copy block when knowledge fields are present
const buildCopyText = (prompt: Prompt): string => {
  const hasBilingual = prompt.englishPrompt || prompt.chinesePrompt;
  const lines: string[] = [];

  lines.push(`标题: ${prompt.title}`);

  // Add description if available
  if (prompt.description) {
    lines.push(`描述: ${prompt.description}`);
  }

  // Add system instruction if available
  if (prompt.systemInstruction) {
    lines.push('');
    lines.push('系统提示词:');
    lines.push(prompt.systemInstruction);
  }

  if (hasBilingual) {
    if (prompt.englishPrompt) {
      lines.push('');
      lines.push('English Prompt:');
      lines.push(prompt.englishPrompt);
    }
    if (prompt.chinesePrompt) {
      lines.push('');
      lines.push('中文提示词:');
      lines.push(prompt.chinesePrompt);
    }
  } else {
    // Fallback to main content for legacy prompts
    lines.push('');
    lines.push('Prompt:');
    lines.push(prompt.content);
  }

  // Attach key metadata if available
  const meta: string[] = [];
  if (prompt.outputType) meta.push(`输出类型: ${prompt.outputType}`);
  if (prompt.applicationScene) meta.push(`应用场景: ${prompt.applicationScene}`);
  if (prompt.recommendedModels && prompt.recommendedModels.length > 0) {
    meta.push(`适用模型: ${prompt.recommendedModels.join(', ')}`);
  }
  if (meta.length > 0) {
    lines.push('');
    lines.push(meta.join(' | '));
  }
  // Attach platform/model info for reproducibility
  if (prompt.config?.modelProvider || prompt.config?.modelName) {
    lines.push('');
    lines.push(`Platform/Model: ${prompt.config?.modelProvider || ''}${prompt.config?.modelName ? ` / ${prompt.config?.modelName}` : ''}`);
  }

  if (prompt.usageNotes) {
    lines.push('');
    lines.push('使用说明:');
    lines.push(prompt.usageNotes);
  }
  if (prompt.cautions) {
    lines.push('');
    lines.push('注意事项:');
    lines.push(prompt.cautions);
  }

  return lines.join('\n');
};

// English-only compact copy (for quick use in英文模型)
const buildEnglishCopyText = (prompt: Prompt): string => {
  const parts: string[] = [];
  parts.push(`Title: ${prompt.title}`);
  const en = prompt.englishPrompt || '';
  parts.push('');
  parts.push(en);
  return parts.join('\n');
};

const PromptCardComponent: React.FC<PromptCardProps> = ({
  prompt,
  index,
  isTrash,
  onOpen,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onRestore,
  onCopy,
  themeVariant = 'dark',
  isSelected = false,
  isLoading = false
}) => {
  const CategoryIcon = getIconForCategory(prompt.category);
  const categoryColor = getColorForCategory(prompt.category);

  const hasVariables = useMemo(
    () => {
      const result = /\{[^{}]+\}/.test(prompt.content) || (prompt.systemInstruction && /\{[^{}]+\}/.test(prompt.systemInstruction));
      return result;
    },
    [prompt.content, prompt.systemInstruction]
  );

  const usageCount = prompt.savedRuns?.length ?? 0;
  const examplesCount = prompt.examples?.length || 0;
  const tokens = Math.round(prompt.content.length / 4);
  const updatedDate = new Date(prompt.updatedAt || prompt.createdAt).toLocaleDateString();
  const previewSource = prompt.englishPrompt || prompt.content;
  const previewSnippet = previewSource.slice(0, 220);

  const tone = {
    light: {
      card: 'bg-white text-slate-900 border border-slate-200 shadow-sm',
      hover: 'hover:border-slate-300 hover:bg-slate-50/80',
      panel: 'border-slate-200 bg-slate-50',
      subtle: 'text-slate-600',
      chip: 'bg-slate-100 text-slate-700 border-slate-200',
      divider: 'border-slate-200/80',
      preview: 'border-slate-200',
      selected: 'ring-1 ring-brand-500/60 ring-offset-1 ring-offset-slate-50'
    },
    dark: {
      card: 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] shadow-sm',
      hover: 'hover:border-[var(--color-brand-primary)]/40',
      panel: 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]',
      subtle: 'text-[var(--color-text-secondary)]',
      chip: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)]',
      divider: 'border-[var(--color-border-primary)]',
      preview: 'border-[var(--color-border-primary)]',
      selected: 'ring-1 ring-[var(--color-brand-primary)]/60 ring-offset-1 ring-offset-[var(--color-bg-primary)]'
    },
    accent: {
      card: 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] shadow-sm',
      hover: 'hover:border-[var(--color-brand-primary)]/60',
      panel: 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]',
      subtle: 'text-[var(--color-text-secondary)]',
      chip: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)]',
      divider: 'border-[var(--color-border-primary)]',
      preview: 'border-[var(--color-border-primary)]',
      selected: 'ring-1 ring-[var(--color-brand-primary)]/60 ring-offset-1 ring-offset-[var(--color-bg-primary)]'
    }
  }[themeVariant];

  const selectedShadow = isTrash
    ? 'ring-1 ring-red-400/50 ring-offset-1 ring-offset-[var(--color-bg-primary)]'
    : tone.selected;

  const handleAction =
    (fn: ActionHandler) =>
      (e: React.MouseEvent) => {
        e.stopPropagation();
        fn(prompt.id, e);
      };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      data-prompt-card
      data-theme={themeVariant}
      data-selected={isSelected}
      onClick={() => !isLoading && onOpen(prompt)}
      className={`group relative flex w-full max-w-none flex-col h-full rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${tone.card
        } ${tone.hover} ${isSelected ? selectedShadow : ''} ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="relative z-10 flex h-full flex-col gap-3 p-4">
        {/* Header Section - 统一间距 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Status Badges Row */}
            <div className="flex flex-nowrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs uppercase tracking-wide ${tone.chip}`}>
                <CategoryIcon size={13} className={categoryColor} /> {prompt.category}
              </span>
              {hasVariables && (
                <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                  <Icons.Code size={11} className="text-slate-500" />
                  含变量
                </span>
              )}
              {prompt.status === 'draft' && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-400 bg-white/5 whitespace-nowrap">
                  Draft
                </span>
              )}
              {prompt.status === 'archived' && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-400 bg-white/5 whitespace-nowrap">
                  Archived
                </span>
              )}
            </div>

            {/* Title and Description */}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold leading-tight line-clamp-1">{prompt.title}</h3>
              <p className={`text-xs leading-relaxed line-clamp-1 ${tone.subtle}`}>
                {prompt.description}
              </p>
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 h-[20px] overflow-hidden">
              {prompt.applicationScene && (
                <span className="inline-flex items-center gap-1">
                  <Icons.Analysis size={11} className="text-slate-500" />
                  {prompt.applicationScene}
                </span>
              )}
              {prompt.outputType && (
                <span className="inline-flex items-center gap-1">
                  <Icons.Image size={11} className="text-slate-500" />
                  {prompt.outputType.toUpperCase()}
                </span>
              )}
              {examplesCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Icons.List size={11} className="text-slate-500" />
                  {examplesCount} 示例
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center gap-0 rounded-full border px-0.5 py-0.5 ${themeVariant === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`} onClick={stop}>
            {isTrash && onRestore ? (
              <button
                onClick={handleAction(onRestore)}
                className="p-1 rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                title="Restore"
              >
                <Icons.Restore size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={handleAction(onToggleFavorite)}
                  className="p-1 rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Favorite"
                >
                  <Icons.Star size={14} className={prompt.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                </button>
                <button
                  onClick={handleAction(onDuplicate)}
                  className="p-1 rounded-full text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                  title="Duplicate"
                >
                  <Icons.CopyPlus size={14} />
                </button>
              </>
            )}
            <button
              onClick={handleAction(onDelete)}
              className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition-colors"
              title={isTrash ? 'Delete Permanently' : 'Delete'}
            >
              <Icons.Delete size={14} />
            </button>
            {!isTrash && prompt.englishPrompt && (
              <button
                onClick={(e) => onCopy(buildEnglishCopyText(prompt), e)}
                className="p-1 rounded-full text-slate-300 hover:bg-white/10 transition-colors"
                title="Copy English Prompt"
              >
                <Icons.Copy size={14} />
              </button>
            )}
            {!isTrash && (
              <button
                onClick={(e) => onCopy(buildCopyText(prompt), e)}
                className="p-1 rounded-full text-slate-300 hover:bg-white/10 transition-colors"
                title="Copy Bilingual Prompt"
              >
                <Icons.ClipboardCheck size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className={`rounded-lg border ${tone.preview} bg-[var(--color-bg-secondary)]`}>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <Icons.Sparkles size={12} />
              <span>Preview</span>
            </div>
          </div>
          <div className="px-3 pb-3 h-[80px] overflow-hidden">
            <PromptContentPreview content={previewSnippet} variant={themeVariant} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-nowrap items-center gap-3 text-[11px] text-slate-400/90">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Icons.Activity size={11} className="text-slate-500" /> ~{tokens} tks
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Icons.Eye size={11} className="text-slate-500" /> {usageCount} uses
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Icons.History size={11} className="text-slate-500" /> {updatedDate}
          </span>
        </div>

        {/* Tags Section */}
        <div className="flex flex-wrap gap-1">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${tone.chip} truncate max-w-[140px]`}
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length === 0 && <span className={`text-xs ${tone.subtle}`}>No tags</span>}
          {prompt.tags.length > 3 && (
            <span className={`text-xs ${tone.subtle} inline-flex items-center gap-1.5`}>
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export const PromptCard = React.memo(PromptCardComponent);
