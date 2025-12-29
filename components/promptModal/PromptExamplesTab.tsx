import React, { useState, useRef } from 'react';
import { Example, ExampleMode, ExamplesHistory } from '../../types';
import { Icons } from '../Icons';

interface PromptExamplesTabProps {
  examples: Example[];
  isGeneratingExamples: boolean;
  autoFillingIndex: number | null;
  onGenerateExamples: (append?: boolean, mode?: ExampleMode) => void;
  onGenerateIterative?: () => void;
  onAddExample: () => void;
  onClearExamples: () => void;
  onRemoveExample: (index: number) => void;
  onUpdateExample: (index: number, field: 'input' | 'output', value: string) => void;
  onAutoFillOutput: (index: number) => void;
  onExportExamples?: () => void;
  onImportExamples?: (file: File) => void;
  onSaveToHistory?: (name?: string, description?: string) => void;
  onLoadFromHistory?: (historyItem: ExamplesHistory) => void;
  getHistoryList?: () => ExamplesHistory[];
  onSelectDirectory?: () => Promise<string | null>;
}

export const PromptExamplesTab: React.FC<PromptExamplesTabProps> = ({
  examples,
  isGeneratingExamples,
  autoFillingIndex,
  onGenerateExamples,
  onGenerateIterative,
  onAddExample,
  onClearExamples,
  onRemoveExample,
  onUpdateExample,
  onAutoFillOutput,
  onExportExamples,
  onImportExamples,
  onSaveToHistory,
  onLoadFromHistory,
  getHistoryList,
  onSelectDirectory,
}) => {
  const hasExamples = examples && examples.length > 0;
  const [generationMode, setGenerationMode] = useState<ExampleMode>('independent');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSaveHistoryDialog, setShowSaveHistoryDialog] = useState(false);
  const [showDirectoryDialog, setShowDirectoryDialog] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const [historyDescription, setHistoryDescription] = useState('');
  const [directoryInput, setDirectoryInput] = useState('');
  const [defaultDirectory, setDefaultDirectory] = useState<string>(
    () => localStorage.getItem('examples_default_directory') || 'examples'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 统计不同类型的示例
  const iterativeExamples = examples.filter(ex => ex.mode === 'iterative');
  const hasIterativeExamples = iterativeExamples.length > 0;
  
  const historyList = getHistoryList ? getHistoryList() : [];
  
  // 监听 localStorage 变化以更新默认目录显示
  React.useEffect(() => {
    const handleStorageChange = () => {
      setDefaultDirectory(localStorage.getItem('examples_default_directory') || 'examples');
    };
    window.addEventListener('storage', handleStorageChange);
    // 也监听同页面的变化（通过轮询）
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 w-full animate-slide-up-fade">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 示例系统说明 + AI 工具区 */}
        <div className="lg:col-span-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-theme p-5 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/15 rounded-lg border border-brand-500/30 shadow-lg shadow-brand-500/20">
              <Icons.List size={18} className="text-brand-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                示例系统（Few-shot）
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                用一组高质量示例，教会模型「应该如何回答」，而不是每次从零开始描述规则。
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-300">
                <Icons.Sparkles size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">模型自动填充示例：</span>
                基于当前 Prompt，一次生成 1 个示例，可继续生成更多，建议生成 3-5 个覆盖不同场景。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-300">
                <Icons.Ideas size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">多轮调用场景：</span>
                为不同场景（简单/复杂/异常输入）各设计一组示例，帮助模型学会更稳健的行为。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-300">
                <Icons.Run size={14} />
              </span>
              <p>
                <span className="text-gray-200 font-semibold">基础 CRUD 能力：</span>
                随时新增、编辑、删除示例；用 AI 辅助生成，再保留你认为「最像真实数据」的版本。
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10 mt-3">
            {/* 模式切换 */}
            <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg border border-white/10">
              <button
                onClick={() => setGenerationMode('independent')}
                className={`flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  generationMode === 'independent'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                独立新增
              </button>
              <button
                onClick={() => setGenerationMode('iterative')}
                className={`flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  generationMode === 'iterative'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                多轮迭代
              </button>
            </div>

            {/* 生成按钮 */}
            {generationMode === 'independent' ? (
              !hasExamples ? (
                <button
                  onClick={() => onGenerateExamples(false, 'independent')}
                  disabled={isGeneratingExamples}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white border border-brand-400/80 hover:border-brand-300 shadow-[0_0_18px_rgba(var(--c-brand),0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingExamples ? (
                    <>
                      <span className="animate-spin">
                        <Icons.Activity size={14} />
                      </span>
                      正在生成第 1 个示例...
                    </>
                  ) : (
                    <>
                      <Icons.Magic size={14} />
                      让模型生成第 1 个示例
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onGenerateExamples(true, 'independent')}
                    disabled={isGeneratingExamples}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white border border-brand-400/80 hover:border-brand-300 shadow-[0_0_18px_rgba(var(--c-brand),0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGeneratingExamples ? (
                      <>
                        <span className="animate-spin">
                          <Icons.Activity size={14} />
                        </span>
                        正在生成第 {examples.length + 1} 个示例...
                      </>
                    ) : (
                      <>
                        <Icons.Magic size={14} />
                        继续生成独立示例
                      </>
                    )}
                  </button>
                  <div className="text-[10px] text-gray-500 text-center px-2">
                    建议生成 3-5 个示例覆盖不同场景
                  </div>
                </>
              )
            ) : (
              <>
                <button
                  onClick={onGenerateIterative}
                  disabled={isGeneratingExamples || !hasIterativeExamples}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-purple-500/80 hover:bg-purple-500 text-white border border-purple-400/80 hover:border-purple-300 shadow-[0_0_18px_rgba(147,51,234,0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingExamples ? (
                    <>
                      <span className="animate-spin">
                        <Icons.Activity size={14} />
                      </span>
                      正在迭代优化...
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles size={14} />
                      {hasIterativeExamples ? `继续第 ${iterativeExamples.length + 1} 轮迭代` : '开始多轮迭代（需先有示例）'}
                    </>
                  )}
                </button>
                <div className="text-[10px] text-gray-500 text-center px-2">
                  {hasIterativeExamples 
                    ? `当前已有 ${iterativeExamples.length} 轮迭代，将基于上一轮进行优化`
                    : '请先使用"独立新增"模式生成第一个示例'}
                </div>
              </>
            )}
            <button
              onClick={onAddExample}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-100 border border-white/15 hover:border-white/25 transition-all"
            >
              <Icons.Plus size={14} />
              手动添加一条示例
            </button>
            
            {/* 导入/导出和历史管理 */}
            <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
              <div className="text-[10px] text-gray-500 font-semibold uppercase mb-2">持久化与历史</div>
              
              {/* 默认保存目录设置 */}
              <div className="pb-2 border-b border-white/5 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icons.Archive size={12} className="text-yellow-400" />
                    <span className="text-[10px] font-semibold text-gray-300">默认保存目录</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {onSelectDirectory && (
                      <button
                        onClick={async () => {
                          const selectedDir = await onSelectDirectory();
                          if (selectedDir) {
                            localStorage.setItem('examples_default_directory', selectedDir);
                            setDefaultDirectory(selectedDir);
                          }
                        }}
                        className="text-[10px] px-2 py-1 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 rounded border border-yellow-500/30 hover:border-yellow-500/40 transition-all"
                        title="选择保存目录（推荐，Chrome/Edge）"
                      >
                        <Icons.Archive size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const currentDir = localStorage.getItem('examples_default_directory') || 'examples';
                        setDirectoryInput(currentDir);
                        setShowDirectoryDialog(true);
                      }}
                      className="text-[10px] px-2 py-1 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 rounded border border-yellow-500/30 hover:border-yellow-500/40 transition-all"
                      title="手动输入目录名称"
                    >
                      <Icons.Edit size={10} />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 bg-gray-950/50 rounded p-2 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Icons.Archive size={10} className="text-gray-400" />
                    <span className="font-mono text-gray-400">
                      {localStorage.getItem('examples_directory_path') || defaultDirectory}
                    </span>
                    {(defaultDirectory !== 'examples' || localStorage.getItem('examples_directory_path')) && (
                      <button
                        onClick={() => {
                          localStorage.removeItem('examples_default_directory');
                          localStorage.removeItem('examples_directory_path');
                          setDefaultDirectory('examples');
                        }}
                        className="ml-auto text-gray-400 hover:text-red-300 transition-colors"
                        title="重置为默认"
                      >
                        <Icons.Close size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  {onSelectDirectory 
                    ? '点击文件夹图标选择目录（推荐），或点击编辑图标手动输入。设置后导出将直接保存，无需确认。'
                    : '设置后，导出文件将自动使用此目录路径，提高保存效率。'}
                </p>
              </div>
              
              {onExportExamples && (
                <button
                  onClick={onExportExamples}
                  disabled={!hasExamples}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 hover:border-blue-500/40 transition-all disabled:opacity-40"
                >
                  <Icons.Download size={13} />
                  导出到文件
                </button>
              )}
              
              {onImportExamples && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onImportExamples) {
                        onImportExamples(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 hover:border-green-500/40 transition-all"
                  >
                    <Icons.Upload size={13} />
                    从文件导入
                  </button>
                </>
              )}
              
              {onSaveToHistory && (
                <button
                  onClick={() => setShowSaveHistoryDialog(true)}
                  disabled={!hasExamples}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 hover:border-purple-500/40 transition-all disabled:opacity-40"
                >
                  <Icons.Check size={13} />
                  保存到历史
                </button>
              )}
              
              {onLoadFromHistory && getHistoryList && historyList.length > 0 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 hover:border-orange-500/40 transition-all"
                >
                  <Icons.History size={13} />
                  从历史还原 ({historyList.length})
                </button>
              )}
            </div>
            
            <button
              onClick={onClearExamples}
              disabled={!hasExamples}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg bg-transparent text-gray-500 hover:text-red-300 border border-white/10 hover:border-red-400/60 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-white/10 disabled:hover:text-gray-500"
            >
              <Icons.Trash size={13} />
              清空当前所有示例
            </button>
          </div>
        </div>

        {/* Right: 示例列表 + 编辑区 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icons.List size={16} className="text-brand-400" />
              <span className="font-semibold text-gray-200">示例集合</span>
              <span className="text-[11px] text-gray-500">
                ({examples.length || 0} 条，建议 3–5 条覆盖不同场景)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="hidden md:inline">
                小提示：可以先让 AI 帮你起草，再用真实业务语境润色。
              </span>
            </div>
          </div>

          {!hasExamples && (
            <div className="text-center py-12 border-2 border-dashed border-[var(--color-border-primary)] rounded-theme bg-[var(--color-bg-secondary)] backdrop-blur-xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-lg shadow-black/40">
                <Icons.Sparkles size={22} className="text-brand-300" />
              </div>
              <p className="text-sm font-medium text-gray-200 mb-2">还没有任何示例</p>
              <p className="text-xs text-gray-500 mb-5">
                先让模型生成第一个示例，然后可以继续生成更多示例，再挑选和修改为更贴近你真实业务的版本。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onGenerateExamples(false)}
                  disabled={isGeneratingExamples}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white border border-brand-400/80 hover:border-brand-300 shadow-[0_0_18px_rgba(var(--c-brand),0.4)] transition-all disabled:opacity-60"
                >
                  {isGeneratingExamples ? (
                    <>
                      <span className="animate-spin">
                        <Icons.Activity size={14} />
                      </span>
                      正在生成第 1 个示例...
                    </>
                  ) : (
                    <>
                      <Icons.Magic size={14} />
                      让模型生成第 1 个示例
                    </>
                  )}
                </button>
                <button
                  onClick={onAddExample}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-100 border border-white/15 hover:border-white/25 transition-all"
                >
                  <Icons.Edit size={14} />
                  我想从空白开始写
                </button>
              </div>
            </div>
          )}

          {examples.map((ex, index) => (
            <div
              key={index}
              className={`group relative bg-[var(--color-bg-secondary)] border rounded-theme p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-xl overflow-hidden ${
                ex.mode === 'iterative' 
                  ? 'border-purple-500/30 hover:border-purple-500/50' 
                  : 'border-white/12 hover:border-brand-500/40'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-400 ${
                ex.mode === 'iterative'
                  ? 'from-purple-500/0 via-purple-500/0 to-purple-500/8'
                  : 'from-brand-500/0 via-brand-500/0 to-brand-500/8'
              }`} />
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                ex.mode === 'iterative'
                  ? 'bg-purple-500/8'
                  : 'bg-brand-500/8'
              }`} />

              {/* Header: index + actions */}
              <div className="relative z-10 flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  {ex.mode === 'iterative' ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-500/40 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <span className="text-[11px] font-bold text-purple-50">
                        {ex.iterationIndex !== undefined ? `迭代${ex.iterationIndex + 1}` : '迭代'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500/30 to-brand-500/10 border border-brand-500/40 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30">
                      <span className="text-[11px] font-bold text-brand-50">
                        {index + 1}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-200">
                        {ex.mode === 'iterative' ? `迭代示例 #${ex.iterationIndex !== undefined ? ex.iterationIndex + 1 : '?'}` : `示例 #${index + 1}`}
                      </span>
                      {ex.mode === 'iterative' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          多轮迭代
                        </span>
                      )}
                      {(!ex.mode || ex.mode === 'independent') && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40">
                          独立新增
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {ex.mode === 'iterative' 
                        ? '基于上一轮输出进行优化迭代，展示持续改进过程。'
                        : '建议描述一种「典型场景」：如正常输入、边界输入、异常输入等。'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRemoveExample(index)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 transition-all"
                    title="删除该示例"
                  >
                    <Icons.Trash size={15} />
                  </button>
                </div>
              </div>

              {/* 迭代示例：显示上一轮输出 */}
              {ex.mode === 'iterative' && ex.previousOutput && (
                <div className="relative z-10 mb-4 p-4 bg-gray-900/60 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.History size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300 uppercase">
                      上一轮输出（第 {ex.iterationIndex !== undefined ? ex.iterationIndex : '?'} 轮）
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 font-mono whitespace-pre-wrap bg-gray-950/80 p-3 rounded border border-purple-500/10 max-h-32 overflow-y-auto">
                    {ex.previousOutput}
                  </div>
                </div>
              )}

              {/* Content grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
                    <span>用户输入示例</span>
                  </label>
                  <textarea
                    value={ex.input}
                    onChange={(e) => onUpdateExample(index, 'input', e.target.value)}
                    className="w-full h-36 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-4 text-sm font-mono text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/40 resize-y transition-all hover:border-[var(--color-brand-primary)]/70 shadow-inner shadow-black/80"
                    placeholder="例如：用户贴上了一段低质量代码，请你帮他重构并解释修改原因..."
                  />
                  <p className="text-[11px] text-gray-500">
                    尽量用真实、完整的输入，而不是一句话概述，这样模型才能学到足够多信息。
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(var(--c-brand),0.9)] ${
                        ex.mode === 'iterative' 
                          ? 'bg-purple-400' 
                          : 'bg-brand-400'
                      }`} />
                      <span>{ex.mode === 'iterative' ? '优化后的模型输出' : '期望模型输出'}</span>
                    </label>
                    <button
                      onClick={() => onAutoFillOutput(index)}
                      disabled={autoFillingIndex === index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-100 border border-brand-500/40 hover:border-brand-400 transition-all disabled:opacity-60"
                    >
                      {autoFillingIndex === index ? (
                        <>
                          <span className="animate-spin">
                            <Icons.Activity size={12} />
                          </span>
                          由模型补全中...
                        </>
                      ) : (
                        <>
                          <Icons.Magic size={12} />
                          让模型补全输出
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={ex.output}
                    onChange={(e) => onUpdateExample(index, 'output', e.target.value)}
                    className={`w-full h-36 bg-[var(--color-bg-primary)] border rounded-lg p-4 text-sm font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-2 resize-y transition-all shadow-inner shadow-black/80 ${
                      ex.mode === 'iterative'
                        ? 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/40 hover:border-purple-400/70'
                        : 'border-brand-500/30 focus:border-brand-400 focus:ring-brand-500/40 hover:border-brand-400/70'
                    }`}
                    placeholder={ex.mode === 'iterative' 
                      ? '展示如何基于上一轮输出进行优化改进...'
                      : '例如：按步骤解释重构思路，先给出改写后的代码，再用项目团队习惯的风格总结注意事项...'}
                  />
                  <p className="text-[11px] text-gray-500">
                    {ex.mode === 'iterative'
                      ? '展示优化后的输出，说明相比上一轮的改进点。'
                      : '把这里当作「示范答案」。未来真实调用时，模型会尽量模仿这些输出的结构、语气和细节密度。'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 设置默认保存目录对话框 */}
      {showDirectoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">设置默认保存目录</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">目录名称</label>
                <input
                  type="text"
                  value={directoryInput}
                  onChange={(e) => setDirectoryInput(e.target.value)}
                  placeholder="例如: examples, my_examples, 对话示例"
                  className="w-full bg-gray-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = directoryInput.trim();
                      if (trimmed) {
                        localStorage.setItem('examples_default_directory', trimmed);
                        setDefaultDirectory(trimmed);
                      } else {
                        localStorage.removeItem('examples_default_directory');
                        setDefaultDirectory('examples');
                      }
                      setShowDirectoryDialog(false);
                      setDirectoryInput('');
                    } else if (e.key === 'Escape') {
                      setShowDirectoryDialog(false);
                      setDirectoryInput('');
                    }
                  }}
                />
                <p className="text-[10px] text-gray-500 mt-2">
                  设置后，导出文件将自动保存到该目录路径下。留空则使用默认值 "examples"。
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDirectoryDialog(false);
                    setDirectoryInput('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const trimmed = directoryInput.trim();
                    if (trimmed) {
                      localStorage.setItem('examples_default_directory', trimmed);
                      setDefaultDirectory(trimmed);
                    } else {
                      localStorage.removeItem('examples_default_directory');
                      setDefaultDirectory('examples');
                    }
                    setShowDirectoryDialog(false);
                    setDirectoryInput('');
                  }}
                  className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 保存历史对话框 */}
      {showSaveHistoryDialog && onSaveToHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">保存到历史记录</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">名称</label>
                <input
                  type="text"
                  value={historyName}
                  onChange={(e) => setHistoryName(e.target.value)}
                  placeholder="历史记录名称"
                  className="w-full bg-gray-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">描述 (可选)</label>
                <textarea
                  value={historyDescription}
                  onChange={(e) => setHistoryDescription(e.target.value)}
                  placeholder="描述这个历史记录..."
                  className="w-full bg-gray-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-y min-h-[80px]"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveHistoryDialog(false);
                    setHistoryName('');
                    setHistoryDescription('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onSaveToHistory(historyName || undefined, historyDescription || undefined);
                    setShowSaveHistoryDialog(false);
                    setHistoryName('');
                    setHistoryDescription('');
                  }}
                  className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录模态框 */}
      {showHistoryModal && onLoadFromHistory && getHistoryList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">历史记录</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icons.Close size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {historyList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">暂无历史记录</p>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-950/80 border border-white/10 rounded-lg p-4 hover:border-brand-500/40 transition-all cursor-pointer group"
                    onClick={() => {
                      onLoadFromHistory(item);
                      setShowHistoryModal(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">
                            {item.name || '未命名'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icons.List size={12} />
                          <span>{item.examples.length} 个示例</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadFromHistory(item);
                          setShowHistoryModal(false);
                        }}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg border border-brand-500/40 transition-all"
                      >
                        还原
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


