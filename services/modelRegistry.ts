import { getAvailableModels as getGeminiModels } from './geminiService';
import { getAvailableModels as getGroqModels } from './groqService';
import { getAvailableModels as getOpenAIModels } from './openaiService';

export type ProviderKey = 'gemini' | 'groq' | 'openai';

// Cache for model lists with expiration
interface CachedModels {
  models: string[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const MODEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const modelCache: Record<ProviderKey, CachedModels | null> = {
  gemini: null,
  groq: null,
  openai: null,
};

// Static fallback models when API is unavailable
export const fallbackModels: Record<ProviderKey, string[]> = {
  gemini: [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-1.0-pro',
  ],
  groq: [
    'openai/gpt-oss-120b',
    'meta-llama/llama-3.2-90b-text-preview',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
  ],
};

/**
 * Get available models for a provider, with caching and fallbacks
 */
export const getModelsForProvider = async (provider: ProviderKey): Promise<string[]> => {
  const now = Date.now();
  const cached = modelCache[provider];

  // Return cached models if still valid
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.models;
  }

  try {
    let models: string[] = [];

    // Fetch models from API
    switch (provider) {
      case 'gemini':
        models = await getGeminiModels();
        break;
      case 'groq':
        models = await getGroqModels();
        break;
      case 'openai':
        models = await getOpenAIModels();
        break;
      default:
        models = fallbackModels[provider] || [];
    }

    // Cache the results
    modelCache[provider] = {
      models: models.length > 0 ? models : fallbackModels[provider],
      timestamp: now,
      ttl: MODEL_CACHE_TTL,
    };

    return modelCache[provider]!.models;
  } catch (error) {
    console.warn(`Failed to fetch models for ${provider}, using fallbacks:`, error);

    // Use fallback models if API fails
    const fallback = fallbackModels[provider] || [];
    modelCache[provider] = {
      models: fallback,
      timestamp: now,
      ttl: MODEL_CACHE_TTL,
    };

    return fallback;
  }
};

/**
 * Get default model for a provider
 */
export const defaultModelForProvider = (provider: ProviderKey): string => {
  const fallback = fallbackModels[provider];
  return fallback && fallback.length > 0 ? fallback[0] : '';
};

/**
 * Clear model cache for a provider or all providers
 */
export const clearModelCache = (provider?: ProviderKey): void => {
  if (provider) {
    modelCache[provider] = null;
  } else {
    Object.keys(modelCache).forEach(key => {
      modelCache[key as ProviderKey] = null;
    });
  }
};

/**
 * Legacy compatibility - returns static fallback models
 * @deprecated Use getModelsForProvider() for dynamic model fetching
 */
export const modelRegistry: Record<ProviderKey, string[]> = fallbackModels;


