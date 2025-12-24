import React, { useState } from 'react';
import { PromptFormData } from '../../types';
import { Icons } from '../Icons';
import Tags from '../ui/Tags';

interface PromptMetaPanelProps {
  formData: PromptFormData;
  onFormDataChange: (data: PromptFormData) => void;
  getTokenCount: (text: string) => number;
  onAutoMetadata: () => void;
  onAutoTag?: () => void;
  isAutoMeta?: boolean;
  isTagging?: boolean;
  tagSuggestions?: string[];
}

const compactSelectClass = "w-full bg-gray-950/80 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer backdrop-blur-sm";

export const PromptMetaPanel: React.FC<PromptMetaPanelProps> = ({
  formData,
  onFormDataChange,
  getTokenCount,
  onAutoMetadata,
  onAutoTag,
  isAutoMeta = false,
  isTagging = false,
  tagSuggestions = [],
}) => {
  const tokenCount = getTokenCount(formData.content || '');
  const complexityLabel = tokenCount > 800 ? '高 (复杂)' : tokenCount > 300 ? '中 (适中)' : '低 (简单)';
  const displayModel = (formData.config && (formData.config as any).model) || (formData.recommendedModels && (formData.recommendedModels[0] || '未指定'));
  const primaryValue = formData.category || (formData.tags && formData.tags[0]) || '未分类';

  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">元数据</h3>
        <div className="grid grid-cols-1 gap-3">
          {/* Quick overview: model / tokens / complexity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">快速概览</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-200">
                <span className="text-xs text-gray-400">推荐模型</span>
                <span className="font-medium">{displayModel}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-200">
                <span className="text-xs text-gray-400">估算 Tokens</span>
                <span className="font-medium">{tokenCount} tokens</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-200">
                <span className="text-xs text-gray-400">复杂度</span>
                <span className="font-medium">{complexityLabel}</span>
              </div>
              <p className="text-[11px] text-gray-500">此概览基于提示词正文的字数/结构自动推断，帮助快速判断执行成本与难度。</p>
            </div>
          </div>

          {/* Value & Use Cases */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">价值维度 / 场景</label>
            <input type="text" value={primaryValue} readOnly className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200" />
            <p className="text-[11px] text-gray-500 mt-1">从类别与标签推断出的主要用途或价值方向，便于搜索与聚类。</p>
          </div>

          {/* Usage & Cautions with helper text */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">使用说明
              <span title="简短说明如何使用此提示词：必要输入格式、常见参数与示例（1-3 句）" className="ml-2 text-[11px] text-gray-400 cursor-help">?</span>
            </label>
            <textarea value={formData.usageNotes || ''} onChange={e => onFormDataChange({ ...formData, usageNotes: e.target.value })} className="w-full h-20 bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200" placeholder="这个提示词怎么用、有什么技巧？" />
            <p className="text-[11px] text-gray-500 mt-1">简要写出最佳实践：输入格式、常用参数、场景示例。</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">注意事项 / 风险
              <span title="列出可能导致错误或不安全输出的情形，以及建议的缓解方法（1-2 句）" className="ml-2 text-[11px] text-gray-400 cursor-help">?</span>
            </label>
            <textarea value={formData.cautions || ''} onChange={e => onFormDataChange({ ...formData, cautions: e.target.value })} className="w-full h-20 bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200" placeholder="常见错误、边界条件、避坑提示" />
            <p className="text-[11px] text-gray-500 mt-1">列出可能造成错误或不安全输出的条件，以及如何缓解。</p>
          </div>

          {/* Prompt-perspective: intent / audience / constraints (extracted) */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">提示词视角
              <span title="从提示词内容中提取的意图、目标受众与约束（可由自动生成器填充，也可手动编辑）" className="ml-2 text-[11px] text-gray-400 cursor-help">?</span>
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-gray-400">意图（Intent）</label>
                <textarea
                  value={(formData.extracted && formData.extracted.intent) || ''}
                  onChange={e => onFormDataChange({ ...formData, extracted: { ...(formData.extracted || {}), intent: e.target.value } })}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
                  placeholder="简短描述此提示词的主要目的，例如：生成教学示例、写作风格改写等"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400">目标受众（Audience）</label>
                <input
                  type="text"
                  value={(formData.extracted && formData.extracted.audience) || ''}
                  onChange={e => onFormDataChange({ ...formData, extracted: { ...(formData.extracted || {}), audience: e.target.value } })}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="例如：初学者、行业专家、产品经理"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400">约束 / 限制（Constraints）</label>
                <div className="mt-2">
                  <Tags
                    tags={formData.extracted && formData.extracted.constraints ? formData.extracted.constraints : []}
                    tagInput={''}
                    suggestions={tagSuggestions || []}
                    onAddTag={(tag) => {
                      if (!tag) return;
                      const prev = formData.extracted && formData.extracted.constraints ? formData.extracted.constraints : [];
                      const next = Array.from(new Set([...prev, tag]));
                      onFormDataChange({ ...formData, extracted: { ...(formData.extracted || {}), constraints: next } });
                    }}
                    onRemoveTag={(tag) => {
                      const prev = formData.extracted && formData.extracted.constraints ? formData.extracted.constraints : [];
                      onFormDataChange({ ...formData, extracted: { ...(formData.extracted || {}), constraints: prev.filter(t => t !== tag) } });
                    }}
                    onInputChange={() => {}}
                    onInputKeyDown={(e) => {
                      // Allow Enter to add tag when user types into the internal input; Tags component handles inputKeyDown externally via props.
                      // No-op here because Tags manages input value via parent; we use onAddTag above to add programmatically.
                    }}
                    onSuggestionClick={(s) => {
                      if (!s) return;
                      const prev = formData.extracted && formData.extracted.constraints ? formData.extracted.constraints : [];
                      const next = Array.from(new Set([...prev, s]));
                      onFormDataChange({ ...formData, extracted: { ...(formData.extracted || {}), constraints: next } });
                    }}
                    compact={true}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">使用标签式输入以便快速添加/删除约束，建议短句或关键词。</p>
              </div>
            </div>
          </div>

          {/* Preview media + source */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">预览媒体 URL
              <span title="填写外链图片/视频/音频以在此处预览，仅用于演示与分享，请保证链接可访问。" className="ml-2 text-[11px] text-gray-400 cursor-help">?</span>
            </label>
            <input type="text" value={formData.previewMediaUrl || ''} onChange={e => onFormDataChange({ ...formData, previewMediaUrl: e.target.value })} className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="示例图片/视频/音频链接" />
            {formData.previewMediaUrl && (
              <div className="mt-3">
                {/* Simple heuristic preview */}
                {(() => {
                  const url = formData.previewMediaUrl || '';
                  const lower = url.toLowerCase();
                  if (lower.match(/\.(mp4|webm|ogg)(\?|$)/)) {
                    return (
                      <video src={url} controls className="w-full rounded-lg border border-white/10 bg-black" />
                    );
                  }
                  if (lower.match(/\.(mp3|wav|m4a|aac)(\?|$)/)) {
                    return (
                      <audio src={url} controls className="w-full rounded-lg" />
                    );
                  }
                  // default: try image
                  return <img src={url} alt="preview" className="w-full rounded-lg object-contain border border-white/10" />;
                })()}
                <div className="flex gap-2 mt-2">
                  <a href={formData.previewMediaUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-white">在新标签中打开</a>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={formData.source || ''} onChange={e => onFormDataChange({ ...formData, source: e.target.value })} placeholder="来源 (如: Tutorial、Blog)" className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="text" value={formData.sourceAuthor || ''} onChange={e => onFormDataChange({ ...formData, sourceAuthor: e.target.value })} placeholder="作者" className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <input type="text" value={formData.sourceUrl || ''} onChange={e => onFormDataChange({ ...formData, sourceUrl: e.target.value })} placeholder="来源链接" className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-1">
            <button onClick={onAutoMetadata} disabled={isAutoMeta} className="text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all">
              {isAutoMeta ? '生成中...' : <><Icons.Magic size={12} /> 自动生成元信息</>}
            </button>
            {onAutoTag && (
              <button onClick={onAutoTag} disabled={isTagging} className="text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all">
                {isTagging ? '标记中...' : '自动标记'}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PromptMetaPanel;


