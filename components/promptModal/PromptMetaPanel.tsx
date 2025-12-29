import React from 'react';
import { PromptFormData } from '../../types';
import { colors, SECTION_STYLES } from '../ui/styleTokens';
import { debugEnvironmentVariables } from '../../services/groqConfig';

interface PromptMetaPanelProps {
  formData: PromptFormData;
  onFormDataChange: (data: PromptFormData) => void;
  getTokenCount: (text: string) => number;
  onAutoMetadata?: (options?: { target?: string; provider?: string }) => Promise<any> | any;
  onAutoTag?: () => void;
  isTagging?: boolean;
  tagSuggestions?: string[];
  tagInput?: string;
  onTagInputChange?: (value: string) => void;
  onTagKeyDown?: (e: React.KeyboardEvent) => void;
  onAddTagFromSuggestion?: (tag: string) => void;
  allCategories?: string[];
}

// The panel intentionally avoids leading examples or prescriptive helper text
// that could bias users. It exposes explicit fields and an opt-in auto-complete
// control so models may assist without pre-populating or nudging user content.
export const PromptMetaPanel: React.FC<PromptMetaPanelProps> = (props) => {
  const { formData, onFormDataChange, onAutoMetadata } = props;
  const [isAutoMetaLoading, setIsAutoMetaLoading] = React.useState(false);
  const [autoTarget, setAutoTarget] = React.useState<string>('all');

  // 展开/折叠状态管理
  const [expandedFields, setExpandedFields] = React.useState<Record<string, boolean>>({});
  // 移除本地状态，使用全局 ModelSelector

  const updateField = (key: keyof typeof formData, value: any) => {
    onFormDataChange({ ...formData, [key]: value } as any);
  };

  const updateExtracted = (partial: Partial<NonNullable<typeof formData.extracted>>) => {
    onFormDataChange({
      ...formData,
      extracted: { ...(formData.extracted || {}), ...partial },
    } as any);
  };

  const updateConstraintsFromTextarea = (value: string) => {
    const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
    updateExtracted({ constraints: lines });
  };

  // 辅助函数
  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };


  const getMinHeight = (lineHeight: number = 20): string => {
    return `${lineHeight * 3}px`; // 至少3行的高度作为最小高度
  };

  const isLongContent = (text: string) => {
    if (!text) return false;
    return text.length > 1000 || text.split('\n').length > 20;
  };

  const toggleFieldExpansion = (fieldKey: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };



  // evaluation is stored under extracted (editable textarea). previous tag-based UI removed.

  return (
    <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.meta} ${SECTION_STYLES.container.padding} ${SECTION_STYLES.container.spacing}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 min-h-[56px]">
        <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-2 mb-0`}>
          <div className={`w-2 h-2 rounded-full ${SECTION_STYLES.icons.indicator.variants.purple}`}></div>
          元数据
        </h3>
        <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
          {onAutoMetadata && (
            <>
              <select
                value={autoTarget}
                onChange={(e) => setAutoTarget(e.target.value)}
                aria-label="选择要自动补全的字段（可选）"
                className="w-auto min-w-0 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-md px-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-primary)]/50 focus:ring-1 focus:ring-[var(--color-brand-primary)]/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">选择字段</option>
                <option value="all">全部</option>
                <option value="intent">意图</option>
                <option value="role">角色</option>
                <option value="audience">受众</option>
                <option value="action">作用</option>
                <option value="quality">质量目标</option>
                <option value="constraints">边界</option>
                <option value="examples">示例</option>
                <option value="format">格式</option>
                <option value="version">版本</option>
                <option value="evaluation">评估</option>
              </select>
              {/* 智能补全按钮 - 主要操作 */}
              <button
                onClick={async () => {
                  if (!onAutoMetadata || !autoTarget) return;
                  setIsAutoMetaLoading(true);
                  try {
                    // If user requested "全部", delegate full processing to parent hook which already
                    // performs model-based generation and sets formData for all related fields.
                    if (autoTarget === 'all') {
                      await onAutoMetadata({ target: 'all' } as any);
                      return;
                    }

                    const res = await onAutoMetadata({ target: autoTarget } as any);
                    if (!res) return;

                    // handle several return shapes conservatively; prefer explicit mapping for specific targets
                    if (typeof res === 'string') {
                      if (autoTarget === 'intent') updateExtracted({ intent: res });
                      else if (autoTarget === 'role') updateExtracted({ role: res } as any);
                      else if (autoTarget === 'audience') updateExtracted({ audience: res } as any);
                      else if (autoTarget === 'action') updateField('usageNotes', res);
                      else if (autoTarget === 'quality') updateField('cautions', res);
                      else if (autoTarget === 'format') updateField('outputType', res as any);
                      else if (autoTarget === 'version') updateField('description', res);
                      else if (autoTarget === 'evaluation') updateExtracted({ ...(formData.extracted || {}), evaluation: res } as any);
                    } else if (res.extracted) {
                      updateExtracted(res.extracted);
                    } else if (res.examples && Array.isArray(res.examples)) {
                      // Update examples using current formData
                      onFormDataChange({ ...formData, examples: res.examples } as any);
                    }
                  } catch (error) {
                    console.error('智能补全失败:', error);
                    // Don't rethrow - let error boundary handle it
                  } finally {
                    setIsAutoMetaLoading(false);
                  }
                }}
                disabled={isAutoMetaLoading || !autoTarget}
                className={SECTION_STYLES.buttons.primary}
              >
                {isAutoMetaLoading ? '补全中...' : '智能补全'}
              </button>

              {/* 调试API按钮 - 次级操作 */}
              <button
                onClick={() => debugEnvironmentVariables()}
                className={SECTION_STYLES.buttons.secondary}
                title="调试环境变量"
              >
                调试API
              </button>
            </>
          )}
          {/* auto-tag button intentionally removed per design: tagging remains possible via parent controls */}
        </div>
      </div>

      {/* Metadata form: three groups (语义定义 / 质量控制 / 工程与管理) */}
      <div className="grid grid-cols-1 gap-4">
        {/* 语义定义 */}
        <div className="bg-gray-950/60 border border-white/10 rounded-lg p-3 sm:p-4 border-l-4 border-l-blue-400/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-3">
            {/* 语义定义标题占据整行 */}
            <div className="md:col-span-2">
              <div className="p-0 bg-transparent transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-blue-400/50 shadow-[0_0_8px]"></div>
                    <h4 className={`text-sm font-semibold ${colors.text.muted} uppercase tracking-wider`}>
                      语义定义
                    </h4>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Intent and Role side-by-side */}
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                意图
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateExtracted({ intent: newContent });
                  }}
                  onFocus={(e) => {
                    if (!formData.extracted?.intent) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = formData.extracted?.intent || '';
                    }
                  }}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[2.5rem] leading-relaxed whitespace-pre-wrap"
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="意图"
                >
                  {formData.extracted?.intent || ''}
                </div>
              </div>
            </div>
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                角色
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateField('extracted', { ...(formData.extracted || {}), role: newContent });
                  }}
                  onFocus={(e) => {
                    if (!(formData.extracted as any)?.role) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = (formData.extracted as any)?.role || '';
                    }
                  }}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[2.5rem] leading-relaxed whitespace-pre-wrap"
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="角色"
                >
                  {(formData.extracted as any)?.role || ''}
                </div>
              </div>
            </div>

            {/* Audience and Action side-by-side */}
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                受众
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateExtracted({ audience: newContent });
                  }}
                  onFocus={(e) => {
                    if (!formData.extracted?.audience) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = formData.extracted?.audience || '';
                    }
                  }}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[2.5rem] leading-relaxed whitespace-pre-wrap"
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="受众"
                >
                  {formData.extracted?.audience || ''}
                </div>
              </div>
            </div>
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                作用
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateField('usageNotes', newContent);
                  }}
                  onFocus={(e) => {
                    if (!formData.usageNotes) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = formData.usageNotes || '';
                    }
                  }}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[2.5rem] leading-relaxed whitespace-pre-wrap"
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="作用"
                >
                  {formData.usageNotes || ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 质量控制 */}
        <div className="bg-gray-950/60 border border-white/10 rounded-lg p-3 sm:p-4 border-l-4 border-l-green-400/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-3">
            {/* 质量控制标题占据整行 */}
            <div className="md:col-span-2">
              <div className="p-0 bg-transparent transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-green-400/50 shadow-[0_0_8px]"></div>
                    <h4 className={`text-sm font-semibold ${colors.text.muted} uppercase tracking-wider`}>
                      质量控制
                    </h4>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-green-400/30 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* 质量目标和边界/禁止项并排 */}
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                质量目标
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateField('cautions', newContent);
                  }}
                  onFocus={(e) => {
                    if (!formData.cautions) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = formData.cautions || '';
                    }
                  }}
                  className={`w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 leading-relaxed whitespace-pre-wrap overflow-y-auto ${
                    isLongContent(formData.cautions || '') && !expandedFields['cautions'] ? 'max-h-[400px] overflow-hidden' : 'min-h-[2.5rem]'
                  }`}
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="质量目标"
                >
                  {formData.cautions || ''}
                </div>
                {isLongContent(formData.cautions || '') && (
                  <>
                    {!expandedFields['cautions'] && (
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-950/95 via-gray-950/60 to-transparent flex items-end justify-center pb-3 z-10">
                        <button
                          onClick={() => toggleFieldExpansion('cautions')}
                          className="text-xs text-green-400 hover:text-green-300 bg-gray-900/80 px-3 py-1 rounded border border-green-500/30 hover:bg-gray-800/90 transition-all"
                        >
                          展开 ({getLineCount(formData.cautions || '')} 行)
                        </button>
                      </div>
                    )}
                    {expandedFields['cautions'] && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => toggleFieldExpansion('cautions')}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          收起
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                边界 / 禁止项
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateConstraintsFromTextarea(newContent);
                  }}
                  onFocus={(e) => {
                    if (!(formData.extracted?.constraints || []).length) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = (formData.extracted?.constraints || []).join('\n') || '';
                    }
                  }}
                  className={`w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 leading-relaxed whitespace-pre-wrap overflow-y-auto ${
                    isLongContent((formData.extracted?.constraints || []).join('\n')) && !expandedFields['constraints'] ? 'max-h-[400px] overflow-hidden' : 'min-h-[2.5rem]'
                  }`}
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="边界 / 禁止项"
                >
                  {(formData.extracted?.constraints || []).join('\n') || ''}
                </div>
                {isLongContent((formData.extracted?.constraints || []).join('\n')) && (
                  <>
                    {!expandedFields['constraints'] && (
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-950/95 via-gray-950/60 to-transparent flex items-end justify-center pb-3 z-10">
                        <button
                          onClick={() => toggleFieldExpansion('constraints')}
                          className="text-xs text-green-400 hover:text-green-300 bg-gray-900/80 px-3 py-1 rounded border border-green-500/30 hover:bg-gray-800/90 transition-all"
                        >
                          展开 ({getLineCount((formData.extracted?.constraints || []).join('\n'))} 行)
                        </button>
                      </div>
                    )}
                    {expandedFields['constraints'] && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => toggleFieldExpansion('constraints')}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          收起
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 工程与管理 */}
        <div className="bg-gray-950/60 border border-white/10 rounded-lg p-3 sm:p-4 border-l-4 border-l-purple-400/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-3">
            {/* 工程与管理标题占据整行 */}
            <div className="md:col-span-2">
              <div className="p-0 bg-transparent transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-purple-400/50 shadow-[0_0_8px]"></div>
                    <h4 className={`text-sm font-semibold ${colors.text.muted} uppercase tracking-wider`}>
                      工程与管理
                    </h4>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-400/30 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* 版本更迭和裁定标准并排 */}
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                版本更迭
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateField('description', newContent);
                  }}
                  onFocus={(e) => {
                    if (!formData.description) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = formData.description || '';
                    }
                  }}
                  className="w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 min-h-[2.5rem] leading-relaxed whitespace-pre-wrap"
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="版本 / 修改记录"
                >
                  {formData.description || ''}
                </div>
              </div>
            </div>
            <div>
              <label className={`text-xs font-semibold ${colors.text.muted} uppercase tracking-wider flex items-center gap-1 mb-2`}>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                裁定标准
              </label>
              <div className="relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    const newContent = target.textContent || '';
                    updateExtracted({ ...(formData.extracted || {}), evaluation: newContent });
                  }}
                  onFocus={(e) => {
                    if (!(formData.extracted as any)?.evaluation) {
                      e.target.textContent = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.textContent?.trim()) {
                      e.target.textContent = (formData.extracted as any)?.evaluation || '';
                    }
                  }}
                  className={`w-full bg-gray-950/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 leading-relaxed whitespace-pre-wrap overflow-y-auto ${
                    isLongContent((formData.extracted as any)?.evaluation || '') && !expandedFields['evaluation'] ? 'max-h-[400px] overflow-hidden' : 'min-h-[2.5rem]'
                  }`}
                  style={{
                    minHeight: getMinHeight()
                  }}
                  aria-label="评估标准（模型判定 / 说明）"
                >
                  {(formData.extracted as any)?.evaluation || ''}
                </div>
                {isLongContent((formData.extracted as any)?.evaluation || '') && (
                  <>
                    {!expandedFields['evaluation'] && (
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-950/95 via-gray-950/60 to-transparent flex items-end justify-center pb-3 z-10">
                        <button
                          onClick={() => toggleFieldExpansion('evaluation')}
                          className="text-xs text-purple-400 hover:text-purple-300 bg-gray-900/80 px-3 py-1 rounded border border-purple-500/30 hover:bg-gray-800/90 transition-all"
                        >
                          展开 ({getLineCount((formData.extracted as any)?.evaluation || '')} 行)
                        </button>
                      </div>
                    )}
                    {expandedFields['evaluation'] && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => toggleFieldExpansion('evaluation')}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          收起
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default PromptMetaPanel;



