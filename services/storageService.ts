import { Prompt } from '../types';
import type { PromptView, SortBy, SortOrder } from '../constants';

const STORAGE_KEY = 'prompts_data_v2'; // Bump version to avoid conflict
const CATEGORIES_KEY = 'prompts_categories_v1';
const THEME_KEY = 'prompts_theme_v1';
const FILTERS_KEY = 'prompts_filters_v1'; // Filter state persistence

const SEED_DATA: Prompt[] = [
  {
    id: '1',
    title: '代码重构专家',
    description: '扮演资深架构师，优化代码的可读性与性能。',
    systemInstruction:
      '你是一位拥有10年经验的资深软件架构师。你的代码风格严谨，注重设计模式、可读性（Clean Code）和性能优化。在提供建议时，请先指出问题，再给出优化后的代码块。',
    content:
      '请审查以下代码，重点关注代码的**可读性**、**性能**以及是否符合**最佳实践**。如果发现潜在Bug，请指出并修复。\n\n代码:\n{code}',
    englishPrompt:
      'Please review the following code with a focus on **readability**, **performance**, and whether it follows **best practices**. If you find any potential bugs, point them out and fix them.\n\nCode:\n{code}',
    chinesePrompt:
      '请审查以下代码，重点关注代码的**可读性**、**性能**以及是否符合**最佳实践**。如果发现潜在Bug，请指出并修复。\n\n代码:\n{code}',
    category: 'Code',
    tags: ['重构', 'Debug', 'Clean Code'],
    outputType: 'text',
    applicationScene: '工具使用',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: true,
    createdAt: Date.now()
  },
  {
    id: '2',
    title: '小红书爆款文案',
    description: '生成吸引眼球的小红书风格种草文案。',
    systemInstruction:
      '你是一位小红书金牌文案写手，深谙“种草”心理学。你的文风亲切、活泼，像闺蜜聊天。你擅长使用Emoji表情，排版整洁。',
    content:
      '请为主题 {topic} 写一篇种草笔记。\n\n要求：\n1. 标题要足够吸引人（痛点+情绪价值）。\n2. 正文采用“痛点+解决方案+效果展示”的结构。\n3. 结尾加上相关标签。',
    englishPrompt:
      'Please write a Xiaohongshu-style recommendation note for the topic {topic}.\n\nRequirements:\n1. The title must be highly attractive (pain point + emotional value).\n2. The body should follow the structure: pain points → solution → results.\n3. Add relevant hashtags at the end.',
    chinesePrompt:
      '请为主题 {topic} 写一篇种草笔记。\n\n要求：\n1. 标题要足够吸引人（痛点+情绪价值）。\n2. 正文采用“痛点+解决方案+效果展示”的结构。\n3. 结尾加上相关标签。',
    category: 'Writing',
    tags: ['社交媒体', '营销', '文案'],
    outputType: 'text',
    applicationScene: '故事创作',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: true,
    createdAt: Date.now() - 10000
  },
  {
    id: '3',
    title: 'Git Commit 生成器',
    description: '根据 Diff 内容生成符合规范的提交信息。',
    systemInstruction:
      '你是一个 Git Commit 消息生成助手。你严格遵守 Conventional Commits 规范 (feat, fix, docs, style, refactor, test, chore)。只输出 Commit Message，不输出其他废话。',
    content:
      '分析以下的 git diff 内容，并生成 3 个高质量的 commit message 选项。\n\nDiff 内容:\n{diff}',
    englishPrompt:
      'Analyze the following git diff and generate **3 high-quality commit message options** following the Conventional Commits spec (feat, fix, docs, style, refactor, test, chore).\n\nDiff:\n{diff}',
    chinesePrompt:
      '分析以下的 git diff 内容，并生成 3 个高质量的 commit message 选项，必须严格遵守 Conventional Commits 规范（feat, fix, docs, style, refactor, test, chore）。\n\nDiff 内容：\n{diff}',
    category: 'Code',
    tags: ['Git', '生产力'],
    outputType: 'text',
    applicationScene: '工具使用',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: false,
    createdAt: Date.now() - 20000
  },
  {
    id: '4',
    title: '复杂概念通俗解释',
    description: '用简单的类比向外行解释复杂的概念。',
    systemInstruction:
      '你是一位擅长科普的老师，类似费曼技巧的实践者。你能将极其晦涩的专业术语转化为生活中的常见场景和类比，让小学生也能听懂。',
    content: '请解释以下概念：\n\n概念：{concept}',
    englishPrompt:
      'Please explain the following concept in simple terms using vivid analogies and examples from everyday life. Imagine you are teaching a smart 12-year-old.\n\nConcept:\n{concept}',
    chinesePrompt:
      '请用类比和生活中的例子，通俗地解释下面这个概念，假设你的听众是一个聪明的小学生。\n\n概念：\n{concept}',
    category: 'Ideas',
    tags: ['学习', '解释'],
    outputType: 'text',
    applicationScene: '工具使用',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: false,
    createdAt: Date.now() - 30000
  },
  {
    id: '5',
    title: '中英互译专家',
    description: '地道、信达雅的中英文互译。',
    systemInstruction:
      '你是一位精通中英文的专业翻译家。不要逐字翻译，要意译，确保语气和语境符合目标语言的习惯，追求“信达雅”。',
    content: '请将以下文本翻译成{target_language}：\n\n文本：\n{text}',
    englishPrompt:
      'Please translate the following text into {target_language}.\n\nRequirements:\n- Focus on meaning, not word-for-word translation.\n- Make the tone natural and idiomatic for the target language.\n- Preserve style and intent.\n\nText:\n{text}',
    chinesePrompt:
      '请将以下文本翻译成 {target_language}。\n\n要求：\n- 注重“意译”而不是逐字翻译；\n- 语气自然、地道，符合目标语言的表达习惯；\n- 尽量保留原文的风格与意图。\n\n文本：\n{text}',
    category: 'Writing',
    tags: ['翻译', '语言'],
    outputType: 'text',
    applicationScene: '工具使用',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: true,
    createdAt: Date.now() - 40000
  },
  {
    id: '6',
    title: 'SWOT 分析助手',
    description: '对商业创意或产品进行 SWOT 分析。',
    systemInstruction:
      '你是一位麦肯锡咨询顾问，擅长战略分析。思维结构化，逻辑严密。',
    content:
      '请对 {product_or_idea} 进行详细的 SWOT 分析（优势、劣势、机会、威胁）。\n\n分析后，请给出 3 条具体的战略建议。',
    englishPrompt:
      'Please perform a detailed SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for {product_or_idea}.\n\nAfter the analysis, provide **3 concrete strategic recommendations**.',
    chinesePrompt:
      '请对 {product_or_idea} 进行详细的 SWOT 分析（优势、劣势、机会、威胁）。\n\n在分析之后，请给出 3 条具体且可执行的战略建议。',
    category: 'Analysis',
    tags: ['商业', '策略'],
    outputType: 'text',
    applicationScene: '工具使用',
    recommendedModels: ['Gemini 2.5 Flash'],
    isFavorite: false,
    createdAt: Date.now() - 50000
  }
];

/**
 * Validate prompt data structure
 */
const isValidPrompt = (obj: any): obj is Prompt => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.tags) &&
    typeof obj.isFavorite === 'boolean' &&
    typeof obj.createdAt === 'number' &&
    // 确保 examples 字段如果存在，必须是数组
    (obj.examples === undefined || Array.isArray(obj.examples))
  );
};

/**
 * Validate and sanitize prompts array
 */
const validateAndSanitizePrompts = (data: any): Prompt[] => {
  if (!Array.isArray(data)) {
    console.warn("Prompts data is not an array, resetting to seed data");
    return SEED_DATA;
  }

  const validPrompts: Prompt[] = [];
  const invalidCount = data.length;

  data.forEach((item, index) => {
    if (isValidPrompt(item)) {
      // 确保 examples 被正确保留（即使是空数组也要保留）
      const sanitizedExamples = Array.isArray(item.examples)
        ? item.examples.filter((ex: any) =>
          ex &&
          typeof ex === 'object' &&
          typeof ex.input === 'string' &&
          typeof ex.output === 'string'
        )
        : undefined;

      // Ensure all required fields exist with defaults
      validPrompts.push({
        ...item,
        systemInstruction: item.systemInstruction || undefined,
        examples: sanitizedExamples, // 保留有效的 examples
        config: item.config || undefined,
        history: Array.isArray(item.history) ? item.history : undefined,
        savedRuns: Array.isArray(item.savedRuns) ? item.savedRuns : undefined,
        lastVariableValues: item.lastVariableValues || undefined,
        deletedAt: typeof item.deletedAt === 'number' ? item.deletedAt : undefined,
      });
    } else {
      console.warn(`Invalid prompt at index ${index}, skipping`);
    }
  });

  if (validPrompts.length < invalidCount) {
    console.warn(`Recovered ${validPrompts.length} out of ${invalidCount} prompts. Invalid entries were skipped.`);
  }

  // If no valid prompts found, return seed data
  return validPrompts.length > 0 ? validPrompts : SEED_DATA;
};

export const getPrompts = (): Prompt[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    const parsed = JSON.parse(stored);
    const validated = validateAndSanitizePrompts(parsed);

    // If validation fixed issues, save the cleaned data
    if (validated.length !== parsed.length || JSON.stringify(validated) !== JSON.stringify(parsed)) {
      console.info("Data validation fixed issues, saving cleaned data");
      savePrompts(validated);
    }

    return validated;
  } catch (e) {
    console.error("Failed to parse prompts, resetting to seed data", e);
    // Clear corrupted data and reset
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
};

export const savePrompts = (prompts: Prompt[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

export const getCustomCategories = (): string[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    // Validate it's an array of strings
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
    console.warn("Invalid categories format, resetting");
    return [];
  } catch (e) {
    console.error("Failed to parse categories", e);
    return [];
  }
};

export const saveCustomCategories = (categories: string[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getUserTheme = (): string => {
  const stored = localStorage.getItem(THEME_KEY);
  // Normalize legacy value "default" to the actual theme id
  if (!stored || stored === 'default') return 'theme-default';
  return stored;
};

export const saveUserTheme = (themeId: string) => {
  localStorage.setItem(THEME_KEY, themeId);
};

export interface FilterState {
  selectedCategory: string;
  selectedTag?: string;
  searchQuery: string;
  currentView: PromptView;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  favoritesOnly?: boolean;
  recentOnly?: boolean;
}

export const getFilterState = (): FilterState | null => {
  const stored = localStorage.getItem(FILTERS_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    // Validate structure
    if (parsed && typeof parsed.selectedCategory === 'string' && typeof parsed.searchQuery === 'string') {
      return {
        selectedCategory: parsed.selectedCategory,
        selectedTag: parsed.selectedTag || undefined,
        searchQuery: parsed.searchQuery || '',
        currentView: parsed.currentView || 'grid',
        sortBy: parsed.sortBy || 'createdAt',
        sortOrder: parsed.sortOrder || 'desc',
        favoritesOnly: !!parsed.favoritesOnly,
        recentOnly: !!parsed.recentOnly
      };
    }
    return null;
  } catch (e) {
    console.error("Failed to parse filter state", e);
    return null;
  }
};

export const saveFilterState = (filters: FilterState) => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (e) {
    console.error("Failed to save filter state", e);
  }
};

// --- IndexedDB for File System Access API Handles ---

const DB_NAME = 'PromptRayDB';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveDirectoryHandle = async (key: string, handle: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error("Failed to save directory handle to IDB", e);
  }
};

export const getDirectoryHandle = async (key: string): Promise<any | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error("Failed to get directory handle from IDB", e);
    return null;
  }
};
