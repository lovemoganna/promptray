import { getGroqApiKey, isGroqApiKeyAvailable, getGroqMissingKeyMessage } from './groqConfig';
import { DEFAULT_TIMEOUT_MS } from '../geminiConfig';

interface RunConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeout?: number;
  systemInstruction?: string;
}

const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getApiUrl = (): string => {
  // Check if we're using OpenAI API key
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (openaiKey) {
    return process.env.OPENAI_API_URL || DEFAULT_OPENAI_API_URL;
  }

  // Otherwise, we're using Groq API key
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  if (groqKey) {
    return process.env.GROQ_API_URL || DEFAULT_GROQ_API_URL;
  }

  // Fallback to OpenAI as default
  return DEFAULT_OPENAI_API_URL;
};

export const isApiKeyAvailable = (): boolean => {
  return isGroqApiKeyAvailable();
};

export const getMissingKeyMessage = (): string => {
    return getGroqMissingKeyMessage();
};

/**
 * Get available models from Groq/OpenAI API
 */
export const getAvailableModels = async (): Promise<string[]> => {
    if (!isApiKeyAvailable()) {
        return [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for model list

        const modelsUrl = getApiUrl().replace('/chat/completions', '/models');
        console.debug('Fetching models from:', modelsUrl);

        const res = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getGroqApiKey()}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            // If models endpoint fails, return known models
            return [
                'openai/gpt-oss-120b',
                'meta-llama/llama-3.2-90b-text-preview',
                'meta-llama/llama-3.1-405b-instruct',
                'meta-llama/llama-3.1-70b-instruct',
                'meta-llama/llama-3.1-8b-instruct',
                'microsoft/wizardlm-2-8x22b',
                'google/gemma-7b-it'
            ];
        }

        const data = await res.json();
        const models = data.data?.map((model: any) => model.id).filter((id: string) =>
            // Filter to relevant models
            id.includes('gpt') || id.includes('llama') || id.includes('gemma') || id.includes('wizard')
        ) || [];

        return models.length > 0 ? models : [
            'openai/gpt-oss-120b',
            'meta-llama/llama-3.2-90b-text-preview'
        ];
    } catch (error) {
        console.warn('Failed to fetch Groq models, using defaults:', error);
        // Return known working models as fallback
        return [
            'openai/gpt-oss-120b',
            'meta-llama/llama-3.2-90b-text-preview',
            'meta-llama/llama-3.1-405b-instruct'
        ];
    }
};

export const runGroqPrompt = async (promptText: string, config?: RunConfig): Promise<string> => {
  if (!isApiKeyAvailable()) throw new Error(getMissingKeyMessage());

  const timeout = config?.timeout || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.debug('Groq/OpenAI request', { model: config?.model || DEFAULT_GROQ_MODEL });
  } catch {}

  try {
    const apiUrl = getApiUrl();
    console.debug('Groq/OpenAI request', { model: config?.model || DEFAULT_GROQ_MODEL, endpoint: apiUrl });

    const body = {
      model: config?.model || DEFAULT_GROQ_MODEL,
      messages: [
        ...(config?.systemInstruction ? [{ role: 'system', content: config.systemInstruction }] : []),
        { role: 'user', content: promptText }
      ],
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxOutputTokens ?? 1000,
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[Groq/OpenAI] ${res.status} ${res.statusText}: ${text}`);
    }

    const data = await res.json();
    // OpenAI chat completions return choices[0].message.content
    if (data && data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
      return data.choices[0].message.content;
    }
    // Fallback: maybe older shape
    if (data && data.choices && data.choices[0] && typeof data.choices[0].text === 'string') {
      return data.choices[0].text;
    }

    throw new Error('Unexpected response shape from Groq/OpenAI API');
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw err;
  }
};

export const generatePromptMetadataGroq = async (title: string, description: string, content: string, timeout?: number) => {
  if (!isApiKeyAvailable()) throw new Error(getMissingKeyMessage());
  const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;

  const metaPrompt = `
请你扮演提示词设计助手，阅读下面的提示词标题/描述/内容，输出严格的 JSON 对象，字段包括：
- category: 在 ["Code","Writing","Ideas","Analysis","Fun","Misc"] 中选择一个
- outputType: 在 ["image","video","audio","text"] 中选择一个
- applicationScene: 在 ["角色设计","场景生成","风格转换","故事创作","工具使用","其他"] 中选择一个
- usageNotes: 一到两句简短中文使用说明
- cautions: 一到两句中文注意事项
- intent: 一句话描述意图
- audience: 一句话描述目标受众
- constraints: 数组，列出约束或禁止项
- recommendedModels: 数组，可为空

标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;

  const text = await runGroqPrompt(metaPrompt, { timeout: timeoutMs, model: DEFAULT_GROQ_MODEL });
  // try parse JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Failed to parse JSON from Groq response');
  }
};

export const generateRoleIdentityGroq = async (title: string, description: string, content: string, timeout?: number): Promise<string> => {
  if (!isApiKeyAvailable()) throw new Error(getMissingKeyMessage());
  const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
  const metaPrompt = `
请基于下面的提示词（标题 / 描述 / 内容），用一句话直接表述 AI 的身份与立场（不要复制或重复提示词内容）。输出仅为一句话，勿包含其它解释或上下文。

标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;
  const text = await runGroqPrompt(metaPrompt, { timeout: timeoutMs, model: DEFAULT_GROQ_MODEL });
  return text.trim();
};

export const generateEvaluationGroq = async (title: string, description: string, content: string, timeout?: number): Promise<string> => {
  if (!isApiKeyAvailable()) throw new Error(getMissingKeyMessage());
  const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
  const metaPrompt = `
请基于下面的提示词（标题 / 描述 / 内容），用 1-3 句话直接表述该提示词的裁定标准或评估建议。输出仅为 1-3 句话，勿包含其它解释或上下文。

标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;
  const text = await runGroqPrompt(metaPrompt, { timeout: timeoutMs, model: DEFAULT_GROQ_MODEL });
  return text.trim();
};


