import { GoogleGenerativeAI } from "@google/generative-ai";
import { Example, SavedRun } from "../types";
import {
    DEFAULT_MODEL,
    DEFAULT_TIMEOUT_MS,
    getGeminiApiKey,
    isGeminiApiKeyAvailable,
    getMissingKeyMessage
} from "../geminiConfig";
import * as groqService from './groqService';

// Initialize Gemini
// Note: In a real production app, you might want to proxy this or require user input key.
// For this demo, we assume the environment variable is set as per instructions.
const apiKey = getGeminiApiKey();

let ai: GoogleGenerativeAI | null = null;

if (apiKey) {
    ai = new GoogleGenerativeAI(apiKey);
}

/**
 * Check if API Key is available
 */
export const isApiKeyAvailable = (): boolean => {
    return isGeminiApiKeyAvailable();
};

/**
 * Get available Gemini models based on API capabilities
 * This returns a comprehensive list of Gemini models that are generally available
 */
export const getAvailableModels = async (): Promise<string[]> => {
    if (!isApiKeyAvailable()) {
        return [];
    }

    // Gemini models that are commonly available
    // We could enhance this to actually query the API if Google provides a models endpoint
    const commonModels = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'text-bison-001', // Legacy models
        'chat-bison-001'
    ];

    // Try to validate models by making a lightweight request to each
    // This is optional and can be removed if it causes performance issues
    const availableModels: string[] = [];

    for (const model of commonModels) {
        try {
            // Quick validation - create model instance (this doesn't make API call)
            const testModel = ai?.getGenerativeModel({ model });
            if (testModel) {
                availableModels.push(model);
            }
        } catch {
            // Model not available, skip
        }
    }

    // If no models validated, return common ones
    return availableModels.length > 0 ? availableModels : commonModels.slice(0, 3);
};

/**
 * Get user-friendly error message for API Key issues
 */
export const getApiKeyErrorMessage = (): string => {
    return getMissingKeyMessage();
};

export interface GenerationConfig {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    systemInstruction?: string;
    examples?: Example[];
    signal?: AbortSignal; // Add abort signal support
    timeout?: number; // Timeout in milliseconds (default: 60000 = 60s)
}

/**
 * Helper to construct the content array including few-shot examples
 * For @google/generative-ai, we use the correct format
 */
const buildContents = (promptText: string, examples?: Example[]) => {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (examples && examples.length > 0) {
        examples.forEach(ex => {
            if (ex.input && ex.output) {
                contents.push({ role: 'user', parts: [{ text: ex.input }] });
                contents.push({ role: 'model', parts: [{ text: ex.output }] });
            }
        });
    }

    contents.push({ role: 'user', parts: [{ text: promptText }] });
    return contents;
};

export const runGeminiPrompt = async (promptText: string, config?: GenerationConfig): Promise<string> => {
  if (!ai || !isApiKeyAvailable()) {
    throw new Error(getApiKeyErrorMessage());
  }

    const timeout = config?.timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {
        if (config?.signal && !config.signal.aborted) {
            // Timeout will be handled by Promise.race below
        }
    }, timeout);

    try {
        console.debug('Gemini request', { model: config?.model || DEFAULT_MODEL });
    } catch {}

    try {
        const model = ai.getGenerativeModel({ 
            model: config?.model || DEFAULT_MODEL,
        });

        const contents = buildContents(promptText, config?.examples);
        const generationConfig: any = {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxOutputTokens ?? 1000,
        };
        if (config?.topP) generationConfig.topP = config.topP;
        if (config?.topK) generationConfig.topK = config.topK;

        // Add system instruction if provided
        const requestOptions: any = {
            contents: contents,
            generationConfig,
        };
        if (config?.systemInstruction) {
            requestOptions.systemInstruction = config.systemInstruction;
        }

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeout}ms. The API call took too long to respond.`));
            }, timeout);
        });

        // Race between API call and timeout
        const result = await Promise.race([
            model.generateContent(requestOptions),
            timeoutPromise
        ]);
        
        clearTimeout(timeoutId);
        const response = await (result as any).response;
        return response.text() || "No response generated.";
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
        // Check if it's a timeout error
        if (error.message.includes('timeout')) {
            throw new Error(`Request timeout: The API call took longer than ${timeout}ms. Please try again or check your network connection.`);
        }
        throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while contacting Gemini.");
  }
};

/**
 * Streams the response from Gemini.
 * Returns an async generator that yields text chunks.
 */
export async function* runGeminiPromptStream(promptText: string, config?: GenerationConfig) {
    if (!ai || !isApiKeyAvailable()) {
        yield `Error: ${getApiKeyErrorMessage()}`;
        return;
    }

    // Check if request was aborted before starting
    if (config?.signal?.aborted) {
        return;
    }

    const timeout = config?.timeout || DEFAULT_TIMEOUT_MS;
    let timeoutId: any = null;
    let streamStarted = false;

    try {
        const model = ai.getGenerativeModel({ 
            model: config?.model || DEFAULT_MODEL,
        });

        const contents = buildContents(promptText, config?.examples);
        const generationConfig: any = {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxOutputTokens ?? 2000,
        };
        if (config?.topP) generationConfig.topP = config.topP;
        if (config?.topK) generationConfig.topK = config.topK;

        // Add system instruction if provided
        const requestOptions: any = {
            contents: contents,
            generationConfig,
        };
        if (config?.systemInstruction) {
            requestOptions.systemInstruction = config.systemInstruction;
        }

        // Set timeout for stream start
        timeoutId = setTimeout(() => {
            if (!streamStarted) {
                // Timeout will be handled in catch block
            }
        }, timeout);

        const result = await model.generateContentStream(requestOptions);
        streamStarted = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Reset timeout for stream chunks (allow longer for streaming)
        const chunkTimeout = timeout * 2; // Allow 2x timeout for streaming
        let lastChunkTime = Date.now();

        for await (const chunk of result.stream) {
            // Check if request was aborted during streaming
            if (config?.signal?.aborted) {
                return;
            }

            // Check for chunk timeout (no chunk received for too long)
            const now = Date.now();
            if (now - lastChunkTime > chunkTimeout) {
                yield `\n[Error: Stream timeout - no data received for ${Math.round(chunkTimeout / 1000)}s]`;
                return;
            }

            const chunkText = chunk.text();
            if (chunkText) {
                lastChunkTime = now;
                yield chunkText;
            }
        }

    } catch (error) {
        // Don't report error if request was aborted
        if (config?.signal?.aborted) {
            return;
        }
        if (timeoutId) clearTimeout(timeoutId);
        console.error("Gemini Stream Error:", error);
        if (error instanceof Error) {
            // Check if it's a timeout error
            if (error.message.includes('timeout') || (!streamStarted && timeoutId)) {
                yield `\n[Error: Request timeout - The API call took longer than ${timeout}ms. Please try again or check your network connection.]`;
            } else {
                yield `\n[Error: ${error.message}]`;
            }
        } else {
            yield "\n[An unexpected error occurred]";
        }
    }
}

export const optimizePromptContent = async (originalText: string, type: 'prompt' | 'system' = 'prompt', goodRuns: SavedRun[] = [], timeout?: number): Promise<string> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());
    
    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);
    
    try {
        let instruction = "";
        let context = "";

        // Inject knowledge from successful runs if available
        if (goodRuns.length > 0) {
            const historyContext = goodRuns.slice(0, 3).map((run, i) => 
                `Success Example ${i+1}:\nInput Variables: ${JSON.stringify(run.inputValues)}\nOutput: ${run.output.slice(0, 200)}...`
            ).join('\n\n');
            
            context = `\n\nI have attached some historical successful runs for context. Use these to understand the desired goal, but focus on improving the clarity and structure of the template text itself.\n\n${historyContext}`;
        }

        if (type === 'prompt') {
            instruction = `You are an expert Prompt Engineer. 
            Your task is to optimize the following prompt to be more clear, structured, and effective for LLMs.
            Retain any variable placeholders like {topic} or {selection}. 
            Do not add any conversational text, just return the optimized prompt content directly.`;
        } else {
            instruction = `You are an expert Prompt Engineer.
            Your task is to optimize the following "System Instruction" (Persona definition).
            Make it authoritative, clear, and specific about the AI's role, tone, and constraints.
            Do not add any conversational text, just return the optimized system instruction directly.`;
        }

        const metaPrompt = `${instruction}${context}
        
        Original Text:
        ${originalText}`;

        const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeoutMs}ms. The optimization took too long to respond.`));
            }, timeoutMs);
        });

        // Race between API call and timeout
        const result = await Promise.race([
            model.generateContent(metaPrompt),
            timeoutPromise
        ]);
        
        clearTimeout(timeoutId);
        const response = await (result as any).response;
        const text = response.text();

        return text?.trim() || originalText;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Optimization Error:", error);
        if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(`Optimization timeout: The request took longer than ${timeoutMs}ms. Please try again.`);
        }
        throw error;
    }
};

export const generateSampleVariables = async (promptText: string, variables: string[], timeout?: number): Promise<Record<string, string>> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());
    if (variables.length === 0) return {};

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
    I have a prompt with the following variables: ${variables.map(v => `{${v}}`).join(', ')}.
    
    The Prompt Context is:
    """${promptText}"""
    
    Please generate realistic, high-quality sample values for each variable that would test this prompt effectively.
    For example, if the variable is {code}, generate a small snippet of code. If it's {article}, generate a short paragraph.
    
    Return ONLY a raw JSON object where keys are the variable names (without brackets) and values are the generated strings.
    Example: { "topic": "Quantum Physics", "audience": "5-year-olds" }
    `;

    try {
        const model = ai.getGenerativeModel({ 
            model: DEFAULT_MODEL,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeoutMs}ms.`));
            }, timeoutMs);
        });

        // Race between API call and timeout
        const result = await Promise.race([
            model.generateContent(metaPrompt),
            timeoutPromise
        ]);
        
        clearTimeout(timeoutId);
        const response = await (result as any).response;
        const text = response.text();
        
        if (!text) return {};
        return JSON.parse(text);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Magic Fill Error:", error);
        if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(`Generation timeout: The request took longer than ${timeoutMs}ms. Please try again.`);
        }
        throw error;
    }
};

export const generateTags = async (title: string, description: string, content: string, timeout?: number): Promise<string[]> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
    用中文分析下面的提示词内容，生成 3 到 6 个相关的简短标签（每个标签最多 10 个字符，尽量使用中文，不要包含空格）。
    标签应描述领域（例如：写作、营销）、任务（例如：改写、摘要）或风格/语气（例如：正式、幽默）。
    
    标题: ${title}
    描述: ${description}
    提示词内容:
    ${content}
    
    只返回一个严格的 JSON 字符串数组，示例: ["社交媒体","营销","文案"]
    `;

    try {
        const model = ai.getGenerativeModel({ 
            model: DEFAULT_MODEL,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeoutMs}ms.`));
            }, timeoutMs);
        });

        // Race between API call and timeout
        const result = await Promise.race([
            model.generateContent(metaPrompt),
            timeoutPromise
        ]);
        
        clearTimeout(timeoutId);
        const response = await (result as any).response;
        const text = response.text();
        
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Auto Tag Error:", error);
        if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(`Tag generation timeout: The request took longer than ${timeoutMs}ms. Please try again.`);
        }
        throw error;
    }
};

/**
 * Generate structured prompt metadata (category, output type, scene, notes, etc.)
 * using Gemini with JSON mode. This is used by the "Auto Metadata" feature.
 */
export interface PromptMetadata {
    category?: string;
    outputType?: string;
    applicationScene?: string;
    usageNotes?: string;
    cautions?: string;
    // Optional perspective fields for the prompt (intent / audience / constraints)
    intent?: string;
    audience?: string;
    constraints?: string[];
    recommendedModels?: string[];
}

export const generatePromptMetadata = async (
    title: string,
    description: string,
    content: string,
    model?: string,
    timeout?: number
): Promise<PromptMetadata> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
你是一名提示词设计助手。请阅读下面的提示词「标题 / 描述 / 提示词内容」，为这个提示词生成结构化的元信息，返回严格的 JSON。

需要的字段：
- category: 一个字符串，取值范围限定为 ["Code","Writing","Ideas","Analysis","Fun","Misc"] 之一。
- outputType: 一个字符串，取值范围限定为 ["image","video","audio","text"] 之一。
- applicationScene: 一个字符串，取值范围限定为 ["角色设计","场景生成","风格转换","故事创作","工具使用","其他"] 之一。
- usageNotes: 一段简短的中文使用说明，最多 1-2 句。
- cautions: 一段简短的中文注意事项或使用风险提示，最多 1-2 句。
- intent: 一段简短的中文，描述该提示词的主要意图或目的（例如：生成教学示例、文本摘要、图像描述等）。
- audience: 一段简短的中文，描述目标受众（例如：初学者、产品经理、研究人员）。
- constraints: 一个字符串数组，包含要遵守的约束或限制（例如：不超过200字、避免使用缩写等）。
- recommendedModels: 一个字符串数组，例如 ["gemini-2.5-flash","gpt-4.1"]，可以为空数组。

下面是需要分析的内容：
标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;

    try {
        const text = await runGeminiPrompt(metaPrompt, { timeout: timeoutMs, model: model || DEFAULT_MODEL, maxOutputTokens: 2000 });

        if (!text) {
            return {};
        }

        // The model should already return raw JSON, but be defensive.
        try {
            return JSON.parse(text);
        } catch {
            // Try to extract JSON object if anything extra was added.
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonSnippet = text.slice(firstBrace, lastBrace + 1);
                return JSON.parse(jsonSnippet);
            }
            throw new Error("Failed to parse metadata JSON from model response.");
        }
    } catch (error) {
        clearTimeout(timeoutId);

        const message = error instanceof Error ? error.message : String(error ?? '');

        // Treat overloaded model as a soft failure and let callers fall back gracefully.
        if (message.includes('The model is overloaded')) {
            console.warn('Auto Metadata service overloaded, will fallback to heuristic.', error);
            // Try Groq/OpenAI OSS fallback if available
            if (groqService && groqService.generatePromptMetadataGroq && groqService.isApiKeyAvailable && groqService.isApiKeyAvailable()) {
                try {
                    const groqParsed = await groqService.generatePromptMetadataGroq(title, description, content, timeoutMs);
                    return groqParsed as PromptMetadata;
                } catch (groqErr) {
                    console.warn('Groq fallback also failed:', groqErr);
                }
            } else {
                console.error('Auto Metadata Error:', error);
            }
        } else {
            console.error('Auto Metadata Error:', error);
        }

        if (error instanceof Error && error.message.includes("timeout")) {
            throw new Error(`Metadata generation timeout: The request took longer than ${timeoutMs}ms. Please try again.`);
        }
        throw error;
    }
};

/**
 * Generate a concise one-sentence role identity for an AI given the prompt.
 * Returns plain text (one sentence).
 */
export const generateRoleIdentity = async (title: string, description: string, content: string, timeout?: number): Promise<string> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
请基于下面的提示词（标题 / 描述 / 内容），用一句话直接表述 AI 的身份与立场（不要复制或重复提示词内容）。输出仅为一句话，勿包含其它解释或上下文。

标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;

    try {
        const text = await runGeminiPrompt(metaPrompt, { timeout: timeoutMs });
        return text.trim();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("generateRoleIdentity Error:", error);
        // Try Groq fallback
        try {
            if (groqService && groqService.isApiKeyAvailable && groqService.isApiKeyAvailable()) {
                const groqRole = await groqService.generateRoleIdentityGroq(title, description, content, timeoutMs);
                return groqRole;
            }
        } catch (e) {
            console.warn('Groq generateRoleIdentity fallback failed:', e);
        }
        throw error;
    }
};

/**
 * Generate a short evaluation or judgment for the prompt.
 * Returns a short Chinese string describing quality / suitability / quick suggestions.
 */
export const generateEvaluation = async (title: string, description: string, content: string, timeout?: number): Promise<string> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
请阅读下面的提示词（标题 / 描述 / 内容），对该提示词给出一句简短的评估或裁定（中文），说明其主要优点、潜在问题或适用场景，并可包含一两句建议。请将输出控制在 1-3 句之内，返回纯文本，无额外解释。

标题: ${title || '(无)'}
描述: ${description || '(无)'}
提示词内容:
${content || '(无)'}
`;

    try {
        const text = await runGeminiPrompt(metaPrompt, { timeout: timeoutMs });
        return text.trim();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("generateEvaluation Error:", error);
        // Try Groq fallback
        try {
            if (groqService && groqService.isApiKeyAvailable && groqService.isApiKeyAvailable()) {
                const groqEval = await groqService.generateEvaluationGroq(title, description, content, timeoutMs);
                return groqEval;
            }
        } catch (e) {
            console.warn('Groq generateEvaluation fallback failed:', e);
        }
        throw error;
    }
};

export const translatePromptToEnglish = async (chinesePrompt: string, timeout?: number): Promise<string> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getApiKeyErrorMessage());
    if (!chinesePrompt || chinesePrompt.trim().length === 0) throw new Error("No Chinese prompt to translate");

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const translationPrompt = `You are an expert translator specializing in AI prompt translation from Chinese to English.

Your task is to translate the following Chinese prompt into natural, idiomatic English that works well for AI models.

Requirements:
- Preserve all variable placeholders like {variable_name} exactly as they are
- Maintain the structure and formatting of the original prompt
- Use natural, professional English that AI models understand well
- Keep the same tone and style
- Do not add any explanations or comments, just return the translated prompt

Chinese Prompt:
${chinesePrompt}

Return ONLY the translated English prompt, nothing else.`;

    try {
        const model = ai.getGenerativeModel({ 
            model: DEFAULT_MODEL,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000
            }
        });
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeoutMs}ms.`));
            }, timeoutMs);
        });

        // Race between API call and timeout
        const result = await Promise.race([
            model.generateContent(translationPrompt),
            timeoutPromise
        ]);
        
        clearTimeout(timeoutId);
        const response = await (result as any).response;
        const text = response.text();
        
        if (!text) throw new Error("Translation returned empty result");
        return text.trim();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Translation Error:", error);
        if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(`Translation timeout: The request took longer than ${timeoutMs}ms. Please try again.`);
        }
        throw error;
    }
};

export const generateTitleAndDescription = async (content: string, timeout?: number): Promise<{ title?: string; description?: string }> => {
    if (!ai || !isApiKeyAvailable()) throw new Error(getMissingKeyMessage());
    if (!content || content.trim().length === 0) return {};

    const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {}, timeoutMs);

    const metaPrompt = `
    你是一名提示词设计专家。请阅读下面的中文提示词内容（Prompt Content），基于内容生成一个简短的中文标题（不超过 30 字）和一句用于展示的中文描述（1-2 句，简洁）。

    Prompt Content:
    ${content}

    返回严格的 JSON 对象，字段为：{"title":"...","description":"..."}，不要返回其它文本。
    `;

    try {
        const model = ai.getGenerativeModel({
            model: DEFAULT_MODEL,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error(`Request timeout after ${timeoutMs}ms.`));
            }, timeoutMs);
        });

        const result = await Promise.race([
            model.generateContent(metaPrompt),
            timeoutPromise
        ]);

        clearTimeout(timeoutId);
        const response = await (result as any).response;
        const text = response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonSnippet = text.slice(firstBrace, lastBrace + 1);
                return JSON.parse(jsonSnippet);
            }
            return {};
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("generateTitleAndDescription Error:", error);
        throw error;
    }
};
