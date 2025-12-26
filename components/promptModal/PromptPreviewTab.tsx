import React, { useState } from 'react';
import { PromptFormData } from '../../types';
import { Icons } from '../Icons';

type TabKey = 'preview' | 'edit' | 'examples' | 'test' | 'history';

interface PromptPreviewTabProps {
  formData: PromptFormData;
  previewMode: 'raw' | 'interpolated';
  onPreviewModeChange: (mode: 'raw' | 'interpolated') => void;
  detectedVariables: string[];
  variableValues: Record<string, string>;
  isFilling: boolean;
  copiedPreview: boolean;
  onCopyRawPrompt: () => void;
  onCopyEnglishPrompt: () => void;
  onCopyChinesePrompt: () => void;
  onCopySystemInstruction: () => void;

  onMagicFill: () => void;
  onVariableChange: (name: string, value: string) => void;
  onSetActiveTab: (tab: TabKey) => void;
}

export const PromptPreviewTab: React.FC<PromptPreviewTabProps> = ({
  formData,
  previewMode,
  onPreviewModeChange,
  detectedVariables,
  variableValues,
  isFilling,
  copiedPreview,
  onCopyRawPrompt,
  onCopyEnglishPrompt,
  onCopyChinesePrompt,
  onCopySystemInstruction,

  onMagicFill,
  onVariableChange,
  onSetActiveTab,
}) => {
  // Interpolation function for variable replacement
  const getInterpolatedText = (text: string): string => {
    if (previewMode === 'raw' || !text) return text;
    let result = text;
    detectedVariables.forEach(v => {
      const value = variableValues[v] || `{${v}}`;
      result = result.split(`{${v}}`).join(value);
    });
    return result;
  };

  // Fallback to content if chinesePrompt/englishPrompt is empty
  const displayChinese = formData.chinesePrompt || formData.content || '';
  const displayEnglish = formData.englishPrompt || formData.content || '';

  const interpolatedEnglish = getInterpolatedText(displayEnglish);
  const interpolatedChinese = getInterpolatedText(displayChinese);

  // Calculate stats for display
  const englishStats = {
    chars: interpolatedEnglish.length,
    words: interpolatedEnglish.split(/\s+/).filter(w => w.length > 0).length,
  };
  const chineseStats = {
    chars: interpolatedChinese.length,
    words: interpolatedChinese.split(/[\s\u3000]+/).filter(w => w.length > 0).length,
  };

  const [isEnglishExpanded, setIsEnglishExpanded] = useState(false);
  const [isChineseExpanded, setIsChineseExpanded] = useState(false);

  // Helper to determine if text is long enough to collapse (simple approximation: > 1000 chars or > 20 lines)
  const isLongContent = (text: string) => {
    if (!text) return false;
    return text.length > 1000 || text.split('\n').length > 20;
  };

  const hasLongEnglish = isLongContent(interpolatedEnglish);
  const hasLongChinese = isLongContent(interpolatedChinese);

  return (
    <div className="space-y-6 w-full animate-slide-up-fade">
      {/* LINE 1: Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex-1 min-w-[200px]">
          {formData.title || 'Untitled prompt'}
        </h2>
        <div className="flex items-center gap-2">
          {formData.systemInstruction && (
            <button
              onClick={onCopySystemInstruction}
              className="group/copy-sys flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[11px] font-bold text-blue-200 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/5"
              title="Copy System Prompt"
            >
              <Icons.System size={13} className="group-hover/copy-sys:animate-pulse" />
              <span>Copy System</span>
            </button>
          )}
          <button
            onClick={onCopyRawPrompt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all transform hover:scale-105 active:scale-95 shadow-lg ${copiedPreview
              ? 'border-green-500/50 bg-green-500/10 text-green-300'
              : 'border-brand-500/30 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20 hover:border-brand-500/50 shadow-brand-500/5'
              } text-[11px] font-bold`}
            title="Copy User Prompt"
          >
            {copiedPreview ? <Icons.Check size={13} /> : <Icons.Copy size={13} />}
            <span>{copiedPreview ? 'Copied!' : 'Copy Prompt'}</span>
          </button>
        </div>
      </div>

      {/* LINE 2: Category & Tags */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[11px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 px-3 py-1 rounded-full border border-brand-500/40 shadow-lg shadow-brand-500/5">
          {formData.category}
        </span>
        {formData.outputType && (
          <span className="text-[11px] font-bold tracking-wider uppercase bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
            {formData.outputType}
          </span>
        )}
        <div className="w-[1px] h-3 bg-white/10 mx-1"></div>
        {formData.tags.map(tag => (
          <span
            key={tag}
            className="text-[11px] font-medium bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            #{tag}
          </span>
        ))}
        {detectedVariables.length > 0 && (
          <div className="ml-auto flex items-center gap-1 bg-gray-950/60 rounded-lg p-0.5 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => onPreviewModeChange('raw')}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-all ${previewMode === 'raw' ? 'bg-gray-800 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'
                }`}
            >Raw</button>
            <button
              onClick={() => onPreviewModeChange('interpolated')}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-all ${previewMode === 'interpolated' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
            >Simulated</button>
          </div>
        )}
      </div>

      {/* LINE 3: Description */}
      <div className="bg-gray-900/30 rounded-xl p-4 border border-white/5 backdrop-blur-sm flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Icons.Edit size={14} /> Description
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed overflow-y-auto max-h-[100px] custom-scrollbar">
          {formData.description || <span className="text-gray-600 italic">No description provided.</span>}
        </p>
      </div>

      {/* LINE 4: System Context - Aligned with edit tab style */}
      <div className={`bg-blue-950/10 rounded-lg p-6 border border-blue-500/10 transition-all`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Icons.System size={14} /> 系统角色
          </h3>
          {formData.systemInstruction && (
            <div className="flex items-center gap-2">
              <button
                onClick={onCopySystemInstruction}
                className="flex items-center gap-1.5 text-xs font-medium bg-blue-500/15 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/25 transition-all"
                title="复制系统角色"
              >
                <Icons.Copy size={12} /> 复制
              </button>
            </div>
          )}
        </div>
        <div className="w-full bg-gray-950/70 rounded-lg px-3 md:px-4 py-3 text-sm font-mono text-gray-200 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
          {formData.systemInstruction || <span className="text-gray-700 italic">No system instructions defined.</span>}
        </div>
      </div>

      {/* Variables Section (Dynamic) */}
      {previewMode === 'interpolated' && detectedVariables.length > 0 && (
        <div className="bg-purple-950/10 border border-purple-500/10 rounded-xl p-4 animate-fade-in backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Icons.Code size={14} /> Simulation Inputs
            </h3>
            <button
              onClick={onMagicFill}
              disabled={isFilling}
              className="flex items-center gap-1.5 text-[10px] font-bold bg-purple-500/15 text-purple-200 px-3 py-1 rounded-lg border border-purple-500/20 hover:bg-purple-500/25 transition-all shadow-lg shadow-purple-950/20"
            >
              {isFilling ? <span className="animate-pulse">Magic Filling...</span> : <><Icons.Magic size={11} /> Magic Fill</>}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {detectedVariables.map(v => (
              <div key={v} className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                <label className="text-[10px] text-purple-400/80 font-mono font-bold">{`{${v}}`}</label>
                <input
                  type="text"
                  value={variableValues[v] || ''}
                  onChange={e => onVariableChange(v, e.target.value)}
                  placeholder={`Enter value for ${v}...`}
                  className="bg-gray-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500/50 outline-none transition-all shadow-inner"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LINE 4: Bilingual Previews - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Preview */}
        <div className={`bg-gray-900/60 rounded-lg p-6 space-y-4 border border-white/10 transition-all`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-xs font-semibold text-green-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              英文提示词预览
              {interpolatedEnglish && (
                <span className="text-[10px] text-green-400/70 font-normal normal-case ml-1">
                  ({englishStats.chars} chars · {englishStats.words} words)
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={onCopyEnglishPrompt}
                className="flex items-center gap-1.5 text-xs font-medium bg-green-500/15 text-green-300 px-2 py-1 rounded-lg border border-green-500/30 hover:bg-green-500/25 transition-all"
                title="复制英文提示词"
              >
                <Icons.Copy size={12} /> 复制
              </button>
            </div>
          </div>
          <div className="relative">
            <div
              className={`w-full bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-3 text-sm md:text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${
                isEnglishExpanded ? 'h-auto overflow-y-auto' : 'max-h-[400px] overflow-hidden'
              }`}
            >
              {interpolatedEnglish || <span className="text-gray-700 italic">No English prompt content.</span>}
            </div>
            {!isEnglishExpanded && hasLongEnglish && (
              <button
                onClick={() => setIsEnglishExpanded(true)}
                className="absolute bottom-2 right-2 text-xs text-green-400 hover:text-green-300 bg-gray-900/80 px-2 py-1 rounded border border-green-500/30 hover:bg-gray-800/90 transition-all z-10"
              >
                展开 ({englishStats.chars} chars)
              </button>
            )}
          </div>
          {isEnglishExpanded && hasLongEnglish && (
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
              <button
                onClick={() => setIsEnglishExpanded(false)}
                className="text-green-400 hover:text-green-300 flex items-center gap-1 transition-all"
              >
                <Icons.ChevronUp size={14} /> 收起预览
              </button>
            </div>
          )}
        </div>

        {/* Chinese Preview */}
        <div className={`bg-gray-900/60 rounded-lg p-6 space-y-4 border border-white/10 transition-all`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-xs font-semibold text-brand-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
              中文提示词预览
              {interpolatedChinese && (
                <span className="text-[10px] text-brand-400/70 font-normal normal-case ml-1">
                  ({chineseStats.chars} 字符 · {chineseStats.words} 词)
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={onCopyChinesePrompt}
                className="flex items-center gap-1.5 text-xs font-medium bg-brand-500/15 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/25 transition-all"
                title="复制中文提示词"
              >
                <Icons.Copy size={12} /> 复制
              </button>
            </div>
          </div>
          <div className="relative">
            <div
              className={`w-full bg-gray-950/80 border border-white/15 rounded-lg px-3 md:px-4 py-3 text-sm md:text-sm font-mono text-gray-100 leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${
                isChineseExpanded ? 'h-auto overflow-y-auto' : 'max-h-[400px] overflow-hidden'
              }`}
            >
              {interpolatedChinese || <span className="text-gray-700 italic">尚未填写中文提示词内容。</span>}
            </div>
            {!isChineseExpanded && hasLongChinese && (
              <button
                onClick={() => setIsChineseExpanded(true)}
                className="absolute bottom-2 right-2 text-xs text-brand-400 hover:text-brand-300 bg-gray-900/80 px-2 py-1 rounded border border-brand-500/30 hover:bg-gray-800/90 transition-all z-10"
              >
                展开 ({chineseStats.chars} 字符)
              </button>
            )}
          </div>
          {isChineseExpanded && hasLongChinese && (
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
              <button
                onClick={() => setIsChineseExpanded(false)}
                className="text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-all"
              >
                <Icons.ChevronUp size={14} /> 收起预览
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LINE 5: Few-Shot Examples */}
      {formData.examples && formData.examples.length > 0 && (
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Icons.List size={14} className="text-brand-500/50" /> Few-Shot Examples ({formData.examples.length})
            </h3>
            <button
              onClick={() => onSetActiveTab('examples')}
              className="text-[10px] font-bold text-brand-400 hover:text-brand-300 px-3 py-1 rounded-lg border border-brand-500/20 hover:bg-brand-500/10 transition-all"
            >
              EDIT EXAMPLES
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {formData.examples.map((ex, i) => (
              <div
                key={i}
                className="bg-gray-900/10 border border-white/5 rounded-xl p-5 flex flex-col gap-4 hover:bg-gray-900/20 hover:border-brand-500/20 transition-all group/ex-card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/[0.02] rounded-full blur-2xl group-hover/ex-card:bg-brand-500/[0.05] transition-all"></div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-800 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 shadow-inner group-hover/ex-card:border-brand-500/30 group-hover/ex-card:text-brand-400 transition-all">{i + 1}</span>
                  <div className="h-[1px] flex-1 bg-white/5 group-hover/ex-card:bg-brand-500/10 transition-all"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-blue-400/50 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-blue-500/50"></div> Input
                    </span>
                    <div className="text-xs text-gray-300 font-mono bg-black/40 p-3 rounded-lg border border-white/5 line-clamp-5 hover:line-clamp-none transition-all leading-relaxed shadow-inner">
                      {ex.input}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-brand-400/50 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-brand-500/50"></div> Output
                    </span>
                    <div className="text-xs text-brand-100/80 font-mono bg-black/40 p-3 rounded-lg border border-white/5 line-clamp-5 hover:line-clamp-none transition-all leading-relaxed shadow-inner">
                      {ex.output}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


