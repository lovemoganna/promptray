import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Cpu } from 'lucide-react';
import { getModelsForProvider, ProviderKey, clearModelCache } from '../services/modelRegistry';
import { Icons } from './Icons';

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
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  'auto': 'Auto（Google → Groq）',
  'gemini': 'Google Gemini',
  'groq': 'Groq / OpenAI OSS',
  'openai': 'OpenAI'
};

const PROVIDER_COLORS: Record<string, string> = {
  'auto': 'text-yellow-400',
  'gemini': 'text-blue-400',
  'groq': 'text-purple-400',
  'openai': 'text-green-400'
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  lastRuntime
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

        // Load models for each provider
        for (const provider of providers) {
          try {
            const models = await getModelsForProvider(provider);
            models.forEach(model => {
              allOptions.push({
                provider,
                model,
                displayName: `${model}`,
                providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider
              });
            });
          } catch (error) {
            console.warn(`Failed to load models for ${provider}:`, error);
            // Add fallback options
            allOptions.push({
              provider,
              model: '',
              displayName: `${provider} (加载失败)`,
              providerDisplayName: PROVIDER_DISPLAY_NAMES[provider] || provider
            });
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current display value
  const getCurrentDisplay = () => {
    if (value.provider === 'auto') {
      return {
        primary: 'Auto',
        secondary: '自动选择最优模型',
        color: PROVIDER_COLORS.auto
      };
    }

    const option = modelOptions.find(opt =>
      opt.provider === value.provider && opt.model === value.model
    );

    if (option) {
      return {
        primary: value.model || '默认模型',
        secondary: PROVIDER_DISPLAY_NAMES[value.provider] || value.provider,
        color: PROVIDER_COLORS[value.provider] || 'text-gray-400'
      };
    }

    return {
      primary: value.model || '选择模型',
      secondary: PROVIDER_DISPLAY_NAMES[value.provider] || value.provider,
      color: PROVIDER_COLORS[value.provider] || 'text-gray-400'
    };
  };

  const current = getCurrentDisplay();

  const handleSelect = (option: ModelOption) => {
    onChange({
      provider: option.provider,
      model: option.model === 'auto' ? '' : option.model
    });
    setIsOpen(false);
  };

  const handleRefresh = () => {
    clearModelCache();
    // Reload models
    window.location.reload();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 min-w-[180px] transform hover:scale-105 active:scale-95
          ${disabled
            ? 'bg-gray-800/30 border-gray-600/20 text-gray-500 cursor-not-allowed backdrop-blur-sm'
            : `bg-gradient-to-r from-gray-900/80 to-slate-900/80 border-gray-600/30 hover:border-gray-500/50 text-white cursor-pointer backdrop-blur-md shadow-lg hover:shadow-xl`
          }
          ${isOpen
            ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border-blue-400/40 shadow-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
            : 'hover:bg-gradient-to-r hover:from-gray-800/90 hover:to-gray-700/90'
          }
        `}
        title="选择AI模型"
      >
        <div className={`p-0.5 rounded-md transition-colors duration-300 ${
          isOpen
            ? 'bg-blue-500/20'
            : 'bg-gray-700/50 group-hover:bg-gray-600/60'
        }`}>
          <Cpu size={12} className={`transition-colors duration-300 ${
            isOpen ? 'text-blue-300' : current.color
          }`} />
        </div>
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="text-[10px] font-medium truncate max-w-[160px] leading-tight text-white">
            {current.primary}
          </span>
          <span className={`text-[8px] opacity-60 truncate max-w-[160px] leading-tight transition-colors duration-300 ${
            isOpen ? 'text-blue-200' : current.color
          }`}>
            {current.secondary}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-all duration-300 transform ${
            isOpen ? 'rotate-180 text-blue-300' : 'text-gray-400'
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto min-w-[320px] max-w-[420px] animate-fade-in">
          {/* Header with refresh and runtime info */}
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex-1"
                title="刷新模型列表"
              >
                <Icons.Restore size={14} />
                <span>刷新模型列表</span>
              </button>

              {/* Runtime info - only show if different from current selection */}
              {lastRuntime && (lastRuntime.provider !== value.provider || lastRuntime.model !== value.model) && (
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-500/8 to-gray-500/8 border border-slate-400/15 rounded-lg text-[10px] text-slate-200 backdrop-blur-sm shadow-md flex-1">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse shadow-slate-400/40 shadow-[0_0_4px]"></div>
                    <span className="text-slate-300 font-medium">上次运行</span>
                  </div>
                  <div className="w-px h-2.5 bg-slate-500/25"></div>
                  <span className="font-mono text-slate-100 bg-slate-600/25 px-1.5 py-0.5 rounded text-[9px] leading-tight">
                    {(lastRuntime.provider || 'unknown') + (lastRuntime.model ? ` / ${lastRuntime.model}` : '')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model options */}
          <div className="py-2">
            {loading ? (
              <div className="px-4 py-6 text-xs text-gray-400 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>加载模型中...</span>
                </div>
              </div>
            ) : modelOptions.length === 0 ? (
              <div className="px-4 py-6 text-xs text-gray-400 text-center">
                暂无可用模型
              </div>
            ) : (
              modelOptions.map((option, index) => (
                <button
                  key={`${option.provider}-${option.model}-${index}`}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-3 py-2.5 text-left hover:bg-gradient-to-r hover:from-white/5 hover:to-white/5 transition-all duration-200 group relative overflow-hidden
                    ${option.provider === value.provider && option.model === value.model
                      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-200 border-l-3 border-blue-400 shadow-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                      : 'text-gray-300 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 transition-all duration-300 ${
                      option.provider === value.provider && option.model === value.model
                        ? 'bg-blue-400 shadow-blue-400/50 shadow-[0_0_8px]'
                        : `${PROVIDER_COLORS[option.provider]?.replace('text-', 'bg-') || 'bg-gray-500'} opacity-70 group-hover:opacity-100`
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate leading-tight mb-0.5">
                        {option.displayName}
                      </div>
                      <div className={`text-[10px] leading-tight transition-colors duration-200 ${
                        option.provider === value.provider && option.model === value.model
                          ? 'text-blue-300'
                          : `${PROVIDER_COLORS[option.provider] || 'text-gray-400'} opacity-60 group-hover:opacity-80`
                      }`}>
                        {option.providerDisplayName}
                      </div>
                    </div>
                    {option.provider === value.provider && option.model === value.model && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
