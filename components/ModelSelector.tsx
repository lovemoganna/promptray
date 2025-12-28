import React, { useState, useEffect } from 'react';
import { getModelsForProvider, ProviderKey, clearModelCache } from '../services/modelRegistry';
import { Icons } from './Icons';
import { isGeminiApiKeyAvailable } from '../geminiConfig';

interface ModelSelectorProps {
  value: {
    provider: string;
    model: string;
  };
  onChange: (value: { provider: string; model: string }) => void;
  className?: string;
  disabled?: boolean;
  lastRuntime?: {
    provider?: string;
    model?: string;
  };
}

interface ModelOption {
  provider: string;
  model: string;
  displayName: string;
  providerDisplayName: string;
  // Enhanced information
  speed?: 'ultra-fast' | 'fast' | 'normal' | 'slow';
  quality?: 'excellent' | 'good' | 'standard';
  cost?: 'free' | 'low' | 'medium' | 'high';
  useCases?: string[];
  description?: string;
  contextWindow?: number;
  features?: string[];
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  'auto': 'Auto（Google → Groq）',
  'gemini': 'Google Gemini',
  'groq': 'Groq / OpenAI OSS',
  'openai': 'OpenAI'
};


// API Key availability checker
const checkApiKeyAvailability = (provider: ProviderKey): boolean => {
  switch (provider) {
    case 'gemini':
      return isGeminiApiKeyAvailable();
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
};

// Cache for model details to improve performance
const modelDetailsCache = new Map<string, Partial<ModelOption>>();

// Enhanced model information database with caching
const getModelDetails = (provider: string, model: string): Partial<ModelOption> => {
  const cacheKey = `${provider}-${model}`;

  // Check cache first
  if (modelDetailsCache.has(cacheKey)) {
    return modelDetailsCache.get(cacheKey)!;
  }

  const modelDetails: Record<string, Record<string, Partial<ModelOption>>> = {
    auto: {
      'auto': {
        speed: 'fast',
        quality: 'excellent',
        cost: 'medium',
        useCases: ['自动选择', '负载均衡', '智能路由'],
        description: '根据任务类型自动选择最适合的模型',
        features: ['智能路由', '自动优化', '无缝切换']
      }
    },
    groq: {
      'openai/gpt-oss-120b': {
        speed: 'ultra-fast',
        quality: 'excellent',
        cost: 'low',
        useCases: ['快速对话', '实时交互', '代码生成', '创意写作'],
        description: 'GROQ优化的GPT模型，超快推理速度',
        contextWindow: 4096,
        features: ['⚡ 超快推理', '🎯 高质量输出', '💰 成本优化']
      },
      'meta-llama/llama-3-8b-instruct': {
        speed: 'fast',
        quality: 'good',
        cost: 'free',
        useCases: ['通用对话', '简单任务', '学习辅助'],
        description: 'Meta Llama 3 8B 指令微调模型',
        contextWindow: 8192,
        features: ['🆓 完全免费', '🚀 快速响应', '📚 知识丰富']
      },
      'meta-llama/llama-3-70b-instruct': {
        speed: 'fast',
        quality: 'excellent',
        cost: 'medium',
        useCases: ['复杂对话', '专业分析', '代码审查', '学术研究'],
        description: 'Meta Llama 3 70B 大型指令模型',
        contextWindow: 8192,
        features: ['🧠 高智能', '📊 深度分析', '🎓 专业级']
      }
    },
    openai: {
      'gpt-4': {
        speed: 'normal',
        quality: 'excellent',
        cost: 'high',
        useCases: ['专业写作', '复杂分析', '创意设计', '学术研究'],
        description: 'OpenAI GPT-4，最先进的AI模型',
        contextWindow: 8192,
        features: ['🏆 业界标准', '🎨 创意无限', '📈 高准确性']
      },
      'gpt-3.5-turbo': {
        speed: 'fast',
        quality: 'good',
        cost: 'low',
        useCases: ['日常对话', '快速写作', '简单任务'],
        description: 'OpenAI GPT-3.5 Turbo，高效且经济',
        contextWindow: 4096,
        features: ['⚡ 快速响应', '💰 成本友好', '🔧 多功能']
      }
    },
    gemini: {
      'gemini-1.5-pro': {
        speed: 'normal',
        quality: 'excellent',
        cost: 'medium',
        useCases: ['多模态任务', '图像分析', '创意设计', '学术研究'],
        description: 'Google Gemini 1.5 Pro，多模态AI模型',
        contextWindow: 1000000,
        features: ['🖼️ 多模态', '🌐 超长上下文', '🎯 精准分析']
      },
      'gemini-1.5-flash': {
        speed: 'fast',
        quality: 'good',
        cost: 'low',
        useCases: ['快速对话', '简单分析', '日常任务'],
        description: 'Google Gemini 1.5 Flash，快速多模态模型',
        contextWindow: 1000000,
        features: ['🚀 快速推理', '💰 经济实惠', '🖼️ 支持图像']
      }
    }
  };

  const details = modelDetails[provider]?.[model] || {};

  // Cache the result
  modelDetailsCache.set(cacheKey, details);

  return details;
};

// Group models by provider
const groupModelsByProvider = (modelOptions: ModelOption[]) => {
  const grouped: Record<string, ModelOption[]> = {
    auto: [],
    gemini: [],
    groq: [],
    openai: []
  };

  modelOptions.forEach(option => {
    if (grouped[option.provider]) {
      grouped[option.provider].push(option);
    }
  });

  return grouped;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const [showComparison, setShowComparison] = useState(false);

  // Load all available models
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        const providers: ProviderKey[] = ['gemini', 'groq', 'openai'];
        const allOptions: ModelOption[] = [];

        // Add auto option first
        allOptions.push({
          provider: 'auto',
          model: 'auto',
          displayName: 'Auto（自动选择最优模型）',
          providerDisplayName: 'Auto'
        });

        // Load models for each provider with retry logic
        for (const provider of providers) {
          let models: string[] = [];
          let loadError: string | null = null;

          // Retry logic with exponential backoff
          const maxRetries = 3;
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              models = await getModelsForProvider(provider);
              loadError = null;
              break;
            } catch (error) {
              loadError = error instanceof Error ? error.message : 'Unknown error';
              console.warn(`Failed to load models for ${provider} (attempt ${attempt + 1}/${maxRetries}):`, error);

              if (attempt < maxRetries - 1) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              }
            }
          }

          // Always show models for providers with API keys
          if (checkApiKeyAvailability(provider)) {
            // If we have API key but no models loaded, use fallback models
            const modelsToShow = models.length > 0 ? models : (await import('../services/modelRegistry')).fallbackModels[provider] || [];

            modelsToShow.forEach(model => {
              const details = getModelDetails(provider, model);
              allOptions.push({
                provider,
                model,
                displayName: `${model}`,
                providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider,
                ...details
              });
            });

            // If models were loaded from API but we had errors, still show them
            if (models.length > 0 && loadError) {
              setLoadErrors(prev => ({
                ...prev,
                [provider]: `部分加载失败，但显示可用模型: ${loadError}`
              }));
            } else {
              // Clear any previous error for this provider
              setLoadErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[provider];
                return newErrors;
              });
            }
          } else {
            // Add fallback options with error information for providers without API keys
            allOptions.push({
              provider,
              model: '',
              displayName: `${provider} (需要API密钥)`,
              providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider,
              speed: 'normal',
              quality: 'standard',
              cost: 'medium'
            });
            // Store error information
            setLoadErrors(prev => ({
              ...prev,
              [provider]: 'API密钥未配置'
            }));
          }
        }

        setModelOptions(allOptions);
      } catch (error) {
        console.error('Failed to load model options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Initialize expanded platforms - keep all collapsed by default
  // Removed auto-expansion logic to maintain collapsed state

  const handleSelect = (option: ModelOption) => {
    onChange({
      provider: option.provider,
      model: option.model === 'auto' ? '' : option.model
    });
  };

  const togglePlatformExpansion = (platformKey: string) => {
    setExpandedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platformKey)) {
        newSet.delete(platformKey);
      } else {
        newSet.add(platformKey);
      }
      return newSet;
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    clearModelCache();
    // Reload models from all providers
    try {
      const providers: ProviderKey[] = ['gemini', 'groq', 'openai'];
      const allOptions: ModelOption[] = [];

      // Add auto option first
      allOptions.push({
        provider: 'auto',
        model: 'auto',
        displayName: 'Auto（自动选择最优模型）',
        providerDisplayName: 'Auto'
      });

      // Load models for each provider
      for (const provider of providers) {
        try {
          const models = await getModelsForProvider(provider);
          models.forEach(model => {
            const details = getModelDetails(provider, model);
            allOptions.push({
              provider,
              model,
              displayName: `${model}`,
              providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider,
              ...details
            });
          });
        } catch (error) {
          console.warn(`Failed to load models for ${provider}:`, error);
          // Add fallback options with basic details
          allOptions.push({
            provider,
            model: '',
            displayName: `${provider} (加载失败)`,
            providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider,
            speed: 'normal',
            quality: 'standard',
            cost: 'medium'
          });
        }
      }

      setModelOptions(allOptions);
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={`${className}`}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="relative mb-6">
            <div className="w-12 h-12 border-4 border-gray-600/30 border-t-blue-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-400 rounded-full animate-spin animation-delay-75"></div>
          </div>
          <div className="text-sm text-gray-300 font-semibold mb-2">正在加载模型列表</div>
          <div className="text-xs text-gray-500 text-center leading-relaxed">
            正在从各个服务商获取最新的模型信息...<br />
            这可能需要几秒钟时间
          </div>
        </div>
      ) : (
            <div className="space-y-6">
          {/* Optimized Header - Enhanced visual hierarchy */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-brand-500/30 shadow-lg shadow-brand-500/10">
                <Icons.Chip size={20} className="text-brand-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">选择模型</h2>
                <p className="text-sm text-gray-400 font-medium leading-tight">选择最适合您创作需求的AI模型</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Performance Comparison Button */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/40 hover:border-gray-500/60 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="模型性能对比"
              >
                <Icons.Analysis size={16} />
                <span>对比</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/40 hover:border-gray-500/60 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="刷新模型列表"
              >
                <Icons.Restore size={16} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? '刷新中...' : '刷新列表'}</span>
              </button>
            </div>
          </div>


          {/* Performance Comparison Table */}
          {showComparison && (
            <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icons.Analysis size={20} className="text-brand-400" />
                  模型性能对比
                </h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Icons.Close size={18} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/60">
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">模型</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-semibold">速度</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-semibold">质量</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-semibold">成本</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-semibold">上下文</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">适用场景</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {modelOptions
                      .filter(option => option.model && option.model !== 'auto')
                      .slice(0, 8) // Show top 8 models
                      .map((option, index) => (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                option.provider === 'auto' ? 'bg-yellow-400' :
                                option.provider === 'gemini' ? 'bg-blue-400' :
                                option.provider === 'groq' ? 'bg-purple-400' :
                                'bg-green-400'
                              }`} />
                              <span className="text-white font-medium truncate max-w-48">{option.displayName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              option.speed === 'ultra-fast' ? 'bg-emerald-500/20 text-emerald-300' :
                              option.speed === 'fast' ? 'bg-blue-500/20 text-blue-300' :
                              option.speed === 'normal' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {option.speed === 'ultra-fast' ? '极快' :
                               option.speed === 'fast' ? '快速' :
                               option.speed === 'normal' ? '标准' : '较慢'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              option.quality === 'excellent' ? 'bg-emerald-500/20 text-emerald-300' :
                              option.quality === 'good' ? 'bg-blue-500/20 text-blue-300' :
                              option.quality === 'standard' ? 'bg-gray-500/20 text-gray-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {option.quality === 'excellent' ? '优秀' :
                               option.quality === 'good' ? '良好' :
                               option.quality === 'standard' ? '标准' : '基础'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              option.cost === 'free' ? 'bg-green-500/20 text-green-300' :
                              option.cost === 'low' ? 'bg-blue-500/20 text-blue-300' :
                              option.cost === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {option.cost === 'free' ? '免费' :
                               option.cost === 'low' ? '实惠' :
                               option.cost === 'medium' ? '中等' : '昂贵'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-gray-300">
                            {option.contextWindow ? (
                              option.contextWindow >= 100000 ?
                                `${(option.contextWindow/1000).toFixed(0)}K` :
                                option.contextWindow.toLocaleString()
                            ) : '-'}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex flex-wrap gap-1">
                              {option.useCases?.slice(0, 2).map((useCase, idx) => (
                                <span key={idx} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-md">
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Optimized Platform Grid - Improved spacing and alignment */}
          {(() => {
            const groupedModels = groupModelsByProvider(modelOptions);
            const platforms: Array<{
              key: ProviderKey | 'auto',
              label: string,
              icon: string,
              color: string,
              shortDesc: string
            }> = [
              {
                key: 'auto',
                label: '智能选择',
                icon: '🤖',
                color: 'yellow',
                shortDesc: '自动匹配最优模型'
              },
              {
                key: 'openai',
                label: 'OpenAI',
                icon: '🏆',
                color: 'green',
                shortDesc: '业界标准，功能全面'
              },
              {
                key: 'gemini',
                label: 'Google Gemini',
                icon: '🎯',
                color: 'blue',
                shortDesc: 'Google官方，多模态支持'
              },
              {
                key: 'groq',
                label: 'Groq',
                icon: '⚡',
                color: 'purple',
                shortDesc: '超快推理，实时交互'
              }
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platforms.map(platform => {
                  const models = groupedModels[platform.key];
                  const hasApiKey = platform.key === 'auto' || checkApiKeyAvailability(platform.key as ProviderKey);

                  // Always show platforms with API keys or auto mode
                  if (!hasApiKey && platform.key !== 'auto') {
                    return null;
                  }

              return (
                <div key={platform.key} className="bg-gray-900/70 border border-gray-700/60 rounded-2xl overflow-hidden hover:bg-gray-800/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                  {/* Optimized Platform Header - Better alignment and contrast */}
                  <button
                    onClick={() => togglePlatformExpansion(platform.key)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-white/5 rounded-2xl transition-all duration-200 group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-medium transition-all duration-300 ${
                      hasApiKey
                        ? `bg-gradient-to-br from-${platform.color}-500/25 to-${platform.color}-600/25 border-2 border-${platform.color}-500/50 shadow-sm`
                        : 'bg-gray-700/40 border-2 border-gray-600/50'
                    }`}>
                      {hasApiKey ? (
                        platform.key === 'auto' ? <Icons.Sparkles size={18} className="text-yellow-400" /> :
                        platform.key === 'openai' ? <Icons.Star size={18} className="text-green-400" /> :
                        platform.key === 'gemini' ? <Icons.Target size={18} className="text-blue-400" /> :
                        <Icons.Run size={18} className="text-purple-400" />
                      ) : <Icons.Error size={18} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-lg font-bold truncate ${
                          hasApiKey ? 'text-white' : 'text-gray-500'
                        }`}>
                          {platform.label}
                        </h3>
                        {hasApiKey ? (
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-green-400/60 shadow-[0_0_4px]"></div>
                        ) : (
                          <div className="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                        )}
                        {/* Optimized Model count badge */}
                        {hasApiKey && models.length > 0 && (
                          <span className="text-xs bg-gray-700/60 text-gray-300 px-2.5 py-1 rounded-lg font-semibold border border-gray-600/40">
                            {models.length}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed font-medium ${
                        hasApiKey ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {platform.shortDesc}
                      </p>
                    </div>
                    {/* Enhanced Expansion indicator */}
                    <div className={`transition-transform duration-300 ${expandedPlatforms.has(platform.key) ? 'rotate-180' : ''}`}>
                      <Icons.ChevronDown size={18} className="text-gray-400 group-hover:text-white transition-colors duration-200" />
                    </div>
                  </button>

                  {/* Optimized Model List - Enhanced contrast and alignment */}
                  {hasApiKey ? (
                    // Show models only when expanded
                    expandedPlatforms.has(platform.key) && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 px-2 pb-4">
                        {models.map((option, index) => (
                          <button
                            key={`${option.provider}-${option.model}-${index}`}
                            onClick={() => handleSelect(option)}
                            className={`
                              w-full p-4 text-left rounded-xl transition-all duration-300 group relative overflow-hidden h-18 flex items-center
                              ${option.provider === value.provider && option.model === value.model
                                ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-2 border-blue-400/80 shadow-2xl shadow-blue-500/40 ring-2 ring-blue-400/30 transform scale-[1.02]'
                                : 'bg-gray-900/90 hover:bg-gray-800/95 border border-gray-700/60 hover:border-gray-600/80 hover:shadow-lg'
                              }
                            `}
                          >
                            <div className="flex items-center gap-4 w-full">
                              {/* Optimized Status Indicator - Better contrast */}
                              <div className={`relative w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                option.provider === value.provider && option.model === value.model
                                  ? 'bg-gradient-to-br from-blue-500/40 to-cyan-500/40 border-2 border-blue-400/60'
                                  : `bg-gradient-to-br ${
                                      option.provider === 'auto' ? 'from-yellow-500/25 to-amber-500/25 border border-yellow-500/40' :
                                      option.provider === 'gemini' ? 'from-blue-500/25 to-cyan-500/25 border border-blue-500/40' :
                                      option.provider === 'groq' ? 'from-purple-500/25 to-pink-500/25 border border-purple-500/40' :
                                      'from-green-500/25 to-emerald-500/25 border border-green-500/40'
                                    }`
                              }`}>
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  option.provider === value.provider && option.model === value.model
                                    ? 'bg-blue-300 shadow-blue-300/90 shadow-[0_0_8px]'
                                    : option.provider === 'auto' ? 'bg-yellow-400 shadow-yellow-400/60 shadow-[0_0_4px]' :
                                      option.provider === 'gemini' ? 'bg-blue-400 shadow-blue-400/60 shadow-[0_0_4px]' :
                                      option.provider === 'groq' ? 'bg-purple-400 shadow-purple-400/60 shadow-[0_0_4px]' :
                                      'bg-green-400 shadow-green-400/60 shadow-[0_0_4px]'
                                }`} />
                                {option.provider === value.provider && option.model === value.model && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-300 rounded-full animate-pulse shadow-blue-300/90 shadow-[0_0_6px] flex items-center justify-center border border-blue-900/50">
                                    <Icons.CheckCircle size={9} className="text-blue-900" />
                                  </div>
                                )}
                              </div>

                              {/* Enhanced Content - Rich information display */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <h4 className={`text-base font-bold truncate leading-tight ${
                                      option.provider === value.provider && option.model === value.model
                                        ? 'text-white'
                                        : 'text-gray-200 group-hover:text-white'
                                    }`}>
                                      {option.displayName}
                                    </h4>

                                    {/* Model metrics and badges - 更紧凑的排列 */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* Speed indicator */}
                                      {option.speed && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          option.speed === 'ultra-fast' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                                          option.speed === 'fast' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                                          option.speed === 'normal' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                          'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                                        }`}>
                                          {option.speed === 'ultra-fast' ? '⚡ 极快' :
                                           option.speed === 'fast' ? '🚀 快速' :
                                           option.speed === 'normal' ? '⚖️ 标准' : '🐌 较慢'}
                                        </span>
                                      )}

                                      {/* Cost indicator */}
                                      {option.cost && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          option.cost === 'free' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                          option.cost === 'low' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                                          option.cost === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                          'bg-red-500/20 text-red-300 border border-red-400/30'
                                        }`}>
                                          {option.cost === 'free' ? '🆓 免费' :
                                           option.cost === 'low' ? '💰 实惠' :
                                           option.cost === 'medium' ? '💎 中等' : '💸 昂贵'}
                                        </span>
                                      )}

                                      {/* Context window */}
                                      {option.contextWindow && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-medium">
                                          📏 {option.contextWindow >= 100000 ? `${(option.contextWindow/1000).toFixed(0)}K` : option.contextWindow}
                                        </span>
                                      )}
                                    </div>

                                    {/* Description - 更靠近标签 */}
                                    {option.description && (
                                      <p className={`text-sm leading-snug mt-1 ${
                                        option.provider === value.provider && option.model === value.model
                                          ? 'text-blue-200'
                                          : 'text-gray-400 group-hover:text-gray-300'
                                      }`}>
                                        {option.description}
                                      </p>
                                    )}

                                    {/* Use cases - 更紧凑的间距 */}
                                    {option.useCases && option.useCases.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {option.useCases.slice(0, 3).map((useCase, idx) => (
                                          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-md border border-gray-600/50">
                                            {useCase}
                                          </span>
                                        ))}
                                        {option.useCases.length > 3 && (
                                          <span className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded-md border border-gray-600/50">
                                            +{option.useCases.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* 右侧操作标签 - 与左侧状态点垂直对齐 */}
                                  {option.provider === value.provider && option.model === value.model && (
                                    <div className="flex items-center gap-1.5 text-sm text-blue-300 font-bold px-3 py-1.5 bg-blue-500/20 border border-blue-400/50 rounded-lg shadow-sm ml-auto">
                                      <Icons.CheckCircle size={12} />
                                      <span>已选择</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    // Show API key notice or error with retry option
                    expandedPlatforms.has(platform.key) && (
                      <div className="animate-in slide-in-from-top-2 duration-300 mx-2 mb-4">
                        {loadErrors[platform.key] ? (
                          /* Error Notice with Retry */
                          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/40">
                                <Icons.Error size={16} className="text-red-400" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="text-sm font-bold text-red-200">
                                  加载失败
                                </div>
                                <p className="text-xs text-red-300/80 font-medium leading-relaxed">
                                  {loadErrors[platform.key]}
                                </p>
                                <button
                                  onClick={async () => {
                                    setLoadErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors[platform.key];
                                      return newErrors;
                                    });

                                    try {
                                      const models = await getModelsForProvider(platform.key as ProviderKey);
                                      // Update the model options with the newly loaded models
                                      setModelOptions(prev => {
                                        const filtered = prev.filter(opt => opt.provider !== platform.key || opt.model !== '');
                                        const newOptions = models.map(model => ({
                                          provider: platform.key,
                                          model,
                                          displayName: `${model}`,
                                          providerDisplayName: PROVIDER_DISPLAY_NAMES[platform.key] || platform.key,
                                          ...getModelDetails(platform.key, model)
                                        }));
                                        return [...filtered, ...newOptions];
                                      });
                                    } catch (error) {
                                      setLoadErrors(prev => ({
                                        ...prev,
                                        [platform.key]: error instanceof Error ? error.message : 'Retry failed'
                                      }));
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 hover:border-red-400/60 rounded-lg text-xs font-medium text-red-200 hover:text-red-100 transition-all duration-200"
                                >
                                  🔄 重试
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Enhanced API Key Notice */
                          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                                <Icons.Info size={16} className="text-amber-400" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="text-sm font-bold text-amber-200">
                                  需要API密钥
                                </div>
                                <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700/60">
                                  <code className="text-gray-300 font-mono text-sm font-medium">
                                    {(platform.key as ProviderKey).toUpperCase()}_API_KEY=...
                                  </code>
                                </div>
                                <p className="text-xs text-amber-300/80 font-medium leading-relaxed">
                                  配置后刷新页面即可使用此服务
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              );
                }).filter(Boolean)}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};