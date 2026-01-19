import { useCallback } from 'react';
import {
  PromptFormData,
  Category,
  OutputType,
  ApplicationScene,
  SavedRun,
} from '../../types';
import { optimizePromptContent, generateTags, translatePromptToEnglish, generatePromptMetadata, generateTitleAndDescription, generateRoleIdentity, generateEvaluation } from '../../services/geminiService';
import * as groqService from '../../services/groqService';
import { sendAuditEvent } from '../../services/auditService';

type NotifyFn = (message: string, type: 'success' | 'info' | 'error') => void;

interface UsePromptMetaAndTagsParams {
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
  savedRuns: SavedRun[];
  onNotify?: NotifyFn;
  isOpen: boolean;
  setIsAutoMeta: (v: boolean) => void;
  setIsOptimizingPrompt: (v: boolean) => void;
  setIsOptimizingSystem: (v: boolean) => void;
  setIsTagging: (v: boolean) => void;
  setIsTranslating: (v: boolean) => void;
}

export const usePromptMetaAndTags = ({
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
}: UsePromptMetaAndTagsParams) => {
  const handleAutoMetadata = useCallback(async (options?: any) => {
    // debug instrumentation removed
    // If caller specifically requests only role or evaluation, run a focused generation and return result
    const provider = options?.provider || (typeof window !== 'undefined' ? (localStorage.getItem('prompt_model_provider') || 'auto') : 'auto');
    const model = options?.model || (typeof window !== 'undefined' ? (localStorage.getItem('prompt_model_name') || '') : '');

    // Debug logging to help diagnose provider issues
    console.log('Auto metadata provider:', provider, 'model:', model);

    // Check if there's content to work with for specific targets
    if (options && (options.target === 'role' || options.target === 'evaluation')) {
      if (!formData.content && !formData.title && !formData.description) {
        onNotify?.('请先完善提示词内容或标题，再自动生成元信息。', 'info');
        return;
      }
    }

    if (options && options.target === 'role') {
      try {
        let role: string | undefined;
        if (provider === 'groq') {
          role = await groqService.generateRoleIdentityGroq(formData.title, formData.description, formData.content);
        } else {
          role = await generateRoleIdentity(formData.title, formData.description, formData.content);
        }
        setFormData(prev => ({ ...prev, extracted: { ...(prev.extracted || {}), role } }));
        return role;
      } catch (err) {
        console.error('generateRoleIdentity error:', err);
        onNotify?.('智能补全失败，请稍后重试。', 'error');
        return;
      }
    }

    if (options && options.target === 'evaluation') {
      try {
        let evaluation: string | undefined;
        if (provider === 'groq') {
          evaluation = await groqService.generateEvaluationGroq(formData.title, formData.description, formData.content);
        } else {
          evaluation = await generateEvaluation(formData.title, formData.description, formData.content);
        }
        setFormData(prev => ({ ...prev, extracted: { ...(prev.extracted || {}), evaluation } }));
        return evaluation;
      } catch (err) {
        console.error('generateEvaluation error:', err);
        onNotify?.('智能补全失败，请稍后重试。', 'error');
        return;
      }
    }
    if (!formData.content && !formData.title && !formData.description) {
      onNotify?.('请先完善提示词内容或标题，再自动生成元信息。', 'info');
      return;
    }

    setIsAutoMeta(true);
    // notify runtime used to UI (if provided via params)
    try {
      if ((typeof window !== 'undefined') && window.dispatchEvent && provider) {
        window.dispatchEvent(new CustomEvent('prompt_runtime_used', { detail: { provider, model } }));
      }
    } catch {}
    try {
      const baseText = `${formData.title}\n${formData.description}\n${formData.content}`.trim();

      // 1. Try model-based metadata generation first (JSON mode in service layer)
      try {
        let parsed: any;
        if (provider === 'groq') {
          // User explicitly selected Groq
          parsed = await groqService.generatePromptMetadataGroq(formData.title, formData.description, formData.content);
        } else if (provider === 'auto') {
          // Auto mode: try Groq first (faster and cheaper), then Gemini
          try {
            if (groqService.isApiKeyAvailable()) {
              parsed = await groqService.generatePromptMetadataGroq(formData.title, formData.description, formData.content);
            } else {
              throw new Error('Groq API key not available');
            }
          } catch (groqError) {
            console.log('Groq not available or failed, falling back to Gemini:', groqError);
            parsed = await generatePromptMetadata(
              formData.title,
              formData.description,
              formData.content,
              model || undefined
            );
          }
        } else {
          // Explicitly selected Gemini or other provider
          parsed = await generatePromptMetadata(
            formData.title,
            formData.description,
            formData.content,
            model || undefined
          );
        }
        // debug instrumentation removed

        // attempt to fill role and evaluation if model didn't return them
        let roleFromModel: string | undefined = undefined;
        let evaluationFromModel: string | undefined = undefined;
        console.log('Parsed data has role:', !!(parsed as any).role, 'evaluation:', !!(parsed as any).evaluation); // Debug log
        try {
          if (!(parsed as any).role) {
            console.log('Generating role using', provider === 'groq' || (provider === 'auto' && groqService.isApiKeyAvailable()) ? 'Groq' : 'Gemini'); // Debug log
            if (provider === 'groq' || (provider === 'auto' && groqService.isApiKeyAvailable())) {
              roleFromModel = await groqService.generateRoleIdentityGroq(formData.title, formData.description, formData.content);
            } else {
              roleFromModel = await generateRoleIdentity(formData.title, formData.description, formData.content);
            }
            console.log('Generated role:', roleFromModel); // Debug log
          } else {
            roleFromModel = (parsed as any).role;
            console.log('Using role from parsed data:', roleFromModel); // Debug log
          }
        } catch (e) {
          console.warn('generateRoleIdentity failed:', e);
        }
        try {
          if (!(parsed as any).evaluation) {
            console.log('Generating evaluation using', provider === 'groq' || (provider === 'auto' && groqService.isApiKeyAvailable()) ? 'Groq' : 'Gemini'); // Debug log
            if (provider === 'groq' || (provider === 'auto' && groqService.isApiKeyAvailable())) {
              evaluationFromModel = await groqService.generateEvaluationGroq(formData.title, formData.description, formData.content);
            } else {
              evaluationFromModel = await generateEvaluation(formData.title, formData.description, formData.content);
            }
            console.log('Generated evaluation:', evaluationFromModel); // Debug log
          } else {
            evaluationFromModel = (parsed as any).evaluation;
            console.log('Using evaluation from parsed data:', evaluationFromModel); // Debug log
          }
        } catch (e) {
          console.warn('generateEvaluation failed:', e);
        }

        // debug instrumentation removed
        setFormData(prev => ({
          ...prev,
          category: (parsed.category as Category) || prev.category,
          outputType: (parsed.outputType as OutputType) || prev.outputType,
          applicationScene: (parsed.applicationScene as ApplicationScene) || prev.applicationScene,
          usageNotes: parsed.usageNotes || prev.usageNotes,
          cautions: parsed.cautions || prev.cautions,
          recommendedModels:
            parsed.recommendedModels && parsed.recommendedModels.length > 0
              ? parsed.recommendedModels
              : prev.recommendedModels && prev.recommendedModels.length > 0
              ? prev.recommendedModels
              : ['gemini-3-flash-preview'],
          // Inject extracted perspective fields if provided by model
          extracted: {
            intent: (parsed as any).intent || (prev.extracted && prev.extracted.intent) || undefined,
            audience: (parsed as any).audience || (prev.extracted && prev.extracted.audience) || undefined,
            constraints: (parsed as any).constraints || (prev.extracted && prev.extracted.constraints) || undefined,
            evaluation: evaluationFromModel !== undefined ? evaluationFromModel : (prev.extracted && (prev.extracted as any).evaluation) || undefined,
            role: roleFromModel !== undefined ? roleFromModel : (prev.extracted && (prev.extracted as any).role) || undefined,
          },
          // Include examples if model returned them
          examples: (parsed as any).examples && Array.isArray((parsed as any).examples) ? (parsed as any).examples : prev.examples,
        }));

        // Audit event (non-blocking) - include prompt snapshot and truncated parsed output for traceability
        try {
          const parsedText = (() => {
            try { return JSON.stringify(parsed); } catch { return String(parsed || ''); }
          })();
          const parsedSnippet = parsedText.length > 2000 ? parsedText.slice(0, 2000) + '...[truncated]' : parsedText;
          const snapshot = {
            title: formData.title,
            description: formData.description,
            contentSnippet: (formData.content || '').slice(0, 2000),
            config: formData.config || {}
          };
          const evPayload = {
            type: 'auto_metadata',
            provider,
            model: model || undefined,
            title: formData.title,
            promptId: (formData as any).id || null,
            parsedKeys: Object.keys(parsed || {}),
            parsedSnippet,
            snapshot,
          };
          sendAuditEvent(evPayload);
          // record recent model usage
          try {
            const recent = JSON.parse(localStorage.getItem('recent_models') || '[]');
            const m = model || (formData.config && (formData.config.model || formData.config.modelName)) || null;
            if (m) {
              const uniq = [m, ...recent.filter((x: string) => x !== m)].slice(0, 10);
              localStorage.setItem('recent_models', JSON.stringify(uniq));
            }
          } catch {}
          // send audit
          // backward-compatible call:
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          evPayload;
        } catch {}

        onNotify?.('已使用模型根据提示词内容自动生成元信息，你可以继续微调。', 'success');
        return;
      } catch (modelError) {
        console.warn('Auto metadata via model failed, falling back to heuristic.', modelError);
        onNotify?.('元信息服务暂时繁忙，已自动使用本地规则生成元信息。', 'info');
        // fall through to heuristic logic
      }

      // 2. Fallback: 轻量启发式推断（保持兼容）
      const text = baseText.toLowerCase();

      // 推断类别
      let inferredCategory: Category = formData.category;
      if (!formData.category || formData.category === 'Misc') {
        if (text.includes('code') || text.includes('代码') || text.includes('bug') || text.includes('重构')) {
          inferredCategory = 'Code';
        } else if (text.includes('写作') || text.includes('文案') || text.includes('copy') || text.includes('社交媒体')) {
          inferredCategory = 'Writing';
        } else if (text.includes('idea') || text.includes('创意') || text.includes('点子')) {
          inferredCategory = 'Ideas';
        } else if (text.includes('分析') || text.includes('report') || text.includes('summary')) {
          inferredCategory = 'Analysis';
        } else if (text.includes('有趣') || text.includes('搞笑') || text.includes('fun')) {
          inferredCategory = 'Fun';
        } else {
          inferredCategory = 'Misc';
        }
      }

      // 推断输出类型
      let inferredOutputType = formData.outputType;
      if (!inferredOutputType) {
        if (text.includes('图片') || text.includes('image') || text.includes('banner')) inferredOutputType = 'image' as any;
        else if (text.includes('视频') || text.includes('video')) inferredOutputType = 'video' as any;
        else if (text.includes('音频') || text.includes('audio') || text.includes('播客')) inferredOutputType = 'audio' as any;
        else inferredOutputType = 'text' as any;
      }

      // 推断应用场景
      let inferredScene = formData.applicationScene;
      if (!inferredScene) {
        if (text.includes('角色') || text.includes('persona')) inferredScene = '角色设计' as any;
        else if (text.includes('场景') || text.includes('scene')) inferredScene = '场景生成' as any;
        else if (text.includes('风格') || text.includes('style')) inferredScene = '风格转换' as any;
        else if (text.includes('故事') || text.includes('story')) inferredScene = '故事创作' as any;
        else if (text.includes('工具') || text.includes('tool') || text.includes('工作流')) inferredScene = '工具使用' as any;
        else inferredScene = '其他' as any;
      }

      const usageNotes =
        formData.usageNotes ||
        '按照上方「提示词内容」直接粘贴到模型输入中使用，可结合标签与场景根据需要微调。';
      const cautions =
        formData.cautions ||
        '使用前请根据你的具体业务场景检查示例和变量是否合理，避免泄露敏感信息。';

      const recommendedModels =
        formData.recommendedModels && formData.recommendedModels.length > 0
          ? formData.recommendedModels
          : ['gemini-2.5-flash'];

      // Heuristic extraction for prompt-perspective (intent / audience / constraints)
      const inferredIntent =
        formData.title && formData.title.trim().length > 0
          ? formData.title.trim()
          : (formData.description && formData.description.split(/[\.\n]/)[0]) ||
            (formData.content && formData.content.split(/[\.\n]/)[0]) ||
            '';

      const audienceKeywords = ['初学者','新手','专家','资深','经理','产品','学生','研究员','developer','engineer','designer','manager','pm','beginner','expert'];
      const lower = baseText.toLowerCase();
      let inferredAudience = '';
      for (const kw of audienceKeywords) {
        if (baseText.includes(kw) || lower.includes(kw.toLowerCase())) {
          inferredAudience = kw;
          break;
        }
      }

      // Simple constraint extraction from Chinese '不超过 X 字' or '避免...' patterns, fallback empty
      const constraintMatches = [];
      try {
        const zhMatches = baseText.match(/不超过\\s*\\d+字?|避免[^，。\\n\\r]*/g);
        if (zhMatches) constraintMatches.push(...zhMatches.map(s => s.trim()));
      } catch (e) {}
      try {
        const enMatches = baseText.match(/avoid\\s+[^,\\.\\n\\r]*/gi);
        if (enMatches) constraintMatches.push(...enMatches.map(s => s.trim()));
      } catch (e) {}

      const inferredConstraints = constraintMatches.length > 0 ? constraintMatches : undefined;

      setFormData(prev => ({
        ...prev,
        category: inferredCategory,
        outputType: inferredOutputType,
        applicationScene: inferredScene,
        usageNotes,
        cautions,
        recommendedModels,
        extracted: {
          intent: inferredIntent || (prev.extracted && prev.extracted.intent) || undefined,
          audience: inferredAudience || (prev.extracted && prev.extracted.audience) || undefined,
          constraints: inferredConstraints || (prev.extracted && prev.extracted.constraints) || undefined,
        },
      }));

      onNotify?.('已根据提示词内容自动生成元信息，你可以继续微调。', 'success');
    } catch (error) {
      console.error('handleAutoMetadata error:', error);
      onNotify?.('自动生成元信息时出错，请稍后重试。', 'error');
    } finally {
      setIsAutoMeta(false);
    }
  }, [formData, onNotify, setFormData, setIsAutoMeta]);

  const handleOptimizePrompt = useCallback(async () => {
    if (!formData.content) return;
    setIsOptimizingPrompt(true);
    try {
      const goodRuns = savedRuns.filter(r => r.rating === 'good');
      const optimized = await optimizePromptContent(formData.content, 'prompt', goodRuns);
      setFormData(prev => ({ ...prev, content: optimized }));
      onNotify?.('Prompt optimized successfully!', 'success');
    } catch (error: any) {
      onNotify?.(error.message || 'Failed to optimize prompt', 'error');
    } finally {
      setIsOptimizingPrompt(false);
    }
  }, [formData.content, onNotify, savedRuns, setFormData, setIsOptimizingPrompt]);

  const handleOptimizeSystem = useCallback(async () => {
    if (!formData.systemInstruction) return;
    setIsOptimizingSystem(true);
    try {
      const goodRuns = savedRuns.filter(r => r.rating === 'good');
      const optimized = await optimizePromptContent(formData.systemInstruction, 'system', goodRuns);
      if (isOpen) {
        setFormData(prev => ({ ...prev, systemInstruction: optimized }));
        onNotify?.('System instruction optimized!', 'success');
      }
    } catch (error: any) {
      if (isOpen) {
        onNotify?.(error.message || 'Failed to optimize system', 'error');
      }
    } finally {
      if (isOpen) {
        setIsOptimizingSystem(false);
      }
    }
  }, [formData.systemInstruction, isOpen, onNotify, savedRuns, setFormData, setIsOptimizingSystem]);

  const handleAutoTag = useCallback(async () => {
    if (!formData.content) {
      onNotify?.('Add content first.', 'info');
      return;
    }
    setIsTagging(true);
    try {
      // Generate Chinese tags
      const tags = await generateTags(formData.title, formData.description, formData.content);
      if (tags.length > 0) {
        setFormData(prev => ({ ...prev, tags: [...new Set([...formData.tags, ...tags])] }));
        onNotify?.(`Added ${tags.length} tags!`, 'success');
      } else {
        onNotify?.('No relevant tags found.', 'info');
      }
      // If title/description missing, try to generate from content (Chinese)
      if ((!formData.title || formData.title.trim() === '') || (!formData.description || formData.description.trim() === '')) {
        try {
          const generated = await generateTitleAndDescription(formData.content);
          setFormData(prev => ({
            ...prev,
            title: prev.title && prev.title.trim().length > 0 ? prev.title : (generated.title || prev.title),
            description: prev.description && prev.description.trim().length > 0 ? prev.description : (generated.description || prev.description),
          }));
          onNotify?.('已根据提示词内容自动填充标题和描述（中文）。', 'success');
        } catch (e) {
          console.warn('Title/Description generation failed', e);
        }
      }
    } catch (error: any) {
      console.error('Auto Tag Error:', error);
      onNotify?.(error.message || '自动标记失败，请重试', 'error');
    } finally {
      setIsTagging(false);
    }
  }, [formData.content, formData.description, formData.tags, formData.title, onNotify, setFormData, setIsTagging]);

  const handleTranslateToEnglish = useCallback(async () => {
    if (!formData.content || formData.content.trim().length === 0) {
      onNotify?.('请先输入中文提示词', 'info');
      return;
    }
    setIsTranslating(true);
    try {
      const englishPrompt = await translatePromptToEnglish(formData.content);
      setFormData(prev => ({ ...prev, englishPrompt }));
      onNotify?.('翻译完成！英文提示词已自动保存', 'success');
    } catch (error: any) {
      console.error('Translation Error:', error);
      onNotify?.(error.message || '翻译失败，请重试', 'error');
    } finally {
      setIsTranslating(false);
    }
  }, [formData.content, onNotify, setFormData, setIsTranslating]);

  return {
    handleAutoMetadata,
    handleOptimizePrompt,
    handleOptimizeSystem,
    handleAutoTag,
    handleTranslateToEnglish,
  };
};


