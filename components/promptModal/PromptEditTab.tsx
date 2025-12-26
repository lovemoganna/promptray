import React, { useState, useRef, useEffect } from 'react';
import { Prompt, PromptFormData, PromptStatus, OutputType, ApplicationScene } from '../../types';
import { Icons } from '../Icons';
import PromptMetaPanel from './PromptMetaPanel';
// PromptMetaPanel: right-side metadata column
import Tags from '../ui/Tags';
import {
  cardClass,
  innerInputClass,
  compactSelectClass,
  labelClass,
  buttonVariants,
  editorClass,
  statusIndicator,
  colors,
  // 新增的统一样式
  headingClass,
  subheadingClass,
  formInputClass,
  autoSaveButtonClass,
  emptyStateClass,
  iconContainerClass,
  exampleCardClass,
  tokenCountClass
} from '../ui/styleTokens';

// =============================================================================
// 组件常量配置
// =============================================================================
const COMPONENT_CONFIG = {
  // 高度和行数配置
  editor: {
    minLineHeight: 20,
    minLines: 3,
    maxCollapsedLines: 20,
  },
  // 响应式配置
  responsive: {
    emptyStateHeight: 'h-64 md:h-72 xl:h-80',
    iconSize: 'w-10 h-10 md:w-12 md:h-12',
    padding: 'px-3 md:px-4 py-2 md:py-3',
    textSize: 'text-sm md:text-sm',
  },
  // 占位符文本
  placeholders: {
    chinesePrompt: '在这里输入你的中文提示词...\n使用 {变量名} 创建动态输入',
    englishPrompt: '点击"翻译"按钮生成英文提示词',
    title: '输入提示词标题...',
    description: '简要描述这个提示词的用途...',
  },
  // 状态选项
  statusOptions: [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ],
  // 输出类型选项
  outputTypeOptions: [
    { value: '', label: '未指定' },
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
    { value: 'audio', label: '音频' },
    { value: 'text', label: '文本' }
  ],
  // 应用场景选项
  applicationSceneOptions: [
    { value: '', label: '未指定' },
    { value: '角色设计', label: '角色设计' },
    { value: '场景生成', label: '场景生成' },
    { value: '风格转换', label: '风格转换' },
    { value: '故事创作', label: '故事创作' },
    { value: '工具使用', label: '工具使用' },
    { value: '其他', label: '其他' }
  ],
  // 自动元数据目标选项
  autoMetaTargets: [
    { value: '', label: '选择字段' },
    { value: 'all', label: '全部' },
    { value: 'intent', label: '意图' },
    { value: 'role', label: '角色' },
    { value: 'audience', label: '受众' },
    { value: 'action', label: '作用' },
    { value: 'quality', label: '质量目标' },
    { value: 'constraints', label: '边界' },
    { value: 'examples', label: '示例' },
    { value: 'format', label: '格式' },
    { value: 'version', label: '版本' },
    { value: 'evaluation', label: '评估' }
  ]
};

// =============================================================================
// 共享组件和工具函数
// =============================================================================

// 统一的按钮渲染函数
const createActionButton = (
  onClick: () => void,
  children: React.ReactNode,
  variant: keyof typeof buttonVariants = 'secondary',
  disabled: boolean = false,
  title?: string
) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={buttonVariants[variant]}
    title={title}
  >
    {children}
  </button>
);

  // 统一的加载状态按钮
  const createLoadingButton = (
    isLoading: boolean,
    loadingText: string,
    children: React.ReactNode,
    variant: keyof typeof buttonVariants = 'secondary',
    disabled: boolean = false,
    title?: string
  ) => (
    <button
      disabled={disabled || isLoading}
      className={`${buttonVariants[variant]} ${isLoading ? 'animate-pulse' : ''}`}
      title={isLoading ? loadingText : title}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );


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
  onAutoMetadata: (options?: { target?: string; provider?: string }) => Promise<any> | any;
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
  isAutoSaving?: boolean;
  isAutoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
}

export const PromptEditTab: React.FC<PromptEditTabProps> = ({
  formData,
  initialData,
  allCategories,
  tagInput,
  tagSuggestions,
  isOptimizingSystem,
  isTranslating,
  isOptimizingPrompt,
  isTagging,
  onFormDataChange,
  onAutoMetadata,
  onAutoTag,
  onTagInputChange,
  onTagKeyDown,
  onAddTagFromSuggestion,
  getTokenCount,
  onDuplicate,
  onCancel,
  onSaveClick,
  isAutoSaving,
  isAutoSaveEnabled,
  onToggleAutoSave,
}) => {
  // 默认隐藏次要区块，减少初始认知负担；用户可展开
  const [showSystem, setShowSystem] = useState(true);
  const [titleTouched, setTitleTouched] = useState(false);
  const [chinesePromptExpanded, setChinesePromptExpanded] = useState(false);
  const [englishPromptExpanded, setEnglishPromptExpanded] = useState(false);
  const [isEditingChinesePrompt, setIsEditingChinesePrompt] = useState(false);

  // Compact select for tighter alignment in the right column (shared token)
  // Derived metadata for display (use getTokenCount directly where needed)
  const titleTrimmed = (formData.title || '').trim();
  const titleValid = titleTrimmed.length > 0 && titleTrimmed.length <= 200;

  // 内容验证
  const contentValid = (formData.content || '').trim().length > 0;
  const contentTokenCount = getTokenCount(formData.content);
  const contentTooLong = contentTokenCount > 4000; // 假设最大token限制

  // 示例验证
  const examplesValid = (formData.examples || []).every(ex =>
    ex.input.trim().length > 0 && ex.output.trim().length > 0
  );

  // 整体表单验证
  const isFormValid = titleValid && contentValid && !contentTooLong && examplesValid;

  // 获取验证消息
  const getValidationMessage = (): string => {
    if (!titleValid) return '请填写标题（1-200个字符）';
    if (!contentValid) return '请填写中文提示词内容';
    if (contentTooLong) return `提示词过长（${contentTokenCount}/4000 tokens），请精简内容`;
    if (!examplesValid) return '请完善所有示例的输入和输出内容';
    return '准备保存';
  };
  const systemRef = useRef<HTMLTextAreaElement | null>(null);
  const chinesePromptRef = useRef<HTMLElement | null>(null);

  const adjustSystemHeight = () => {
    const el = systemRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const adjustChinesePromptHeight = () => {
    const el = chinesePromptRef.current;
    if (!el) return;
    // 只有当内容不超过20行时才自动调整高度
    if (getLineCount(formData.content) <= 20) {
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, parseInt(getMinHeight())) + 'px';
    }
  };

  // 处理div placeholder效果
  const updatePlaceholder = () => {
    const el = chinesePromptRef.current;
    if (!el) return;
    const isEmpty = !el.textContent?.trim();
    if (isEmpty && !el.classList.contains('empty-placeholder')) {
      el.classList.add('empty-placeholder');
    } else if (!isEmpty && el.classList.contains('empty-placeholder')) {
      el.classList.remove('empty-placeholder');
    }
  };

  useEffect(() => {
    adjustSystemHeight();
    // adjust when content changes
  }, [formData.systemInstruction]);

  useEffect(() => {
    adjustChinesePromptHeight();
    updatePlaceholder();
    // adjust when content changes
  }, [formData.content]);

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  const getCollapsedHeight = (lineHeight: number = COMPONENT_CONFIG.editor.minLineHeight): string => {
    return `${lineHeight * COMPONENT_CONFIG.editor.maxCollapsedLines}px`;
  };

  const getMinHeight = (lineHeight: number = COMPONENT_CONFIG.editor.minLineHeight): string => {
    return `${lineHeight * COMPONENT_CONFIG.editor.minLines}px`;
  };

  // Reset expansion state when content changes significantly
  useEffect(() => {
    if (getLineCount(formData.content) <= 20) {
      setChinesePromptExpanded(false);
    }
  }, [formData.content]);

  useEffect(() => {
    if (getLineCount(formData.englishPrompt || '') <= 20) {
      setEnglishPromptExpanded(false);
    }
  }, [formData.englishPrompt]);

  // Example management functions
  const addExample = () => {
    const existing = formData.examples || [];
    onFormDataChange({
      ...formData,
      examples: [...existing, { input: '', output: '' }]
    });
  };

  const updateExample = (index: number, field: 'input' | 'output', value: string) => {
    const examples = [...(formData.examples || [])];
    examples[index] = { ...(examples[index] || { input: '', output: '' }), [field]: value };
    onFormDataChange({
      ...formData,
      examples
    });
  };

  const removeExample = (index: number) => {
    const examples = [...(formData.examples || [])];
    examples.splice(index, 1);
    onFormDataChange({
      ...formData,
      examples
    });
  };


  // Adjust height when expansion state changes
  useEffect(() => {
    adjustChinesePromptHeight();
  }, [chinesePromptExpanded]);

  return (
    <div>
      {/* Edit controls: placed inside Edit tab (top-right) */}
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {initialData && onDuplicate && (
            createActionButton(
              onDuplicate,
              <span className="ml-2 hidden sm:inline">复制</span>,
              'ghost',
              false,
              "复制提示词"
            )
          )}
          {createActionButton(
            onCancel,
            '取消',
            'ghost',
            false,
            "取消编辑"
          )}

          <button
            onClick={() => {
              if (!isFormValid) {
                setTitleTouched(true);
                // Scroll to first error field
                const titleInput = document.querySelector('input[type="text"][placeholder*="标题"]') as HTMLInputElement;
                if (titleInput && !titleValid) {
                  titleInput.focus();
                  titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
              }
              onSaveClick && onSaveClick();
            }}
            disabled={!isFormValid}
            className={`${
              isFormValid
                ? buttonVariants.secondary
                : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
            } px-6 py-2.5 text-sm font-semibold relative overflow-hidden group disabled:opacity-50`}
            title={!isFormValid ? getValidationMessage() : "保存更改"}
          >
            <span className="relative z-10 flex items-center gap-2">
              {!isFormValid && <Icons.Error size={14} />}
              {isFormValid && <Icons.Check size={14} />}
              保存
            </span>
          </button>

          <button
            onClick={() => onToggleAutoSave && onToggleAutoSave()}
            disabled={isAutoSaving}
            className={`${autoSaveButtonClass} ${isAutoSaving ? 'animate-pulse' : ''}`}
            title="切换自动保存"
          >
            {isAutoSaveEnabled ? (
              isAutoSaving ? (
                <span className="flex items-center gap-2 ml-1">
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                  保存中...
                </span>
              ) : (
                <span className="flex items-center gap-2 ml-1">
                  <Icons.Check size={14} className="text-green-400" />
                  自动保存：开
                </span>
              )
            ) : (
              <span className="flex items-center gap-2 ml-1">
                <Icons.Close size={14} className="text-gray-400" />
                自动保存：关
              </span>
            )}
          </button>
        </div>
      </div>
        <div className="w-full animate-slide-up-fade">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: PromptMetaPanel (moved left) */}
            <div className="xl:col-span-2 space-y-6">
            {/* Core Information (基础信息) */}
            <div className={cardClass}>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-3 space-y-2">
                  <div className="flex items-center justify-between min-h-[56px]">
                    <h3 className={`${headingClass} ${colors.text.label}`}>
                      基础信息
                    </h3>
                    {/* 自动生成已迁移到侧栏元数据面板 */}
                  </div>
                  {/* Tags moved into left Basic Info (wrapped together with title/description/attributes) */}
                  <div className={`${colors.bg.cardDark} ${colors.border.light} rounded-lg p-2`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                      {/* Tags first row */}
                      <div className="md:col-span-2">
                        <Tags
                          tags={formData.tags || []}
                          tagInput={tagInput || ''}
                          suggestions={tagSuggestions || []}
                          onAddTag={(tag) => {
                            if (!tag) return;
                            onFormDataChange({ ...formData, tags: Array.from(new Set([...(formData.tags || []), tag])) });
                          }}
                          onRemoveTag={(tag) => onFormDataChange({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) })}
                          onInputChange={(v) => onTagInputChange && onTagInputChange(v)}
                          onInputKeyDown={(e) => onTagKeyDown && onTagKeyDown(e)}
                          onSuggestionClick={(tag) => onAddTagFromSuggestion && onAddTagFromSuggestion(tag)}
                          compact={true}
                          onAutoTag={onAutoTag}
                          isTagging={isTagging}
                        />
                      </div>

                      {/* Title and Description side-by-side */}
                      <div>
                        <label className={labelClass}>标题</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={e => onFormDataChange({ ...formData, title: e.target.value })}
                          onBlur={() => setTitleTouched(true)}
                          maxLength={200}
                          className={innerInputClass}
                          placeholder={COMPONENT_CONFIG.placeholders.title}
                          autoFocus={!initialData}
                          aria-invalid={!titleValid && titleTouched}
                        />
                        <div className="flex items-center justify-between mt-1 min-h-[16px]">
                          {!titleValid && titleTouched && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <Icons.Error size={12} />
                              标题为必填，最多 200 字
                            </p>
                          )}
                          {titleValid && titleTouched && (
                            <p className="text-xs text-green-400 flex items-center gap-1">
                              <Icons.Check size={12} />
                              标题格式正确
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>描述</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={e => onFormDataChange({ ...formData, description: e.target.value })}
                          className={innerInputClass}
                          placeholder={COMPONENT_CONFIG.placeholders.description}
                        />
                      </div>

                      {/* Attributes moved from meta panel: render inline across one row on large screens */}
                      <div className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-0">
                          <div className="w-full">
                              <label className={labelClass}>类别</label>
                            <select
                              value={formData.category || ''}
                              onChange={e => onFormDataChange({ ...formData, category: e.target.value })}
                              className={compactSelectClass}
                            >
                              {(allCategories || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={labelClass}>状态</label>
                            <select
                              value={formData.status || 'active'}
                              onChange={e => onFormDataChange({ ...formData, status: e.target.value as PromptStatus })}
                              className={compactSelectClass}
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={labelClass}>输出类型</label>
                            <select value={formData.outputType || ''} onChange={e => onFormDataChange({ ...formData, outputType: (e.target.value as OutputType) || undefined })} className={compactSelectClass}>
                              {COMPONENT_CONFIG.outputTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={labelClass}>应用场景</label>
                            <select value={formData.applicationScene || ''} onChange={e => onFormDataChange({ ...formData, applicationScene: (e.target.value as ApplicationScene) || undefined })} className={compactSelectClass}>
                              {COMPONENT_CONFIG.applicationSceneOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta panel below 基础信息 */}
          <PromptMetaPanel
              formData={formData}
              onFormDataChange={onFormDataChange}
              getTokenCount={getTokenCount}
              onAutoMetadata={onAutoMetadata}
              onAutoTag={onAutoTag}
              isTagging={isTagging}
              tagSuggestions={tagSuggestions}
              tagInput={tagInput}
              onTagInputChange={onTagInputChange}
              onTagKeyDown={onTagKeyDown}
              onAddTagFromSuggestion={onAddTagFromSuggestion}
              allCategories={allCategories}
            />
          </div>

          {/* Right: Main editor (Prompt content, bilingual) */}
          <div className="xl:col-span-1 space-y-6 lg:space-y-8">
            {/* Prompt Section Header - aligned with Basic Info */}
            <div className={`${colors.bg.card} rounded-lg p-4`}>
              <div className="flex items-center justify-between min-h-[56px]">
                <h3 className={`${headingClass} ${colors.text.label}`}>
                  提示词
                </h3>
              </div>
              {/* System Role - moved inside prompt section header, aligned with tags */}
              <div className={`${colors.bg.cardDark} ${colors.border.light} rounded-lg p-2 transition-all ${showSystem ? '' : 'max-h-[56px] overflow-hidden'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`${subheadingClass} text-brand-300`}>
                    <span className={statusIndicator.brand}></span>
                    系统角色
                  </label>
                  <div className="flex items-center gap-2">
                    {createActionButton(
                      () => setShowSystem(s => !s),
                      showSystem ? '收起' : '展开',
                      'ghost',
                      false,
                      showSystem ? 'Collapse' : 'Expand'
                    )}
                    {createLoadingButton(
                      isOptimizingSystem,
                      '优化中...',
                      <><Icons.Sparkles size={12} /> 优化</>,
                      'secondary',
                      !formData.systemInstruction,
                      "优化系统角色"
                    )}
                  </div>
                </div>
                <div style={{ display: showSystem ? undefined : 'none' }}>
                  <textarea
                    ref={(el) => {
                      // keep ref for auto resize
                      if (el) systemRef.current = el;
                    }}
                    value={formData.systemInstruction}
                    onChange={e => onFormDataChange({ ...formData, systemInstruction: e.target.value })}
                    className={`${editorClass} resize-y overflow-hidden`}
                    placeholder="定义AI的角色..."
                    onInput={() => adjustSystemHeight()}
                  />
                </div>
              </div>
            </div>

            {/* Prompt content group (chinese/english prompts) */}
            <div className="space-y-6">
                {/* Chinese Prompt */}
                <div className={`${colors.bg.card} rounded-lg p-6 space-y-4`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className={`${subheadingClass} text-brand-300`}>
                      <span className={statusIndicator.brand}></span>
                      中文提示词
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {createActionButton(
                        () => setIsEditingChinesePrompt(!isEditingChinesePrompt),
                        <><Icons.Edit size={12} /> {isEditingChinesePrompt ? "完成" : "编辑"}</>,
                        'secondary',
                        false,
                        isEditingChinesePrompt ? "完成编辑" : "编辑中文提示词"
                      )}
                      {createLoadingButton(
                        isTranslating,
                        '翻译中...',
                        <><Icons.Edit size={12} /> 翻译</>,
                        'success',
                        !formData.content,
                        "将中文提示词翻译为英文"
                      )}
                      {createLoadingButton(
                        isOptimizingPrompt,
                        '优化中...',
                        <><Icons.Sparkles size={12} /> 优化</>,
                        'primary',
                        !formData.content,
                        "优化提示词内容"
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    {isEditingChinesePrompt ? (
                      <div
                        ref={(el) => {
                          if (el) chinesePromptRef.current = el as unknown as HTMLTextAreaElement;
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          let newContent = target.textContent || '';

                          // 如果内容是placeholder文本，则清空
                          if (newContent === COMPONENT_CONFIG.placeholders.chinesePrompt) {
                            newContent = '';
                          }

                          onFormDataChange({ ...formData, content: newContent });
                          adjustChinesePromptHeight();
                        }}
                        onFocus={(e) => {
                          const target = e.target as HTMLDivElement;
                          if (target.textContent === COMPONENT_CONFIG.placeholders.chinesePrompt) {
                            target.textContent = '';
                          }
                        }}
                        onBlur={(e) => {
                          const target = e.target as HTMLDivElement;
                          if (!target.textContent?.trim()) {
                            target.textContent = COMPONENT_CONFIG.placeholders.chinesePrompt;
                          }
                        }}
                        className={`${editorClass} ${COMPONENT_CONFIG.responsive.padding} leading-relaxed overflow-y-auto ${
                          !formData.content ? 'empty-placeholder' : ''
                        }`}
                        style={{
                          minHeight: getMinHeight()
                        }}
                        data-placeholder={COMPONENT_CONFIG.placeholders.chinesePrompt.replace('\n', '&#10;')}
                        autoFocus
                      >
                        {formData.content || COMPONENT_CONFIG.placeholders.chinesePrompt}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`${editorClass} ${COMPONENT_CONFIG.responsive.padding} leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${
                            getLineCount(formData.content) > 20 && !chinesePromptExpanded
                              ? 'overflow-hidden'
                              : 'overflow-y-auto'
                          }`}
                          style={{
                            height: getLineCount(formData.content) > 20 && !chinesePromptExpanded
                              ? getCollapsedHeight()
                              : 'auto',
                            minHeight: getMinHeight()
                          }}
                        >
                          {formData.content || "点击编辑按钮开始输入中文提示词..."}
                        </div>
                        {getLineCount(formData.content) > COMPONENT_CONFIG.editor.maxCollapsedLines && (
                          <div className="absolute bottom-2 right-2 z-10">
                            {createActionButton(
                              () => setChinesePromptExpanded(!chinesePromptExpanded),
                              chinesePromptExpanded ? '收起' : `展开 (${getLineCount(formData.content)} 行)`,
                              'ghost',
                              false,
                              chinesePromptExpanded ? '收起内容' : '展开完整内容'
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={colors.text.description}>
                        提示：使用{' '}
                        <span className="text-brand-400 font-mono bg-brand-500/15 px-1.5 py-0.5 rounded border border-brand-500/30">
                          {'{变量名}'}
                        </span>{' '}
                        创建动态输入
                      </span>
                      {contentTooLong && (
                        <span className="text-red-400 font-medium">
                          ⚠️ Token 数量过多 ({contentTokenCount})
                        </span>
                      )}
                    </div>
                    <span className={`font-mono ${contentTooLong ? tokenCountClass.warning : tokenCountClass.normal}`}>
                      ~{contentTokenCount} tokens
                    </span>
                  </div>
                </div>

                {/* English Prompt */}
                <div className={`${colors.bg.card} rounded-lg p-6 space-y-4`} style={{ minWidth: '100%' }}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className={`${subheadingClass} text-green-300`}>
                      <span className={statusIndicator.green}></span>
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
                      <span className={`text-xs sm:text-sm ${colors.text.descriptionLight}`}>点击"翻译"生成</span>
                    )}
                  </div>
                  {formData.englishPrompt ? (
                    <div className="relative">
                      <div
                        className={`${editorClass} ${COMPONENT_CONFIG.responsive.padding} colors.text.label leading-relaxed whitespace-pre-wrap custom-scrollbar transition-all ${
                          getLineCount(formData.englishPrompt) > 20 && !englishPromptExpanded
                            ? 'overflow-hidden'
                            : 'overflow-y-auto'
                        }`}
                        style={{
                          height: getLineCount(formData.englishPrompt) > 20 && !englishPromptExpanded
                            ? getCollapsedHeight()
                            : 'auto',
                          minHeight: getMinHeight()
                        }}
                      >
                        {formData.englishPrompt}
                      </div>
                      {getLineCount(formData.englishPrompt) > COMPONENT_CONFIG.editor.maxCollapsedLines && (
                        <div className="absolute bottom-2 right-2 z-10">
                          {createActionButton(
                            () => setEnglishPromptExpanded(!englishPromptExpanded),
                            englishPromptExpanded ? '收起' : `展开 (${getLineCount(formData.englishPrompt)} 行)`,
                            'ghost',
                            false,
                            englishPromptExpanded ? '收起内容' : '展开完整内容'
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={emptyStateClass}>
                      <div className="text-center space-y-2">
                        <div className={iconContainerClass}>
                          <Icons.Edit size={18} className={`w-4 h-4 md:w-5 md:h-5 ${colors.text.description}`} />
                        </div>
                        <p className={`text-xs ${colors.text.description}`}>点击"翻译"按钮生成英文提示词</p>
                      </div>
                    </div>
                  )}
                  {formData.englishPrompt && (
                     <div className={`text-xs sm:text-sm ${colors.text.descriptionLight} flex items-center gap-1.5`}>
                       <span className={colors.text.description}>自动翻译自中文提示词</span>
                    </div>
                  )}

                  {/* 参照示例 - 移至英文提示词下面 */}
                  <div className={`${colors.bg.card} rounded-lg p-6 space-y-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`${headingClass} ${colors.text.label} flex items-center gap-2`}>
                      <Icons.List size={16} />
                      参照示例
                    </h3>
                    {createActionButton(
                      addExample,
                      '添加示例',
                      'primary',
                      false,
                      "添加新的输入输出示例"
                    )}
                  </div>
                  <div className="space-y-4">
                    {(formData.examples || []).length === 0 ? (
                      <div className="text-center py-8">
                        <div className={iconContainerClass}>
                          <Icons.List size={20} className={colors.text.description} />
                        </div>
                        <p className={`text-sm ${colors.text.description}`}>暂无示例</p>
                        <p className={`text-xs ${colors.text.descriptionDark} mt-1`}>点击上方"添加示例"按钮创建示例</p>
                      </div>
                    ) : (
                      (formData.examples || []).map((ex, idx) => (
                        <div key={idx} className={exampleCardClass}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${colors.text.labelMuted}`}>示例 {idx + 1}</span>
                            {createActionButton(
                              () => removeExample(idx),
                              '删除',
                              'danger',
                              false,
                              `删除示例 ${idx + 1}`
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:gap-4 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-2 block">
                                输入 {!ex.input?.trim() && <span className={colors.text.error}>*</span>}
                                {ex.input?.trim() && <span className="text-green-400 ml-1">✓</span>}
                              </label>
                              <input
                                value={ex.input || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExample(idx, 'input', e.target.value)}
                                placeholder="输入示例..."
                                aria-label={`示例 ${idx + 1} 输入`}
                                className={`${formInputClass.base} ${
                                  !ex.input?.trim() ? formInputClass.error : formInputClass.normal
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-green-400/70 uppercase tracking-wider mb-2 block">
                                输出 {!ex.output?.trim() && <span className={colors.text.error}>*</span>}
                                {ex.output?.trim() && <span className="text-green-400 ml-1">✓</span>}
                              </label>
                              <input
                                value={ex.output || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExample(idx, 'output', e.target.value)}
                                placeholder="输出示例..."
                                aria-label={`示例 ${idx + 1} 输出`}
                                className={`${formInputClass.base} ${
                                  !ex.output?.trim() ? formInputClass.error : formInputClass.success
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div> {/* 参照示例结束 */}
              </div> {/* 英文提示词结束 */}
            </div>
          </div>

          {/* Examples and other full-width sections can follow here if needed */}

          {/* Right column now contains the prompt editor (moved from left) */}
        </div>
      </div>

      {/* Footer removed — controls moved to header */}
    </div>
  );
};


