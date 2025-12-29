import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Prompt, PromptFormData, PromptConfig, PromptVersion, SavedRun, Theme } from '../types';
import { Icons } from './Icons';
import { ConfirmDialog } from './ConfirmDialog';
import { CodeSnippetsModal } from './CodeSnippetsModal';
import { PromptShareImage } from './PromptShareImage';
import { PromptExamplesTab } from './promptModal/PromptExamplesTab';
import { PromptTestTab } from './promptModal/PromptTestTab';
import { PromptPreviewTab } from './promptModal/PromptPreviewTab';
import { PromptHistoryTab } from './promptModal/PromptHistoryTab';
import { PromptEditTab } from './promptModal/PromptEditTab';
import { usePromptMetaAndTags } from './promptModal/usePromptMetaAndTags';
import { usePromptExamplesLogic } from './promptModal/usePromptExamplesLogic';
import { runGeminiPromptStream, generateSampleVariables } from '../services/geminiService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData & { savedRuns?: SavedRun[]; lastVariableValues?: Record<string, string> }) => void;
  initialData?: Prompt | null;
  onDuplicate?: (data: PromptFormData) => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
  allCategories: string[];
  allAvailableTags: string[]; // For autocomplete
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentTheme?: Theme; // Current theme for share image
}

const PromptModalComponent: React.FC<PromptModalProps> = ({
  isOpen, onClose, onSave, initialData, onDuplicate, onNotify, allCategories, allAvailableTags,
  onNext, onPrev, hasNext, hasPrev, currentTheme
}) => {
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    englishPrompt: '',
    chinesePrompt: '',
    systemInstruction: '',
    examples: [],
    category: 'Misc',
    tags: [],
    outputType: undefined,
    applicationScene: undefined,
    technicalTags: [],
    styleTags: [],
    customLabels: [],
    previewMediaUrl: '',
    source: '',
    sourceAuthor: '',
    sourceUrl: '',
    recommendedModels: [],
    usageNotes: '',
    cautions: '',
    isFavorite: false,
    status: 'active',
    config: {
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      maxOutputTokens: 2000,
      topP: 0.95,
      topK: 64
    }
  });

  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);

  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isOptimizingSystem, setIsOptimizingSystem] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoMeta, setIsAutoMeta] = useState(false);


  type TabKey = 'preview' | 'edit' | 'examples' | 'test' | 'history';
  const [activeTab, setActiveTab] = useState<TabKey>('preview');
  const [previewMode, setPreviewMode] = useState<'raw' | 'interpolated'>('raw');
  const [shareMode, setShareMode] = useState(false); // Zen mode for screenshots

  const [copiedPreview, setCopiedPreview] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const formAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const hasInitializedTabRef = useRef(false); // 防止自动保存时重置标签页

  const [showSnippets, setShowSnippets] = useState(false);

  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // 状态快照机制：用于异常恢复和数据一致性保障
  const [lastStableSnapshot, setLastStableSnapshot] = useState<PromptFormData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 安全的保存函数，确保使用最新的状态
  const safeSave = useCallback((additionalData?: any) => {
    try {
      const dataToSave = {
        ...(formData as any),
        id: initialData?.id,
        savedRuns,
        lastVariableValues: variableValues,
        ...additionalData
      };
      onSave(dataToSave);

      // 成功保存后创建快照，用于异常恢复
      setLastStableSnapshot({ ...formData });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('保存失败:', error);
      onNotify?.('保存失败，请稍后重试', 'error');
    }
  }, [formData, initialData?.id, savedRuns, variableValues, onSave, onNotify]);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [autoFillingIndex, setAutoFillingIndex] = useState<number | null>(null);


  const tabSequence = useMemo<TabKey[]>(
    () => (initialData ? ['preview', 'edit', 'examples', 'test', 'history'] : ['preview', 'edit', 'examples', 'test']),
    [initialData]
  );

  // AbortController for canceling API requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track previous content to sync with chinesePrompt
  const prevContentRef = useRef<string>('');

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });

  const getTokenCount = (text: string) => Math.ceil(text.length / 4);

  const {
    handleAutoMetadata,
    handleOptimizePrompt,
    handleOptimizeSystem,
    handleAutoTag,
    handleTranslateToEnglish,
  } = usePromptMetaAndTags({
    formData,
    setFormData,
    savedRuns,
    onNotify,
    isOpen,
    setIsAutoMeta,
    setIsOptimizingPrompt,
    setIsOptimizingSystem,
    setIsTagging,
    setIsTranslating,
  });

  // Keep a global snapshot of current formData for debug helpers (used by PromptMetaPanel)
  useEffect(() => {
    try {
      (window as any).__lastFormDataSnapshot = formData;
    } catch (e) {
      // ignore in non-browser envs
    }
  }, [formData]);


  const {
    handleAddExample,
    handleUpdateExample,
    handleRemoveExample,
    handleClearExamples,
    handleGenerateExamplesWithModel,
    handleGenerateIterativeExample,
    handleAutoFillExampleOutput,
    handleExportExamples,
    handleImportExamples,
    handleSaveToHistory,
    handleLoadFromHistory,
    getHistoryList,
    handleSelectDirectory,
  } = usePromptExamplesLogic({
    formData,
    setFormData,
    onNotify,
    setIsGeneratingExamples,
    setAutoFillingIndex,
  });


  // Sorted runs by rating (good first) then timestamp
  const sortedRuns = useMemo(() => {
    return [...savedRuns].sort((a, b) => {
      if (a.rating === 'good' && b.rating !== 'good') return -1;
      if (a.rating !== 'good' && b.rating === 'good') return 1;
      return b.timestamp - a.timestamp;
    });
  }, [savedRuns]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        content: initialData.content,
        englishPrompt: initialData.englishPrompt || initialData.content,
        chinesePrompt: initialData.chinesePrompt || '',
        systemInstruction: initialData.systemInstruction || '',
        examples: Array.isArray(initialData.examples)
          ? initialData.examples.filter((ex: any) =>
            ex &&
            typeof ex === 'object' &&
            typeof ex.input === 'string' &&
            typeof ex.output === 'string'
          )
          : [],
        category: initialData.category,
        tags: initialData.tags,
        outputType: initialData.outputType,
        applicationScene: initialData.applicationScene,
        technicalTags: initialData.technicalTags || [],
        styleTags: initialData.styleTags || [],
        customLabels: initialData.customLabels || [],
        previewMediaUrl: initialData.previewMediaUrl || '',
        source: initialData.source || '',
        sourceAuthor: initialData.sourceAuthor || '',
        sourceUrl: initialData.sourceUrl || '',
        recommendedModels: initialData.recommendedModels || [],
        usageNotes: initialData.usageNotes || '',
        cautions: initialData.cautions || '',
        // 修复：加载extracted字段，确保智能补全结果不会丢失
        extracted: initialData.extracted || undefined,
        isFavorite: initialData.isFavorite,
        status: initialData.status || 'active',
        config: initialData.config || {
          model: 'gemini-3-flash-preview',
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 64
        }
      });
      // 确保 savedRuns 被正确加载
      setSavedRuns(Array.isArray(initialData.savedRuns) ? initialData.savedRuns : []);
      setVariableValues(initialData.lastVariableValues || {});
      prevContentRef.current = initialData.content;
      // 只在首次初始化时设置默认标签页，避免自动保存时重置用户选择
      if (!hasInitializedTabRef.current) {
        setActiveTab('preview');
        hasInitializedTabRef.current = true;
      }
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        englishPrompt: '',
        chinesePrompt: '',
        systemInstruction: '',
        examples: [],
        category: 'Code',
        tags: [],
        outputType: undefined,
        applicationScene: undefined,
        technicalTags: [],
        styleTags: [],
        customLabels: [],
        previewMediaUrl: '',
        source: '',
        sourceAuthor: '',
        sourceUrl: '',
        recommendedModels: [],
        usageNotes: '',
        cautions: '',
        isFavorite: false,
        config: {
          model: 'gemini-3-flash-preview',
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 64
        }
      });
      setSavedRuns([]);
      setVariableValues({});
      prevContentRef.current = '';
      // 只在首次初始化时设置默认标签页，避免自动保存时重置用户选择
      if (!hasInitializedTabRef.current) {
        setActiveTab('edit');
        hasInitializedTabRef.current = true;
      }
    }
    setTestResult(null);
    setPreviewMode('raw');
    setShareMode(false);
  }, [initialData, isOpen]);

  // 当modal关闭时重置标签页初始化状态，为下次打开做准备
  useEffect(() => {
    if (!isOpen) {
      hasInitializedTabRef.current = false;
    }
  }, [isOpen]);

  // 检测未保存更改和异常恢复机制
  useEffect(() => {
    if (lastStableSnapshot && isOpen) {
      // 深度比较当前状态和最后稳定快照
      const hasChanges = JSON.stringify({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        systemInstruction: formData.systemInstruction,
        examples: formData.examples,
        extracted: formData.extracted,
        tags: formData.tags,
        category: formData.category,
        outputType: formData.outputType,
        applicationScene: formData.applicationScene,
        technicalTags: formData.technicalTags,
        styleTags: formData.styleTags,
        customLabels: formData.customLabels,
        usageNotes: formData.usageNotes,
        cautions: formData.cautions,
        recommendedModels: formData.recommendedModels,
        config: formData.config,
      }) !== JSON.stringify({
        title: lastStableSnapshot.title,
        description: lastStableSnapshot.description,
        content: lastStableSnapshot.content,
        systemInstruction: lastStableSnapshot.systemInstruction,
        examples: lastStableSnapshot.examples,
        extracted: lastStableSnapshot.extracted,
        tags: lastStableSnapshot.tags,
        category: lastStableSnapshot.category,
        outputType: lastStableSnapshot.outputType,
        applicationScene: lastStableSnapshot.applicationScene,
        technicalTags: lastStableSnapshot.technicalTags,
        styleTags: lastStableSnapshot.styleTags,
        customLabels: lastStableSnapshot.customLabels,
        usageNotes: lastStableSnapshot.usageNotes,
        cautions: lastStableSnapshot.cautions,
        recommendedModels: lastStableSnapshot.recommendedModels,
        config: lastStableSnapshot.config,
      });

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, lastStableSnapshot, isOpen]);

  // 异常检测和自动恢复机制
  useEffect(() => {
    if (!isOpen) return;

    // 检测可能的异常情况：如果formData为空或不完整，可能发生了状态丢失
    const isFormDataValid = formData && formData.title !== undefined && formData.content !== undefined;

    if (!isFormDataValid && lastStableSnapshot && initialData) {
      console.warn('检测到状态异常，尝试从快照恢复');
      // 从快照恢复，但保留一些可能的用户输入
      setFormData(prev => ({
        ...lastStableSnapshot!,
        // 保留当前可能正在编辑的内容（如果有的话）
        title: prev.title || lastStableSnapshot!.title,
        content: prev.content || lastStableSnapshot!.content,
      }));
      onNotify?.('检测到数据异常，已从上次保存状态恢复', 'info');
    }
  }, [formData, lastStableSnapshot, initialData, isOpen, onNotify]);

  // 自动保存 formData（包括 examples）的 debounce 机制，增加竞态条件防护
  const autoSaveFormDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // 只有在编辑现有 prompt 时才自动保存
    if (!initialData || !isOpen || !isAutoSaveEnabled) return;

    // 如果没有未保存的更改，不需要自动保存
    if (!hasUnsavedChanges) return;

    // 清除之前的定时器
    if (autoSaveFormDataTimeoutRef.current) {
      clearTimeout(autoSaveFormDataTimeoutRef.current);
    }

    // 延迟 2 秒自动保存，避免频繁保存和竞态条件
    autoSaveFormDataTimeoutRef.current = setTimeout(() => {
      try {
        // 再次检查是否有未保存的更改（防止在延迟期间已被手动保存）
        if (hasUnsavedChanges) {
          const dataToSave = {
            ...(formData as any),
            id: initialData?.id,
            savedRuns,
            lastVariableValues: variableValues
          };
          onSave(dataToSave);
          // 自动保存成功后更新快照
          setLastStableSnapshot({ ...formData });
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('自动保存失败:', error);
      }
    }, 2000); // 增加延迟时间，避免竞态条件

    return () => {
      if (autoSaveFormDataTimeoutRef.current) {
        clearTimeout(autoSaveFormDataTimeoutRef.current);
      }
    };
  }, [
    JSON.stringify(formData.examples), // 使用 JSON.stringify 来深度比较
    formData.content,
    formData.systemInstruction,
    JSON.stringify(formData.config),
    JSON.stringify(formData.extracted || {}), // ensure metadata changes trigger autosave
    isOpen,
    initialData?.id, // 只依赖 id，避免对象引用变化
    JSON.stringify(savedRuns),
    JSON.stringify(variableValues),
    hasUnsavedChanges, // 只有在有未保存更改时才自动保存
    isAutoSaveEnabled // 只有启用自动保存时才工作
  ]);

  // Cleanup: Cancel any ongoing requests when modal closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const target = e.target as HTMLElement | null;
      const isFormField = target && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(target.tagName)
      );
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        safeSave();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (activeTab === 'test') {
          e.preventDefault();
          handleRunGeminiStream();
        }
      }
      if (e.key === 'Escape') {
        if (showSnippets) setShowSnippets(false);
        else if (shareMode) setShareMode(false);
        else onClose();
      }
      // Navigation shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev?.();
      }
      if (e.key === 'Tab' && !isFormField) {
        e.preventDefault();
        const currentIndex = tabSequence.indexOf(activeTab as typeof tabSequence[number]);
        if (currentIndex !== -1) {
          const direction = e.shiftKey ? -1 : 1;
          const nextIndex = (currentIndex + direction + tabSequence.length) % tabSequence.length;
          setActiveTab(tabSequence[nextIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, activeTab, showSnippets, savedRuns, variableValues, hasNext, hasPrev, onNext, onPrev, shareMode, tabSequence]);

  // Sync content to chinesePrompt when content changes
  useEffect(() => {
    // Only sync if content changed and chinesePrompt is empty or matches previous content
    // This prevents overwriting manually set chinesePrompt
    if (formData.content !== prevContentRef.current) {
      const prevContent = prevContentRef.current;
      setFormData(prev => {
        // Only update if chinesePrompt is empty or was synced from previous content
        if (!prev.chinesePrompt || prev.chinesePrompt === prevContent) {
          return { ...prev, chinesePrompt: formData.content };
        }
        return prev;
      });
      prevContentRef.current = formData.content;
    }
  }, [formData.content]);

  // Autosave: debounce saves to onSave without closing the modal
  useEffect(() => {
    if (!isOpen) return;
    // skip initial mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    // do not autosave if title is empty
    if (!formData.title || formData.title.trim() === '') return;
    if (!isAutoSaveEnabled) return;

    if (formAutoSaveTimeoutRef.current) clearTimeout(formAutoSaveTimeoutRef.current);
    formAutoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const dataToSave = {
          ...(formData as any),
          id: initialData?.id,
          savedRuns,
          lastVariableValues: variableValues
        };
        await onSave(dataToSave);
      } catch (e) {
        console.error('Auto-save failed', e);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1500);

    return () => {
      if (formAutoSaveTimeoutRef.current) {
        clearTimeout(formAutoSaveTimeoutRef.current);
        formAutoSaveTimeoutRef.current = null;
      }
    };
  }, [formData, savedRuns, variableValues, isOpen, onSave]);

  // Variable Detection with validation
  useEffect(() => {
    const textsToScan = [
      formData.content,
      formData.systemInstruction,
      ...(formData.examples?.map(e => e.input) || [])
    ];
    const combinedText = textsToScan.join(' ');

    // Improved regex: matches {variable} but rejects nested braces like {var{inner}}
    // This regex ensures no nested braces are captured
    const matches = combinedText.matchAll(/\{([^{}]+)\}/g);
    const vars = Array.from(matches, m => m[1]);

    // Validate variable names: no nested braces, no empty, alphanumeric + underscore + dash
    const validVars = vars
      .filter(v => {
        const trimmed = v.trim();
        // Reject if contains braces (nested)
        if (trimmed.includes('{') || trimmed.includes('}')) {
          return false;
        }
        // Reject if empty
        if (trimmed === '') {
          return false;
        }
        // Optional: validate format (alphanumeric, underscore, dash, space allowed)
        // This is permissive but prevents obvious errors
        return trimmed.length > 0;
      })
      .map(v => v.trim());

    const uniqueVars = Array.from(new Set(validVars));
    setDetectedVariables(uniqueVars);
  }, [formData.content, formData.systemInstruction, formData.examples]);

  // Tag Autocomplete Logic
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };
  const addTag = (tagName: string) => {
    if (tagName.trim() && !formData.tags.includes(tagName.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagName.trim()] }));
      setTagInput('');
      setTagSuggestions([]);
    }
  };
  // Tag Autocomplete
  useEffect(() => {
    if (tagInput.trim()) {
      const lowerInput = tagInput.toLowerCase();
      const filtered = allAvailableTags.filter(t => t.toLowerCase().includes(lowerInput) && !formData.tags.includes(t));
      setTagSuggestions(filtered.slice(0, 5));
    } else { setTagSuggestions([]); }
  }, [tagInput, allAvailableTags, formData.tags]);
  const handleConfigChange = (key: keyof PromptConfig, value: any) => {
    setFormData(prev => ({ ...prev, config: { ...prev.config!, [key]: value } }));
  };

  const getCompiledText = (text: string) => {
    let result = text;
    detectedVariables.forEach(v => {
      if (variableValues[v]) {
        result = result.split(`{${v}}`).join(variableValues[v]);
      }
    });
    return result;
  }

  const getCompiledPrompt = () => getCompiledText(formData.content);
  const getCompiledSystemInstruction = () => formData.systemInstruction ? getCompiledText(formData.systemInstruction) : undefined;
  const getCompiledExamples = () => formData.examples?.map(ex => ({ input: getCompiledText(ex.input), output: ex.output }));

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  const handleRunGeminiStream = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsTesting(true);
    setTestResult("");
    const promptToSend = getCompiledPrompt();
    const systemToSend = getCompiledSystemInstruction();
    const examplesToSend = getCompiledExamples();

    if (!promptToSend) {
      setIsTesting(false);
      if (onNotify) onNotify("Prompt is empty!", "error");
      return;
    }

    try {
      const stream = runGeminiPromptStream(promptToSend, {
        model: formData.config?.model,
        temperature: formData.config?.temperature,
        maxOutputTokens: formData.config?.maxOutputTokens,
        topP: formData.config?.topP,
        topK: formData.config?.topK,
        systemInstruction: systemToSend,
        examples: examplesToSend,
        signal: abortController.signal
      });
      for await (const chunk of stream) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        if (chunk.startsWith("Error:") || chunk.startsWith("\n[Error:")) {
          if (onNotify) onNotify(chunk.trim(), "error");
        }
        setTestResult(prev => {
          const newResult = (prev || "") + chunk;
          // 每1000字符自动保存一次断点（如果当前有断点标记）
          if (newResult.length % 1000 === 0 && newResult.length > 0) {
            // 延迟保存，避免频繁更新
            setTimeout(() => {
              const checkpointRun = savedRuns.find(r => r.isCheckpoint && r.id.startsWith('checkpoint-'));
              if (checkpointRun) {
                const updatedRuns = savedRuns.map(r =>
                  r.id === checkpointRun.id
                    ? { ...r, partialOutput: newResult, checkpoint: String(newResult.length) }
                    : r
                );
                setSavedRuns(updatedRuns);
                safeSave({ savedRuns: updatedRuns });
              }
            }, 500);
          }
          return newResult;
        });
      }
    } catch (e) {
      // Don't report error if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setTestResult(prev => (prev || "") + `\n[Error executing stream: ${errorMsg}]`);
      if (onNotify) onNotify(`Execution failed: ${errorMsg}`, "error");
    } finally {
      if (!abortController.signal.aborted) {
        setIsTesting(false);
      }
      abortControllerRef.current = null;
    }
  };

  // 自动保存：当有输出时自动保存（延迟保存，避免频繁保存）
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (testResult && !isTesting && testResult.length > 50) {
      // 延迟5秒自动保存（避免在生成过程中保存）
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        // 检查是否已存在相同的自动保存记录（基于输出内容的前100字符）
        const outputHash = testResult.substring(0, 100);
        const existingAuto = savedRuns.find(r =>
          r.id.startsWith('auto-') &&
          r.output.substring(0, 100) === outputHash
        );
        if (!existingAuto) {
          const autoRun: SavedRun = {
            id: `auto-${Date.now()}`,
            timestamp: Date.now(),
            model: formData.config?.model || 'unknown',
            inputValues: { ...variableValues },
            output: testResult,
            name: `Auto-saved ${new Date().toLocaleTimeString()}`,
            config: formData.config,
          };
          setSavedRuns(prev => {
            const updatedRuns = [autoRun, ...prev.filter(r => !r.id.startsWith('auto-'))].slice(0, 30);
            safeSave({ savedRuns: updatedRuns });
            return updatedRuns;
          });
        }
      }, 5000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [testResult, isTesting, variableValues, formData.config, savedRuns, setSavedRuns, onSave, formData]);

  const handleSaveRun = (name?: string, description?: string, isCheckpoint: boolean = false) => {
    if (!testResult) return;
    const newRun: SavedRun = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      model: formData.config?.model || 'unknown',
      inputValues: { ...variableValues },
      output: testResult,
      name: name || `Test Case ${savedRuns.length + 1}`,
      description,
      isCheckpoint,
      config: formData.config,
    };
    const updatedRuns = [newRun, ...savedRuns].slice(0, 50); // 增加到50个
    setSavedRuns(updatedRuns);
    safeSave({ savedRuns: updatedRuns });
    if (onNotify) onNotify(`Test case "${newRun.name}" saved`, "success");
  };

  const handleRateRun = (runId: string, rating: 'good' | 'bad') => {
    const updatedRuns = savedRuns.map(r => r.id === runId ? { ...r, rating } : r);
    setSavedRuns(updatedRuns);
    safeSave({ savedRuns: updatedRuns });
  };

  const handleLoadRun = (run: SavedRun) => {
    setVariableValues(run.inputValues);
    setTestResult(run.output);
    // 如果保存了配置，恢复配置
    if (run.config) {
      setFormData(prev => ({ ...prev, config: run.config }));
    }
    if (onNotify) onNotify(`Loaded test case: ${run.name || 'Untitled'}`, "success");
  };

  // 从历史状态自动导入（打开modal时）
  useEffect(() => {
    if (initialData?.savedRuns && initialData.savedRuns.length > 0 && !testResult) {
      // 自动加载最后一个标记为"good"的运行，或最后一个运行
      const goodRun = initialData.savedRuns.find(r => r.rating === 'good');
      const lastRun = goodRun || initialData.savedRuns[0];
      if (lastRun && activeTab === 'test') {
        // 延迟加载，避免干扰用户
        setTimeout(() => {
          handleLoadRun(lastRun);
        }, 500);
      }
    }
  }, [initialData, activeTab]);

  // 断点续跑：从断点继续生成
  const handleResumeFromCheckpoint = async (run: SavedRun) => {
    if (!run.checkpoint && !run.partialOutput) {
      if (onNotify) onNotify("This run doesn't have a checkpoint", "info");
      return;
    }

    setIsTesting(true);
    setTestResult(run.partialOutput || run.output);

    try {
      const promptToSend = getCompiledPrompt();
      const systemToSend = getCompiledSystemInstruction();
      const examplesToSend = getCompiledExamples();

      if (!promptToSend) {
        setIsTesting(false);
        if (onNotify) onNotify("Prompt is empty!", "error");
        return;
      }

      // 创建续跑提示：基于已有输出继续生成
      const resumePrompt = `${promptToSend}\n\n[Continue from previous output]\n${run.partialOutput || run.output}`;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const stream = runGeminiPromptStream(resumePrompt, {
        model: formData.config?.model || run.config?.model,
        temperature: formData.config?.temperature ?? run.config?.temperature ?? 0.7,
        maxOutputTokens: formData.config?.maxOutputTokens ?? run.config?.maxOutputTokens ?? 2000,
        topP: formData.config?.topP ?? run.config?.topP,
        topK: formData.config?.topK ?? run.config?.topK,
        systemInstruction: systemToSend,
        examples: examplesToSend,
        signal: abortController.signal
      });

      let continuedOutput = run.partialOutput || run.output;
      for await (const chunk of stream) {
        if (abortController.signal.aborted) return;
        if (chunk.startsWith("Error:") || chunk.startsWith("\n[Error:")) {
          if (onNotify) onNotify(chunk.trim(), "error");
        }
        continuedOutput += chunk;
        setTestResult(continuedOutput);
      }

      // 更新断点
      setSavedRuns(prev => {
        const updatedRuns = prev.map(r =>
          r.id === run.id
            ? { ...r, partialOutput: continuedOutput, checkpoint: String(continuedOutput.length) }
            : r
        );
        safeSave({ savedRuns: updatedRuns });
        return updatedRuns;
      });

      if (onNotify) onNotify("Resumed from checkpoint successfully", "success");
    } catch (e) {
      if (abortControllerRef.current?.signal.aborted) return;
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      if (onNotify) onNotify(`Resume failed: ${errorMsg}`, "error");
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsTesting(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleDeleteRun = (runId: string) => {
    const updatedRuns = savedRuns.filter(r => r.id !== runId);
    setSavedRuns(updatedRuns);
    safeSave({ savedRuns: updatedRuns });
  };

  const handleMagicFill = async () => {
    if (detectedVariables.length === 0) { if (onNotify) onNotify("No variables.", "info"); return; }
    setIsFilling(true);
    try {
      // Magic Fill is an assistive feature – keep a tighter timeout to avoid long hangs.
      const vals = await generateSampleVariables(formData.content, detectedVariables, 15000);
      setVariableValues(prev => ({ ...prev, ...vals }));
      if (onNotify) onNotify("Filled!", "success");
    } catch (error: any) { if (onNotify) onNotify(error.message, "error"); } finally { setIsFilling(false); }
  };
  const handleCopyRawPrompt = () => {
    const text = previewMode === 'interpolated' ? getCompiledPrompt() : formData.content;
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleCopyEnglishPrompt = () => {
    if (!formData.englishPrompt) {
      onNotify?.('No English prompt defined yet', 'info');
      return;
    }
    navigator.clipboard.writeText(formData.englishPrompt);
    onNotify?.('English prompt copied', 'success');
  };

  const handleCopyChinesePrompt = () => {
    if (!formData.chinesePrompt) {
      onNotify?.('尚未配置中文提示词', 'info');
      return;
    }
    navigator.clipboard.writeText(formData.chinesePrompt);
    onNotify?.('中文提示词已复制', 'success');
  };

  const handleCopySystemInstruction = () => {
    if (!formData.systemInstruction) {
      onNotify?.('尚未配置系统提示词', 'info');
      return;
    }
    navigator.clipboard.writeText(formData.systemInstruction);
    onNotify?.('系统提示词已复制', 'success');
  };


  const handleDuplicate = () => { onDuplicate?.(formData); onClose(); };
  const handleRestoreVersion = (version: PromptVersion) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Version',
      message: `Restore this version from ${new Date(version.timestamp).toLocaleString()}? Current changes will be lost.`,
      type: 'warning',
      onConfirm: () => {
        setFormData(prev => ({ ...prev, content: version.content, systemInstruction: version.systemInstruction || '', examples: version.examples || [], config: version.config || prev.config, title: version.title }));
        setActiveTab('edit');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (!isOpen) return null;

  if (shareMode && currentTheme) {
    return (
      <PromptShareImage
        data={formData}
        theme={currentTheme}
        onClose={() => setShareMode(false)}
        previewMode={previewMode}
        getCompiledPrompt={getCompiledPrompt}
        onNotify={onNotify}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md p-2 sm:p-3 md:p-4 animate-fade-in transition-all" data-modal-overlay>
      <div className="w-full max-w-[180vw] md:max-w-[calc(180vw-280px)] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1400px] rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] shadow-xl flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] relative animate-slide-up-fade text-[var(--color-text-primary)] mt-2 md:mt-4 overflow-y-auto custom-scrollbar" data-modal-panel>
        {/* Header：简化为纯色条，减少视觉干扰 */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 lg:px-6 py-4 sm:py-6 md:py-8 border-b border-[var(--color-border-primary)] shrink-0 bg-[var(--color-bg-secondary)] z-10 relative" data-modal-header>
          <div className="flex items-center gap-3 sm:gap-4 max-w-full">
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev} disabled={!hasPrev}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 border border-transparent hover:border-white/10 relative group/btn overflow-hidden"
                title="Previous Prompt (Cmd+Left)"
              >
                <Icons.Trend className="rotate-[-90deg] relative z-10" size={18} />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={onNext} disabled={!hasNext}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 border border-transparent hover:border-white/10 relative group/btn overflow-hidden"
                title="Next Prompt (Cmd+Right)"
              >
                <Icons.Trend className="rotate-90deg relative z-10" size={18} />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
            {initialData ? (
              <div className="flex flex-col min-w-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight line-clamp-1 max-w-[320px] sm:max-w-[420px] lg:max-w-[560px]">{formData.title}</h2>
                <span className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-mono opacity-80">ID: {initialData.id.slice(0, 8)}...</span>
              </div>
            ) : (
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight">New Prompt</h2>
            )}
          </div>

          {/* 重新设计的工具栏 - 更协调的视觉层次 */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">

            {/* 状态指示器组 - 更突出更明显的未保存状态 */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-red-500/20 border border-orange-400/40 rounded-lg text-sm text-orange-100 font-semibold shadow-xl backdrop-blur-sm animate-pulse ring-2 ring-orange-400/30">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-ping shadow-orange-400/70 shadow-[0_0_12px] ring-2 ring-orange-400/50"></div>
                <span className="text-orange-50 drop-shadow-sm">有未保存更改</span>
                <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse"></div>
              </div>
            )}

            {/* 辅助工具组 - 统一的玻璃态设计 */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md shadow-lg">
              <button
                onClick={() => setShareMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="分享卡片"
              >
                <Icons.Image size={16} />
                <span className="hidden sm:inline">分享</span>
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
              <button
                onClick={() => setShowSnippets(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="生成代码片段"
              >
                <Icons.Code size={16} />
                <span className="hidden sm:inline">代码</span>
              </button>
            </div>

            {/* 主导航标签组 - 优化移动端体验 */}
            <div
              className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-1 backdrop-blur-md shadow-lg overflow-x-auto custom-scrollbar scrollbar-thin"
              role="tablist"
              aria-label="Prompt 编辑标签页"
            >
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap sm:px-3 sm:gap-2 ${
                  activeTab === 'preview'
                    ? 'bg-gradient-to-r from-blue-500/25 to-cyan-500/25 text-white shadow-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40 font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] font-medium'
                  }`}
                role="tab"
                aria-selected={activeTab === 'preview'}
                aria-controls="preview-panel"
                title="预览模式"
              >
                <Icons.Eye size={16} />
                <span className="hidden sm:inline">预览</span>
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap sm:px-3 sm:gap-2 ${
                  activeTab === 'edit'
                    ? 'bg-gradient-to-r from-emerald-500/25 to-green-500/25 text-white shadow-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/40 font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] font-medium'
                  }`}
                role="tab"
                aria-selected={activeTab === 'edit'}
                aria-controls="edit-panel"
                title="编辑模式"
              >
                <Icons.Edit size={16} />
                <span className="hidden sm:inline">编辑</span>
              </button>
              <button
                onClick={() => setActiveTab('examples')}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap sm:px-3 sm:gap-2 ${
                  activeTab === 'examples'
                    ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-white shadow-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.2)] border border-purple-500/40 font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] font-medium'
                  }`}
                role="tab"
                aria-selected={activeTab === 'examples'}
                aria-controls="examples-panel"
                title="示例管理"
              >
                <Icons.List size={16} />
                <span className="hidden sm:inline">示例</span>
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap sm:px-3 sm:gap-2 ${
                  activeTab === 'test'
                    ? 'bg-gradient-to-r from-brand-500/30 to-brand-600/30 text-white shadow-brand-500/40 shadow-[0_0_25px_rgba(var(--c-brand),0.4)] border border-brand-500/50 font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] font-medium'
                  }`}
                role="tab"
                aria-selected={activeTab === 'test'}
                aria-controls="test-panel"
                title="测试运行"
              >
                <Icons.Run size={16} />
                <span className="hidden sm:inline">运行</span>
              </button>
              {initialData && (
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap sm:px-3 sm:gap-2 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-[var(--color-brand-primary)]/25 to-[var(--color-brand-secondary)]/25 text-[var(--color-text-primary)] shadow-[var(--color-brand-primary)]/30 shadow-[0_0_20px_var(--color-brand-primary)] border border-[var(--color-brand-primary)]/40 font-bold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] font-medium'
                  }`}
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  aria-controls="history-panel"
                  title="版本历史"
                >
                  <Icons.History size={16} />
                  <span className="hidden sm:inline">历史</span>
                </button>
              )}
            </div>

            {/* 关闭按钮 - 更现代的设计 */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-200 hover:text-white rounded-xl hover:bg-red-500/10 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-transparent hover:border-red-500/20 backdrop-blur-sm"
              title="关闭对话框"
            >
              <Icons.Close size={18} />
              <span className="hidden sm:inline">关闭</span>
            </button>
          </div>
        </div>

        {/* Enhanced Content Area: 左列主内容 + 右列元数据（响应式） */}
        <div className="flex-1 min-h-0" data-modal-body>
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left column: 主内容（95%宽度） */}
            <div className="w-[95%] min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 custom-scrollbar bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
              {activeTab === 'preview' && (
                <PromptPreviewTab
                  formData={formData}
                  previewMode={previewMode}
                  onPreviewModeChange={setPreviewMode}
                  detectedVariables={detectedVariables}
                  variableValues={variableValues}
                  isFilling={isFilling}
                  copiedPreview={copiedPreview}
                  onCopyRawPrompt={handleCopyRawPrompt}
                  onCopyEnglishPrompt={handleCopyEnglishPrompt}
                  onCopyChinesePrompt={handleCopyChinesePrompt}
                  onCopySystemInstruction={handleCopySystemInstruction}
                  onMagicFill={handleMagicFill}
                  onVariableChange={handleVariableChange}
                  onSetActiveTab={setActiveTab}
                />
              )}

              {/* ... other tabs ... */}
              {activeTab === 'examples' && (
                <PromptExamplesTab
                  examples={formData.examples || []}
                  isGeneratingExamples={isGeneratingExamples}
                  autoFillingIndex={autoFillingIndex}
                  onGenerateExamples={handleGenerateExamplesWithModel}
                  onGenerateIterative={handleGenerateIterativeExample}
                  onAddExample={handleAddExample}
                  onClearExamples={handleClearExamples}
                  onRemoveExample={handleRemoveExample}
                  onUpdateExample={handleUpdateExample}
                  onAutoFillOutput={handleAutoFillExampleOutput}
                  onExportExamples={handleExportExamples}
                  onImportExamples={handleImportExamples}
                  onSaveToHistory={handleSaveToHistory}
                  onLoadFromHistory={handleLoadFromHistory}
                  getHistoryList={getHistoryList}
                  onSelectDirectory={handleSelectDirectory}
                />
              )}

              {/* TEST TAB - Enhanced */}
              {activeTab === 'test' && (
                <PromptTestTab
                  config={formData.config || undefined}
                  detectedVariables={detectedVariables}
                  variableValues={variableValues}
                  testResult={testResult}
                  isTesting={isTesting}
                  isFilling={isFilling}
                  sortedRuns={sortedRuns}
                  onConfigChange={handleConfigChange}
                  onVariableChange={handleVariableChange}
                  onMagicFill={handleMagicFill}
                  onRun={handleRunGeminiStream}
                  onSaveRun={handleSaveRun}
                  onLoadRun={handleLoadRun}
                  onRateRun={handleRateRun}
                  onDeleteRun={handleDeleteRun}
                  onResumeFromCheckpoint={handleResumeFromCheckpoint}
                />
              )}

              {activeTab === 'history' && initialData && (
                <PromptHistoryTab
                  initialData={initialData}
                  getTokenCount={getTokenCount}
                  onRestoreVersion={handleRestoreVersion}
                />
              )}

              {activeTab === 'edit' && (
                <PromptEditTab
                  formData={formData}
                  initialData={initialData || undefined}
                  allCategories={allCategories}
                  tagInput={tagInput}
                  tagSuggestions={tagSuggestions}
                  isAutoMeta={isAutoMeta}
                  isOptimizingSystem={isOptimizingSystem}
                  isTranslating={isTranslating}
                  isOptimizingPrompt={isOptimizingPrompt}
                  isTagging={isTagging}
                  onFormDataChange={setFormData}
                  onAutoMetadata={handleAutoMetadata}
                  onOptimizeSystem={handleOptimizeSystem}
                  onTranslateToEnglish={handleTranslateToEnglish}
                  onOptimizePrompt={handleOptimizePrompt}
                  onAutoTag={handleAutoTag}
                  onTagInputChange={setTagInput}
                  onTagKeyDown={handleAddTag}
                  onAddTagFromSuggestion={addTag}
                  getTokenCount={getTokenCount}
                  onDuplicate={initialData ? handleDuplicate : undefined}
                  onCancel={onClose}
                  onSaveClick={() => {
        safeSave({ config: formData.config || {} });
                    onClose();
                  }}
                  isAutoSaving={isAutoSaving}
                  isAutoSaveEnabled={isAutoSaveEnabled}
                  onToggleAutoSave={() => setIsAutoSaveEnabled(v => !v)}
                />
              )}
            </div>

            {/* Right column removed per design decision (metadata moved/removed) */}
          </div>
        </div>

        {/* Code Snippets Overlay */}
        <CodeSnippetsModal
          isOpen={showSnippets}
          onClose={() => setShowSnippets(false)}
          rawPrompt={formData.content}
          systemInstruction={formData.systemInstruction}
          examples={formData.examples}
          config={formData.config!}
          detectedVariables={detectedVariables}
          variableValues={variableValues}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};

export const PromptModal = React.memo(PromptModalComponent);