import React, { useState, useRef, useEffect } from 'react';
import { Prompt, PromptFormData, PromptStatus, OutputType, ApplicationScene } from '../../types';
import { Icons } from '../Icons';
import PromptMetaPanel from './PromptMetaPanel';
// PromptMetaPanel: right-side metadata column
import Tags from '../ui/Tags';
import {
  buttonVariants,
  editorClass,
  colors,
  // 新增的统一样式
  formInputClass,
  emptyStateClass,
  iconContainerClass,
  exampleCardClass,
  // 新增的区域统一样式系统
  SECTION_STYLES
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
        {/* 优化按钮组 - 移动端友好 */}
        <div className="flex justify-end mb-4">
          {/* 桌面端：水平排列 */}
          <div className="hidden sm:flex items-center gap-2">
            {initialData && onDuplicate && (
              <button
                onClick={onDuplicate}
                className={SECTION_STYLES.buttons.secondary}
                title="复制提示词"
              >
                <Icons.Copy size={SECTION_STYLES.icons.action.size} />
                <span>复制</span>
              </button>
            )}
            {/* 取消按钮 - 次级操作 */}
            <button
              onClick={onCancel}
              className={SECTION_STYLES.buttons.secondary}
              title="取消编辑"
            >
              取消
            </button>

            {/* 保存按钮 - 主要操作，最大最突出 */}
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
                ? SECTION_STYLES.buttons.primary
                : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25 border border-red-500/30 rounded-lg px-6 py-2.5 text-sm font-semibold relative overflow-hidden group disabled:opacity-50 transition-all duration-200'
            }`}
            title={!isFormValid ? getValidationMessage() : "保存更改"}
          >
            <span className="relative z-10 flex items-center gap-2">
              {!isFormValid && <Icons.Error size={SECTION_STYLES.icons.status.size} />}
              {isFormValid && <Icons.Check size={SECTION_STYLES.icons.status.size} />}
              保存
            </span>
          </button>

          {/* 自动保存开关组件 - 优化版 */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${SECTION_STYLES.content.fieldLabelColor}`}>自动保存</span>
            <button
              onClick={() => onToggleAutoSave && onToggleAutoSave()}
              disabled={isAutoSaving}
              className={`${SECTION_STYLES.buttons.toggle} ${
                isAutoSaveEnabled ? SECTION_STYLES.buttons.toggleOn : SECTION_STYLES.buttons.toggleOff
              } ${isAutoSaving ? 'animate-pulse' : ''}`}
              title={isAutoSaveEnabled ? '关闭自动保存' : '开启自动保存'}
            >
              <span
                className={`${SECTION_STYLES.buttons.toggleThumb} ${
                  isAutoSaveEnabled ? SECTION_STYLES.buttons.toggleThumbOn : SECTION_STYLES.buttons.toggleThumbOff
                }`}
              />
              {/* 加载状态指示器 */}
              {isAutoSaving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
            {/* 紧凑的状态指示文字 */}
            <div className="flex items-center gap-1">
              <div className={`${SECTION_STYLES.status.indicator} ${
                isAutoSaving ? SECTION_STYLES.status.variants.loading :
                isAutoSaveEnabled ? SECTION_STYLES.status.variants.success : 'bg-gray-400'
              }`}></div>
              <span className={`${SECTION_STYLES.status.text} ${
                isAutoSaving ? SECTION_STYLES.status.textVariants.loading :
                isAutoSaveEnabled ? SECTION_STYLES.status.textVariants.success : SECTION_STYLES.status.textVariants.muted
              }`}>
                {isAutoSaving ? '保存中' : (isAutoSaveEnabled ? '已开启' : '已关闭')}
              </span>
            </div>
          </div>

          {/* 移动端：垂直排列，全宽按钮 */}
          <div className="flex flex-col gap-2 sm:hidden w-full max-w-xs mx-auto">
            {/* 保存按钮 - 移动端置顶，主要操作 */}
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
                // 添加保存成功的视觉反馈
                setTimeout(() => {
                  const button = document.activeElement as HTMLButtonElement;
                  if (button && button.textContent?.includes('保存')) {
                    button.classList.add('animate-pulse', 'bg-green-500/20', 'border-green-500/40');
                    setTimeout(() => {
                      button.classList.remove('animate-pulse', 'bg-green-500/20', 'border-green-500/40');
                    }, 1000);
                  }
                }, 100);
              }}
              disabled={!isFormValid}
              className={`${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400/90 hover:to-blue-500/90 text-white border-blue-400/50 hover:border-blue-300/70 shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                  : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
              } w-full py-3 text-sm font-semibold border rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:transform-none relative overflow-hidden group`}
              title={!isFormValid ? getValidationMessage() : "保存更改"}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {!isFormValid && <Icons.Error size={16} />}
                {isFormValid && <Icons.Check size={16} />}
                保存
              </span>
            </button>

            {/* 次级操作按钮组 */}
            <div className="flex gap-2">
              {initialData && onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/20 hover:border-gray-600/40 rounded-lg transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-1.5"
                  title="复制提示词"
                >
                  <Icons.Copy size={14} />
                  <span>复制</span>
                </button>
              )}
              {/* 取消按钮 */}
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 text-sm font-medium text-gray-300 hover:text-gray-100 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all duration-200 transform active:scale-95"
                title="取消编辑"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
        <div className="w-full animate-slide-up-fade">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Left: PromptMetaPanel (moved left) */}
            <div className="xl:col-span-1 space-y-6">
            {/* Core Information (基础信息) */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.basic} ${SECTION_STYLES.container.padding} ${SECTION_STYLES.container.spacing}`}>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between min-h-[56px]">
                    <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-2 mb-0`}>
                      <div className={`w-2 h-2 rounded-full ${SECTION_STYLES.icons.indicator.variants.gray}`}></div>
                      基础信息
                    </h3>
                    {/* 自动生成已迁移到侧栏元数据面板 */}
                  </div>
                  {/* Tags moved into left Basic Info (wrapped together with title/description/attributes) */}
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3">
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
                        <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>标题</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={e => onFormDataChange({ ...formData, title: e.target.value })}
                          onBlur={() => setTitleTouched(true)}
                          maxLength={200}
                          className={SECTION_STYLES.content.input}
                          placeholder={COMPONENT_CONFIG.placeholders.title}
                          autoFocus={!initialData}
                          aria-invalid={!titleValid && titleTouched}
                        />
                        <div className="flex items-center justify-between mt-1 min-h-[16px]">
                          {!titleValid && titleTouched && (
                            <p className={`${SECTION_STYLES.content.fieldDescription} ${SECTION_STYLES.status.textVariants.error} flex items-center gap-1`}>
                              <Icons.Error size={SECTION_STYLES.icons.status.size} />
                              标题为必填，最多 200 字
                            </p>
                          )}
                          {titleValid && titleTouched && (
                            <p className={`${SECTION_STYLES.content.fieldDescription} ${SECTION_STYLES.status.textVariants.success} flex items-center gap-1`}>
                              <Icons.Check size={SECTION_STYLES.icons.status.size} />
                              标题格式正确
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>描述</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={e => onFormDataChange({ ...formData, description: e.target.value })}
                          className={SECTION_STYLES.content.input}
                          placeholder={COMPONENT_CONFIG.placeholders.description}
                        />
                      </div>

                      {/* Attributes moved from meta panel: render inline across one row on large screens */}
                      <div className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-0">
                          <div className="w-full">
                              <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>类别</label>
                            <select
                              value={formData.category || ''}
                              onChange={e => onFormDataChange({ ...formData, category: e.target.value })}
                              className={SECTION_STYLES.content.select}
                            >
                              {(allCategories || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>状态</label>
                            <select
                              value={formData.status || 'active'}
                              onChange={e => onFormDataChange({ ...formData, status: e.target.value as PromptStatus })}
                              className={SECTION_STYLES.content.select}
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>输出类型</label>
                            <select value={formData.outputType || ''} onChange={e => onFormDataChange({ ...formData, outputType: (e.target.value as OutputType) || undefined })} className={SECTION_STYLES.content.select}>
                              {COMPONENT_CONFIG.outputTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full">
                            <label className={`${SECTION_STYLES.content.fieldLabel} ${SECTION_STYLES.content.fieldLabelColor}`}>应用场景</label>
                            <select value={formData.applicationScene || ''} onChange={e => onFormDataChange({ ...formData, applicationScene: (e.target.value as ApplicationScene) || undefined })} className={SECTION_STYLES.content.select}>
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
          <div className="xl:col-span-1 space-y-6">
            {/* Prompt Section Header - aligned with Basic Info */}
            <div className={`${SECTION_STYLES.container.base} ${SECTION_STYLES.container.accent.prompt} ${SECTION_STYLES.container.padding}`}>
              <div className="flex items-center justify-between min-h-[56px]">
                <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-2 mb-0`}>
                  <div className={`w-2 h-2 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue}`}></div>
                  提示词
                </h3>
              </div>
              {/* System Role - moved inside prompt section header, aligned with tags */}
              <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 sm:p-4 transition-all border-l-4 border-l-blue-400/50 ${showSystem ? '' : 'max-h-[56px] overflow-hidden'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`${SECTION_STYLES.content.subsectionTitle} text-blue-300 flex items-center gap-2 mb-0`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue}`}></div>
                    系统角色
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSystem(s => !s)}
                      className={SECTION_STYLES.buttons.secondary}
                      title={showSystem ? '收起' : '展开'}
                    >
                      {showSystem ? '收起' : '展开'}
                    </button>
                    <button
                      onClick={() => onOptimizeSystem && onOptimizeSystem()}
                      disabled={isOptimizingSystem || !formData.systemInstruction}
                      className={`${SECTION_STYLES.buttons.secondary} ${
                        isOptimizingSystem
                          ? 'bg-[var(--color-brand-primary)]/30 text-[var(--color-text-primary)] border-[var(--color-brand-primary)]/40 animate-pulse'
                          : 'bg-[var(--color-brand-primary)]/20 text-[var(--color-text-primary)] border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/30'
                      }`}
                      title="优化系统角色"
                    >
                      {isOptimizingSystem ? (
                        <>优化中...</>
                      ) : (
                        <><Icons.Sparkles size={SECTION_STYLES.icons.action.size} className="inline mr-1" /> 优化</>
                      )}
                    </button>
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

              {/* Chinese Prompt */}
              <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 sm:p-4 transition-all border-l-4 border-l-blue-400/50 mt-6`}>
                <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                  <label className={`${SECTION_STYLES.content.subsectionTitle} text-blue-300 flex items-center gap-2 mb-0`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.blue}`}></div>
                    中文提示词
                  </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setIsEditingChinesePrompt(!isEditingChinesePrompt)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 hover:border-gray-500/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                          title={isEditingChinesePrompt ? "完成编辑" : "编辑中文提示词"}
                        >
                          <Icons.Edit size={12} className="inline mr-1" />
                          {isEditingChinesePrompt ? "完成" : "编辑"}
                        </button>
                        <button
                          onClick={() => onTranslateToEnglish && onTranslateToEnglish()}
                          disabled={isTranslating || !formData.content}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${
                            isTranslating
                              ? 'bg-green-500/30 text-green-200 border-green-400/40 animate-pulse'
                              : 'bg-green-500/20 text-green-200 border-green-500/30 hover:bg-green-500/30'
                          }`}
                          title="将中文提示词翻译为英文"
                        >
                          {isTranslating ? (
                            <>翻译中...</>
                          ) : (
                            <><Icons.Edit size={12} className="inline mr-1" /> 翻译</>
                          )}
                        </button>
                        <button
                          onClick={() => onOptimizePrompt && onOptimizePrompt()}
                          disabled={isOptimizingPrompt || !formData.content}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${
                            isOptimizingPrompt
                              ? 'bg-blue-500/30 text-blue-200 border-blue-400/40 animate-pulse'
                              : 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white border-blue-400/50 hover:border-blue-300/70 shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                          }`}
                          title="优化提示词内容"
                        >
                          {isOptimizingPrompt ? (
                            <>优化中...</>
                          ) : (
                            <><Icons.Sparkles size={12} className="inline mr-1" /> 优化</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative bg-gray-950/40 border border-white/10 rounded-lg p-3">
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
                            <button
                              onClick={() => setChinesePromptExpanded(!chinesePromptExpanded)}
                              className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/30 hover:border-gray-600/50 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                              title={chinesePromptExpanded ? '收起内容' : '展开完整内容'}
                            >
                              {chinesePromptExpanded ? '收起' : `展开 (${getLineCount(formData.content)} 行)`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              {/* English Prompt */}
              <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 sm:p-4 transition-all border-l-4 border-l-green-400/50 mt-6`}>
                <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                  <label className={`${SECTION_STYLES.content.subsectionTitle} text-green-300 flex items-center gap-2 mb-0`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${SECTION_STYLES.icons.indicator.variants.green}`}></div>
                    英文提示词
                    {formData.englishPrompt && <span className="text-xs text-green-400/70 font-normal normal-case">(自动翻译)</span>}
                  </label>
                    {formData.englishPrompt ? (
                      <button
                        onClick={() => navigator.clipboard.writeText(formData.englishPrompt || '')}
                        className={SECTION_STYLES.buttons.secondary}
                        title="复制英文提示词"
                      >
                        <Icons.Copy size={12} className="inline mr-1" />
                        复制
                      </button>
                    ) : (
                      <span className={`${SECTION_STYLES.status.text} ${SECTION_STYLES.status.textVariants.muted}`}>点击"翻译"生成</span>
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
                          <button
                            onClick={() => setEnglishPromptExpanded(!englishPromptExpanded)}
                            className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/30 hover:border-gray-600/50 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                            title={englishPromptExpanded ? '收起内容' : '展开完整内容'}
                          >
                            {englishPromptExpanded ? '收起' : `展开 (${getLineCount(formData.englishPrompt)} 行)`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={emptyStateClass}>
                      <div className="text-center space-y-2">
                        <div className={iconContainerClass}>
                          <Icons.Edit size={18} className={`w-4 h-4 md:w-5 md:h-5 ${colors.text.description}`} />
                        </div>
                        <p className={`${SECTION_STYLES.content.fieldDescription} ${SECTION_STYLES.content.fieldDescriptionColor}`}>点击"翻译"按钮生成英文提示词</p>
                      </div>
                    </div>
                  )}
                </div>

              {/* 参照示例 - 重新设计的布局 */}
              <div className="mt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${SECTION_STYLES.icons.indicator.variants.purple} shadow-purple-400/50 shadow-[0_0_8px]`}></div>
                      <h3 className={`${SECTION_STYLES.content.sectionTitle} ${SECTION_STYLES.content.sectionTitleColor} flex items-center gap-2 mb-0`}>
                        <Icons.List size={SECTION_STYLES.icons.section.size} className="inline mr-2" />
                        参照示例
                      </h3>
                    </div>
                    {/* 添加示例按钮 */}
                    <button
                      onClick={addExample}
                      className={`${SECTION_STYLES.buttons.primary} bg-gradient-to-r from-purple-500/80 to-purple-600/80 hover:from-purple-400/90 hover:to-purple-500/90 border-purple-400/50 hover:border-purple-300/70 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 min-h-[40px] w-full sm:w-auto justify-center`}
                      title="添加新的输入输出示例"
                    >
                      <Icons.Plus size={SECTION_STYLES.icons.action.size} />
                      添加示例
                    </button>
                  </div>
                  {/* 示例内容区域 */}
                  <div className="space-y-4">
                    {(formData.examples || []).length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className={`${SECTION_STYLES.container.base} w-16 h-16 mx-auto rounded-full flex items-center justify-center border border-[var(--color-border-accent)] mb-4`}>
                          <Icons.List size={SECTION_STYLES.icons.section.size + 8} className={`${SECTION_STYLES.content.fieldLabelColor}`} />
                        </div>
                        <h4 className={`text-base font-medium ${SECTION_STYLES.content.fieldLabelColor} mb-2`}>暂无示例</h4>
                        <p className={`${SECTION_STYLES.content.fieldDescription} text-[var(--color-text-muted)] leading-relaxed max-w-sm mx-auto`}>
                          示例可以帮助AI更好地理解您的提示词意图。<br />
                          点击上方"添加示例"按钮创建第一个示例。
                        </p>
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
            </div>
          </div>

          {/* Examples and other full-width sections can follow here if needed */}

          {/* Right column now contains the prompt editor (moved from left) */}
        </div>
      </div>
    </div>

      {/* Footer removed — controls moved to header */}
    </div>
  );
};


