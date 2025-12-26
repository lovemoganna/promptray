import { DEFAULT_TIMEOUT_MS } from '../geminiConfig';

const DEFAULT_OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const getOpenAiApiUrl = (): string => {
    return (process.env.OPENAI_API_URL || DEFAULT_OPENAI_API_URL) as string;
};

const getOpenAiApiKey = (): string | undefined => {
    return process.env.OPENAI_API_KEY;
};

export const isApiKeyAvailable = (): boolean => {
    return !!getOpenAiApiKey();
};

export const getMissingKeyMessage = (): string => {
    return 'OpenAI API Key is not configured. Please set the OPENAI_API_KEY environment variable.';
};

/**
 * Get available models from OpenAI API
 */
export const getAvailableModels = async (): Promise<string[]> => {
    if (!isApiKeyAvailable()) {
        return [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(`${getOpenAiApiUrl().replace('/chat/completions', '/models')}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getOpenAiApiKey()}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            // If models endpoint fails, return known GPT models
            return [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo'
            ];
        }

        const data = await res.json();
        const models = data.data?.map((model: any) => model.id).filter((id: string) =>
            // Filter to GPT models
            id.startsWith('gpt-')
        ) || [];

        return models.length > 0 ? models : [
            'gpt-4o',
            'gpt-4o-mini'
        ];
    } catch (error) {
        console.warn('Failed to fetch OpenAI models, using defaults:', error);
        // Return known working models as fallback
        return [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo'
        ];
    }
};

export const runOpenAIPrompt = async (promptText: string, config?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    timeout?: number;
    systemInstruction?: string;
}): Promise<string> => {
    if (!isApiKeyAvailable()) throw new Error(getMissingKeyMessage());

    const timeout = config?.timeout || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const body = {
            model: config?.model || 'gpt-4o-mini',
            messages: [
                ...(config?.systemInstruction ? [{ role: 'system', content: config.systemInstruction }] : []),
                { role: 'user', content: promptText }
            ],
            temperature: config?.temperature ?? 0.7,
            max_tokens: config?.maxOutputTokens ?? 1000,
        };

        const res = await fetch(getOpenAiApiUrl(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getOpenAiApiKey()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "No response generated.";
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms. The API call took too long to respond.`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};
