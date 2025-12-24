import React, { useState } from 'react';
import { Prompt, PromptFormData, Category } from '../../types';
import { Icons } from '../Icons';
import Tags from '../ui/Tags';
import PromptMetaPanel from './PromptMetaPanel';

interface PromptEditTabProps {
  formData: PromptFormData;
  initialData?: Prompt | null;
  allCategories: string[];
  tagInput: string;
  tagSuggestions: string[];
  isAutoMeta: boolean;
  isOptimizingSystem: boolean;
  isTranslating: boolean;
  isOptimizingPrompt: boolean;
  isTagging: boolean;
  onFormDataChange: (data: PromptFormData) => void;
  onAutoMetadata: () => void;
  onOptimizeSystem: () => void;
  onTranslateToEnglish: () => void;
  onOptimizePrompt: () => void;
  onAutoTag: () => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
  onAddTagFromSuggestion: (tag: string) => void;
  getTokenCount: (text: string) => number;
  onDuplicate?: () => void;
  onCancel: () => void;
  onSaveClick: () => void;
}

export const PromptEditTab: React.FC<PromptEditTabProps> = ({
  formData,
  initialData,
  allCategories,
  tagInput,
  tagSuggestions,
  isAutoMeta,
  isOptimizingSystem,
  isTranslating,
  isOptimizingPrompt,
  isTagging,
  onFormDataChange,
  onAutoMetadata,
  onOptimizeSystem,
  onTranslateToEnglish,
  onOptimizePrompt,
  onAutoTag,
  onTagInputChange,
  onTagKeyDown,
  onAddTagFromSuggestion,
  getTokenCount,
  onDuplicate,
  onCancel,
  onSaveClick,
}) => {
  // 默认隐藏次要区块，减少初始认知负担；用户可展开
  const [showSystem, setShowSystem] = useState(false);

  // Compact select for tighter alignment in the right column
  const compactSelectClass = "w-full bg-gray-950/80 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer backdrop-blur-sm";
  // Derived metadata for display
  const tokenCount = getTokenCount(formData.content || '');
  const complexityLabel = tokenCount > 800 ? '高 (复杂)' : tokenCount > 300 ? '中 (适中)' : '低 (简单)';
  const displayModel = (formData.config && (formData.config as any).model) || (formData.recommendedModels && (formData.recommendedModels[0] || '未指定'));
  const primaryValue = formData.category || (formData.tags && formData.tags[0]) || '未分类';

  return (
    <div>
      <div className="w-full animate-slide-up-fade">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Main editor (Prompt content, bilingual) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Core Information (moved into first column) */}
            <div className="bg-gray-900/60 border border-white/10 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Icons.Edit size={16} className="text-brand-400" /> 基础信息
                </h3>
                <button
                  onClick={onAutoMetadata}
                  disabled={isAutoMeta}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white/10 text-gray-200 px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-all"
                  title="根据提示词内容自动生成元信息"
                >
                  {isAutoMeta ? <span className="animate-pulse">生成中...</span> : <React.Fragment><Icons.Magic size={12} /> 自动生成</React.Fragment>}
                </button>
              </div>
              {/* Tags moved to top of 基础信息 per design */}
              <div>
                <Tags
                  tags={formData.tags || []}
                  tagInput={tagInput}
                  suggestions={tagSuggestions}
                  onAddTag={(tag) => {
                    if (!tag) return;
                    onFormDataChange({ ...formData, tags: Array.from(new Set([...(formData.tags || []), tag])) });
                  }}
                  onRemoveTag={(tag) => {
                    onFormDataChange({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
                  }}
                  onInputChange={onTagInputChange}
                  onInputKeyDown={onTagKeyDown}
                  onSuggestionClick={onAddTagFromSuggestion}
                  compact={true}
                  onAutoTag={onAutoTag}
                  isTagging={isTagging}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: 标题 + 描述 */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">标题</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => onFormDataChange({ ...formData, title: e.target.value })}
                      className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                      placeholder="输入提示词标题..."
                      autoFocus={!initialData}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">描述</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => onFormDataChange({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                      placeholder="简要描述这个提示词的用途..."
                    />
                  </div>
                </div>

                {/* Right: 类别 + 状态 + 标签 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">类别</label>
                  <select
                        value={formData.category}
                        onChange={e => onFormDataChange({ ...formData, category: e.target.value as Category })}
                        className={compactSelectClass}
                      >
                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">状态</label>
                      <select
                        value={formData.status || 'active'}
                        onChange={e => onFormDataChange({ ...formData, status: e.target.value as any })}
                        className={compactSelectClass}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">输出类型</label>
                      <select value={formData.outputType || ''} onChange={e => onFormDataChange({ ...formData, outputType: (e.target.value as any) || undefined })} className={compactSelectClass}>
                        <option value="">未指定</option>
                        <option value="image">图片</option>
                        <option value="video">视频</option>
                        <option value="audio">音频</option>
                        <option value="text">文本</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">应用场景</label>
                      <select value={formData.applicationScene || ''} onChange={e => onFormDataChange({ ...formData, applicationScene: (e.target.value as any) || undefined })} className={compactSelectClass}>
                        <option value="">未指定</option>
                        <option value="角色设计">角色设计</option>
                        <option value="场景生成">场景生成</option>
                        <option value="风格转换">风格转换</option>
                        <option value="故事创作">故事创作</option>
                        <option value="工具使用">工具使用</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">适用模型</label>
                      <input type="text" value={(formData.recommendedModels || []).join(', ')} onChange={e => onFormDataChange({ ...formData, recommendedModels: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Midjourney, DALL-E..." />
                    </div>
                  </div>

                  
                </div>
              </div>
            </div>
            {/* Prompt content group (system + chinese/english prompts) */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Icons.Code size={16} className="text-blue-400" />
                提示词内容
              </h3>

              {/* System Role - full-width above bilingual prompts */}
              <div className={`bg-blue-950/10 rounded-lg p-6 border border-blue-500/10 transition-all ${showSystem ? '' : 'max-h-[56px] overflow-hidden'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Icons.System size={14} /> 系统角色
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSystem(s => !s)}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
                      title={showSystem ? 'Collapse' : 'Expand'}
                    >
                      {showSystem ? '收起' : '展开'}
                    </button>
                    <button
                      onClick={onOptimizeSystem}
                      disabled={isOptimizingSystem || !formData.systemInstruction}
                      className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-all"
                    >
                      {isOptimizingSystem ? (
                        <span className="animate-pulse">优化中...</span>
                      ) : (
                        <>
                          <Icons.Sparkles size={12} /> 优化
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ display: showSystem ? undefined : 'none' }}>
                  <textarea
                    value={formData.systemInstruction}
                    onChange={e => onFormDataChange({ ...formData, systemInstruction: e.target.value })}
                    className="w-full h-28 md:h-36 bg-gray-950/70 border border-white/10 rounded-lg px-3 md:px-4 py-3 text-sm font-mono text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y"
                    placeholder="定义AI的角色..."
                  />
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                {/* Chinese Prompt */}
                <div className="bg-gray-900/70 border border-white/10 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-xs font-semibold text-brand-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                      中文提示词
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onTranslateToEnglish}
                        disabled={isTranslating || !formData.content}
                        className="flex items-center gap-1.5 text-xs font-medium bg-green-500/15 text-green-300 px-2 py-1 rounded-lg border border-green-500/30 hover:bg-green-500/25 disabled:opacity-50 transition-all"
                        title="将中文提示词翻译为英文"
                      >
                        {isTranslating ? <span className="animate-pulse">翻译中...</span> : <><Icons.Edit size={12} /> 翻译</>}
                      </button>
                      <button
                        onClick={onOptimizePrompt}
                        disabled={isOptimizingPrompt || !formData.content}
                        className="flex items-center gap-1.5 text-xs font-medium bg-brand-500/15 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/25 disabled:opacity-50 transition-all"
                        title="优化提示词内容"
                      >
                        {isOptimizingPrompt ? <span className="animate-pulse">优化中...</span> : <><Icons.Sparkles size={12} /> 优化</>}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={e => onFormDataChange({ ...formData, content: e.target.value })}
                    className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-3 text-sm md:text-sm font-mono text-gray-100 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition-all resize-y leading-relaxed"
                    placeholder="在这里输入你的中文提示词...&#10;使用 {变量名} 创建动态输入"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 flex-wrap gap-2">
                    <span className="text-gray-600">
                      提示：使用{' '}
                      <span className="text-brand-400 font-mono bg-brand-500/15 px-1.5 py-0.5 rounded border border-brand-500/30">
                        {'{变量名}'}
                      </span>{' '}
                      创建动态输入
                    </span>
                    <span className="font-mono">~{getTokenCount(formData.content)} tokens</span>
                  </div>
                </div>

                {/* English Prompt */}
                <div className="bg-gray-900/70 border border-white/10 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-xs font-semibold text-green-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      英文提示词
                      {formData.englishPrompt && <span className="text-[10px] text-green-400/70 font-normal normal-case ml-1">(自动翻译)</span>}
                    </label>
                    {formData.englishPrompt ? (
                      <button
                        onClick={() => navigator.clipboard.writeText(formData.englishPrompt || '')}
                        className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1"
                        title="复制英文提示词"
                      >
                        <Icons.Copy size={14} />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500">点击"翻译"生成</span>
                    )}
                  </div>
                  {formData.englishPrompt ? (
                    <div className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-3 text-sm md:text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                      {formData.englishPrompt}
                    </div>
                  ) : (
                    <div className="w-full h-56 md:h-64 xl:h-72 bg-gray-950/60 border border-white/8 rounded-lg px-3 md:px-4 py-2 md:py-3 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 mx-auto bg-gray-900/50 rounded-full flex items-center justify-center border border-white/10">
                          <Icons.Edit size={18} className="md:w-5 md:h-5 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-600">点击"翻译"按钮生成英文提示词</p>
                      </div>
                    </div>
                  )}
                  {formData.englishPrompt && (
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-gray-600">自动翻译自中文提示词</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Examples and other full-width sections can follow here if needed */}
          </div>

          {/* Right: Structured Metadata sidebar (refactored) */}
          <PromptMetaPanel
            formData={formData}
            onFormDataChange={onFormDataChange}
            getTokenCount={getTokenCount}
            onAutoMetadata={onAutoMetadata}
            onAutoTag={onAutoTag}
            isAutoMeta={isAutoMeta}
            isTagging={isTagging}
            tagSuggestions={tagSuggestions}
          />
        </div>
      </div>

      {/* Footer for Edit tab */}
      <div className="p-6 border-t border-white/10 flex justify-between gap-4 shrink-0 bg-gray-900/60 backdrop-blur-md">
        <div>
          {initialData && onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-2 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
              title="Duplicate Prompt"
            >
              <Icons.CopyPlus size={16} /> <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/15 transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onSaveClick}
            className="btn-primary px-8 py-2.5 text-sm font-bold relative overflow-hidden group"
          >
            <span className="relative z-10">Save Changes</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </div>
  );
};


