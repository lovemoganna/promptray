import { Prompt } from '../types';
import type { PromptView, SortBy, SortOrder } from '../constants';

// Note: Unified APIs are exported at the end of the file to maintain backward compatibility

// =============================================================================
// Storage Strategy Configuration (Phase 4: Integration)
// =============================================================================

// Storage backend selection
export enum StorageBackend {
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB',
  HYBRID = 'hybrid', // Try IndexedDB first, fallback to localStorage
  DUCKDB = 'duckdb' // DuckDB-WASM with OPFS persistence (experimental)
}

// Change this to StorageBackend.DUCKDB to use DuckDB-WASM
const STORAGE_BACKEND: string = StorageBackend.HYBRID; // Configurable

// Feature flags for gradual rollout
const FEATURE_FLAGS = {
  useIndexedDBForPrompts: true,
  useIndexedDBForSettings: true,
  enableMigrationOnStartup: true, // Set to true to enable automatic migration
  keepLocalStorageBackup: true, // Keep localStorage as backup during transition
  enableDuckDBExperimental: true, // Enable DuckDB-WASM features
};

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
  try {
    const payload = JSON.stringify(prompts);
    // Atomic write: write to temp key then rename to avoid partial writes
    const tempKey = `${STORAGE_KEY}_tmp`;
    localStorage.setItem(tempKey, payload);
    localStorage.setItem(STORAGE_KEY, payload);
    try { localStorage.setItem(`${STORAGE_KEY}_last_saved_at`, String(Date.now())); } catch {}
    try { localStorage.setItem(`${STORAGE_KEY}_last_saved_payload`, payload.slice(0, 20000)); } catch {}
    try { console.debug('savePrompts payload length:', payload.length); } catch {}
    // debug instrumentation removed
  } catch (e) {
    console.error('Failed to save prompts to localStorage:', e);
  }
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
  selectedProvider?: string;
  selectedModel?: string;
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

// =============================================================================
// Unified Storage API (Phase 4: Integration Layer)
// =============================================================================

// Prompts API - Unified interface
export const getPromptsUnified = async (): Promise<Prompt[]> => {
  if (STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid') {
    try {
      return await getPromptsFromIDB();
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        return getPrompts(); // Fallback to localStorage
      }
      throw error;
    }
  }
  return getPrompts(); // localStorage only
};

export const savePromptsUnified = async (prompts: Prompt[]): Promise<void> => {
  if (STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid') {
    try {
      await savePromptsToIDB(prompts);
      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        // Keep localStorage backup during transition
        savePrompts(prompts);
      }
    } catch (error) {
      console.warn('IndexedDB save failed, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        savePrompts(prompts); // Fallback to localStorage
      } else {
        throw error;
      }
    }
  } else {
    savePrompts(prompts); // localStorage only
  }
};

export const savePromptUnified = async (prompt: Prompt): Promise<void> => {
  if (STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid') {
    try {
      await savePromptToIDB(prompt);
      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        // Update localStorage backup
        const prompts = getPrompts();
        const existingIndex = prompts.findIndex(p => p.id === prompt.id);
        if (existingIndex >= 0) {
          prompts[existingIndex] = prompt;
        } else {
          prompts.push(prompt);
        }
        savePrompts(prompts);
      }
    } catch (error) {
      console.warn('IndexedDB save failed, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        // Fallback: update localStorage
        const prompts = getPrompts();
        const existingIndex = prompts.findIndex(p => p.id === prompt.id);
        if (existingIndex >= 0) {
          prompts[existingIndex] = prompt;
        } else {
          prompts.push(prompt);
        }
        savePrompts(prompts);
      } else {
        throw error;
      }
    }
  } else {
    // Update single prompt in localStorage
    const prompts = getPrompts();
    const existingIndex = prompts.findIndex(p => p.id === prompt.id);
    if (existingIndex >= 0) {
      prompts[existingIndex] = prompt;
    } else {
      prompts.push(prompt);
    }
    savePrompts(prompts);
  }
};

export const deletePromptUnified = async (promptId: string): Promise<void> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      await deletePromptFromIDB(promptId);
      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        // Update localStorage backup
        const prompts = getPrompts();
        const filteredPrompts = prompts.filter(p => p.id !== promptId);
        savePrompts(filteredPrompts);
      }
    } catch (error) {
      console.warn('IndexedDB delete failed, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        const prompts = getPrompts();
        const filteredPrompts = prompts.filter(p => p.id !== promptId);
        savePrompts(filteredPrompts);
      } else {
        throw error;
      }
    }
  } else {
    const prompts = getPrompts();
    const filteredPrompts = prompts.filter(p => p.id !== promptId);
    savePrompts(filteredPrompts);
  }
};

// Categories API - Unified interface
export const getCustomCategoriesUnified = async (): Promise<string[]> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      return await getCategoriesFromIDB();
    } catch (error) {
      console.warn('IndexedDB failed for categories, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        return getCustomCategories();
      }
      throw error;
    }
  }
  return getCustomCategories();
};

export const saveCustomCategoriesUnified = async (categories: string[]): Promise<void> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      await saveCategoriesToIDB(categories);
      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        saveCustomCategories(categories);
      }
    } catch (error) {
      console.warn('IndexedDB save failed for categories, falling back to localStorage:', error);
      if (STORAGE_BACKEND === 'hybrid') {
        saveCustomCategories(categories);
      } else {
        throw error;
      }
    }
  } else {
    saveCustomCategories(categories);
  }
};

// Settings API - Unified interface with caching
const settingsCache = new Map<string, any>();

export const getUserThemeUnified = async (): Promise<string> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      const cached = settingsCache.get('user_theme');
      if (cached !== undefined) return cached;

      const stored = await getSettingFromIDB('user_theme');
      if (stored) {
        settingsCache.set('user_theme', stored);
        return stored;
      }

      // Fallback to localStorage
      const legacy = getUserTheme();
      if (legacy) {
        settingsCache.set('user_theme', legacy);
        // Migrate to IndexedDB in background
        saveSettingToIDB('user_theme', legacy).catch(err =>
          console.warn('Failed to migrate theme to IndexedDB:', err)
        );
        return legacy;
      }

      return 'theme-default';
    } catch (error) {
      console.warn('IndexedDB failed for theme, using localStorage:', error);
      return getUserTheme();
    }
  }
  return getUserTheme();
};

export const saveUserThemeUnified = async (themeId: string): Promise<void> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      await saveSettingToIDB('user_theme', themeId);
      settingsCache.set('user_theme', themeId);

      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        saveUserTheme(themeId);
      }
    } catch (error) {
      console.warn('IndexedDB save failed for theme, falling back to localStorage:', error);
      saveUserTheme(themeId);
    }
  } else {
    saveUserTheme(themeId);
  }
};

export const getFilterStateUnified = async (): Promise<FilterState | null> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      const cached = settingsCache.get('filter_state');
      if (cached !== undefined) return cached;

      const stored = await getSettingFromIDB('filter_state');
      if (stored) {
        settingsCache.set('filter_state', stored);
        return stored;
      }

      // Fallback to localStorage
      const legacy = getFilterState();
      if (legacy) {
        settingsCache.set('filter_state', legacy);
        // Migrate to IndexedDB in background
        saveSettingToIDB('filter_state', legacy).catch(err =>
          console.warn('Failed to migrate filters to IndexedDB:', err)
        );
        return legacy;
      }

      return null;
    } catch (error) {
      console.warn('IndexedDB failed for filters, using localStorage:', error);
      return getFilterState();
    }
  }
  return getFilterState();
};

export const saveFilterStateUnified = async (filters: FilterState): Promise<void> => {
  const useIDB = STORAGE_BACKEND === 'indexedDB' || STORAGE_BACKEND === 'hybrid';

  if (useIDB) {
    try {
      await saveSettingToIDB('filter_state', filters);
      settingsCache.set('filter_state', filters);

      if (FEATURE_FLAGS.keepLocalStorageBackup && STORAGE_BACKEND === 'hybrid') {
        saveFilterState(filters);
      }
    } catch (error) {
      console.warn('IndexedDB save failed for filters, falling back to localStorage:', error);
      saveFilterState(filters);
    }
  } else {
    saveFilterState(filters);
  }
};

// --- IndexedDB Database Configuration ---

const DB_NAME = 'PromptRayDB';
const DB_VERSION = 2; // Upgrade from v1 to v2 for full data migration

// Object Store Names
const STORE_PROMPTS = 'prompts';
const STORE_CATEGORIES = 'categories';
const STORE_THEMES = 'themes';
const STORE_FILTERS = 'filters';
const STORE_SETTINGS = 'settings';
const STORE_HANDLES = 'handles'; // Legacy file handles

// IndexedDB Schema Definition (for documentation purposes)

// Database Initialization with Migration Support
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      console.info(`Upgrading IndexedDB from v${oldVersion} to v${DB_VERSION}`);

      // Migration logic based on version
      if (oldVersion < 1) {
        // Create initial schema (v1)
        createInitialSchema(db);
      }

      if (oldVersion < 2) {
        // Upgrade to v2: Full data migration from localStorage
        upgradeToV2(db);
      }
    };
  });
};

const createInitialSchema = (db: IDBDatabase) => {
  // Handles store (legacy from v1)
  if (!db.objectStoreNames.contains(STORE_HANDLES)) {
    db.createObjectStore(STORE_HANDLES);
  }
};

const upgradeToV2 = (db: IDBDatabase) => {
  // Create new object stores for v2
  if (!db.objectStoreNames.contains(STORE_PROMPTS)) {
    const promptsStore = db.createObjectStore(STORE_PROMPTS, { keyPath: 'id' });
    // Create indexes for common queries
    promptsStore.createIndex('category', 'category', { unique: false });
    promptsStore.createIndex('isFavorite', 'isFavorite', { unique: false });
    promptsStore.createIndex('createdAt', 'createdAt', { unique: false });
    promptsStore.createIndex('status', 'status', { unique: false });
    promptsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
  }

  if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
    const categoriesStore = db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
    categoriesStore.createIndex('name', 'name', { unique: true });
  }

  if (!db.objectStoreNames.contains(STORE_THEMES)) {
    db.createObjectStore(STORE_THEMES, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(STORE_FILTERS)) {
    db.createObjectStore(STORE_FILTERS, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
    const settingsStore = db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
    settingsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
};

// =============================================================================
// IndexedDB CRUD Operations (Phase 2 Implementation)
// =============================================================================

// --- Prompts Operations ---
export const getPromptsFromIDB = async (): Promise<Prompt[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROMPTS, 'readonly');
      const store = transaction.objectStore(STORE_PROMPTS);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Failed to get prompts from IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        let prompts = request.result || [];

        // If no data in IndexedDB, try to migrate from localStorage
        if (prompts.length === 0) {
          console.info('No prompts in IndexedDB, attempting migration from localStorage');
          const legacyPrompts = getPrompts(); // Get from localStorage
          if (legacyPrompts.length > 0) {
            // Migrate in background
            savePromptsToIDB(legacyPrompts).then(() => {
              console.info('Successfully migrated prompts to IndexedDB');
            }).catch(err => {
              console.error('Failed to migrate prompts to IndexedDB:', err);
            });
            prompts = legacyPrompts;
          } else {
            // Use seed data
            prompts = SEED_DATA;
            savePromptsToIDB(prompts).catch(err => {
              console.error('Failed to save seed data to IndexedDB:', err);
            });
          }
        }

        resolve(prompts);
      };
    });
  } catch (e) {
    console.error('Failed to open IndexedDB for prompts:', e);
    // Fallback to localStorage
    return getPrompts();
  }
};

export const savePromptsToIDB = async (prompts: Prompt[]): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROMPTS);

      // Clear existing data
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);

      clearRequest.onsuccess = () => {
        // Add all prompts
        let completed = 0;
        const total = prompts.length;

        if (total === 0) {
          resolve();
          return;
        }

        prompts.forEach(prompt => {
          const request = store.add(prompt);
          request.onerror = () => {
            console.error('Failed to save prompt:', prompt.id, request.error);
            // Continue with other prompts
            completed++;
            if (completed === total) resolve();
          };
          request.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
        });
      };
    });
  } catch (e) {
    console.error('Failed to save prompts to IndexedDB:', e);
    throw e;
  }
};

export const savePromptToIDB = async (prompt: Prompt): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROMPTS);
      const request = store.put(prompt);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to save single prompt to IndexedDB:', e);
    throw e;
  }
};

export const deletePromptFromIDB = async (promptId: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROMPTS);
      const request = store.delete(promptId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to delete prompt from IndexedDB:', e);
    throw e;
  }
};

// --- Categories Operations ---
export const getCategoriesFromIDB = async (): Promise<string[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CATEGORIES, 'readonly');
      const store = transaction.objectStore(STORE_CATEGORIES);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const categories = request.result || [];
        const categoryNames = categories.map(cat => cat.name);

        // If no data in IndexedDB, migrate from localStorage
        if (categoryNames.length === 0) {
          const legacyCategories = getCustomCategories();
          if (legacyCategories.length > 0) {
            saveCategoriesToIDB(legacyCategories).catch(err => {
              console.error('Failed to migrate categories to IndexedDB:', err);
            });
            resolve(legacyCategories);
          } else {
            resolve([]);
          }
        } else {
          resolve(categoryNames);
        }
      };
    });
  } catch (e) {
    console.error('Failed to get categories from IndexedDB:', e);
    return getCustomCategories(); // Fallback
  }
};

export const saveCategoriesToIDB = async (categories: string[]): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CATEGORIES, 'readwrite');
      const store = transaction.objectStore(STORE_CATEGORIES);

      // Clear existing data
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);

      clearRequest.onsuccess = () => {
        // Add all categories
        let completed = 0;
        const total = categories.length;

        if (total === 0) {
          resolve();
          return;
        }

        categories.forEach(categoryName => {
          const category = {
            id: `category_${categoryName}`,
            name: categoryName,
            createdAt: Date.now()
          };

          const request = store.add(category);
          request.onerror = () => {
            console.error('Failed to save category:', categoryName, request.error);
            completed++;
            if (completed === total) resolve();
          };
          request.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
        });
      };
    });
  } catch (e) {
    console.error('Failed to save categories to IndexedDB:', e);
    throw e;
  }
};

// --- Settings Operations (Theme, Filters, etc.) ---
export const getSettingFromIDB = async (key: string): Promise<any> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.value);
      };
    });
  } catch (e) {
    console.error('Failed to get setting from IndexedDB:', key, e);
    return null;
  }
};

export const saveSettingToIDB = async (key: string, value: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);

      const setting = {
        key,
        value,
        updatedAt: Date.now()
      };

      const request = store.put(setting);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Failed to save setting to IndexedDB:', key, e);
    throw e;
  }
};

// --- Legacy File Handle Operations (保持兼容性) ---
export const saveDirectoryHandle = async (key: string, handle: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_HANDLES, 'readwrite');
      const store = transaction.objectStore(STORE_HANDLES);
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
      const transaction = db.transaction(STORE_HANDLES, 'readonly');
      const store = transaction.objectStore(STORE_HANDLES);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error("Failed to get directory handle from IDB", e);
    return null;
  }
};

// =============================================================================
// Migration Utilities (Phase 3)
// =============================================================================

export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  errors: string[];
  duration: number;
}

export const migrateAllDataToIDB = async (): Promise<MigrationResult> => {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalMigrated = 0;

  try {
    // 1. Migrate prompts
    console.info('Starting prompts migration...');
    const prompts = getPrompts(); // From localStorage
    if (prompts.length > 0) {
      await savePromptsToIDB(prompts);
      totalMigrated += prompts.length;
      console.info(`Migrated ${prompts.length} prompts`);
    }

    // 2. Migrate categories
    console.info('Starting categories migration...');
    const categories = getCustomCategories();
    if (categories.length > 0) {
      await saveCategoriesToIDB(categories);
      totalMigrated += categories.length;
      console.info(`Migrated ${categories.length} categories`);
    }

    // 3. Migrate theme
    console.info('Starting theme migration...');
    const themeId = getUserTheme();
    if (themeId) {
      await saveSettingToIDB('user_theme', themeId);
      totalMigrated += 1;
      console.info('Migrated user theme');
    }

    // 4. Migrate filters
    console.info('Starting filters migration...');
    const filters = getFilterState();
    if (filters) {
      await saveSettingToIDB('filter_state', filters);
      totalMigrated += 1;
      console.info('Migrated filter state');
    }

    // 5. Migrate audit endpoint
    const auditEndpoint = typeof window !== 'undefined' ? localStorage.getItem('prompt_audit_endpoint') : null;
    if (auditEndpoint) {
      await saveSettingToIDB('audit_endpoint', auditEndpoint);
      totalMigrated += 1;
      console.info('Migrated audit endpoint');
    }

    return {
      success: true,
      migratedItems: totalMigrated,
      errors,
      duration: Date.now() - startTime
    };

  } catch (error) {
    console.error('Migration failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      migratedItems: totalMigrated,
      errors,
      duration: Date.now() - startTime
    };
  }
};

export const clearLegacyLocalStorage = (): void => {
  try {
    // Only clear our app's keys, keep others
    const keysToRemove = [
      STORAGE_KEY,
      CATEGORIES_KEY,
      THEME_KEY,
      FILTERS_KEY,
      'prompt_audit_endpoint'
    ];

    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
      try { localStorage.removeItem(`${key}_tmp`); } catch {}
      try { localStorage.removeItem(`${key}_last_saved_at`); } catch {}
      try { localStorage.removeItem(`${key}_last_saved_payload`); } catch {}
    });

    console.info('Cleared legacy localStorage data');
  } catch (e) {
    console.error('Failed to clear legacy localStorage:', e);
  }
};

// =============================================================================
// Migration Manager (Phase 3: Migration & Initialization)
// =============================================================================

export interface MigrationStatus {
  isCompleted: boolean;
  lastMigrationAt?: number;
  version: string;
  migratedItems: number;
  errors: string[];
}

const MIGRATION_STATUS_KEY = 'migration_status_v1';

export const getMigrationStatus = async (): Promise<MigrationStatus> => {
  try {
    const stored = await getSettingFromIDB(MIGRATION_STATUS_KEY);
    if (stored) return stored;

    // Check localStorage for legacy migration status
    const legacyStatus = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (legacyStatus) {
      try {
        const parsed = JSON.parse(legacyStatus);
        // Migrate status to IndexedDB
        await saveSettingToIDB(MIGRATION_STATUS_KEY, parsed);
        return parsed;
      } catch {}
    }

    return {
      isCompleted: false,
      version: '1.0.0',
      migratedItems: 0,
      errors: []
    };
  } catch (e) {
    console.error('Failed to get migration status:', e);
    return {
      isCompleted: false,
      version: '1.0.0',
      migratedItems: 0,
      errors: [e instanceof Error ? e.message : 'Unknown error']
    };
  }
};

export const saveMigrationStatus = async (status: MigrationStatus): Promise<void> => {
  try {
    await saveSettingToIDB(MIGRATION_STATUS_KEY, {
      ...status,
      lastMigrationAt: Date.now()
    });
  } catch (e) {
    console.error('Failed to save migration status:', e);
    // Fallback to localStorage
    try {
      localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify({
        ...status,
        lastMigrationAt: Date.now()
      }));
    } catch {}
  }
};

// Automatic migration on app startup
export const initializeStorageMigration = async (): Promise<MigrationStatus> => {
  if (!FEATURE_FLAGS.enableMigrationOnStartup) {
    console.info('Automatic migration disabled, skipping...');
    return await getMigrationStatus();
  }

  const currentStatus = await getMigrationStatus();

  if (currentStatus.isCompleted) {
    console.info('Migration already completed, skipping...');
    return currentStatus;
  }

  console.info('Starting automatic data migration to IndexedDB...');

  try {
    const result = await migrateAllDataToIDB();

    if (result.success) {
      const newStatus: MigrationStatus = {
        isCompleted: true,
        lastMigrationAt: Date.now(),
        version: '2.0.0',
        migratedItems: result.migratedItems,
        errors: result.errors
      };

      await saveMigrationStatus(newStatus);

      console.info(`Migration completed successfully! Migrated ${result.migratedItems} items in ${result.duration}ms`);

      // Optionally clear legacy data after successful migration
      if (result.errors.length === 0) {
        setTimeout(() => {
          console.info('Clearing legacy localStorage data...');
          clearLegacyLocalStorage();
        }, 5000); // Delay to ensure everything works
      }

      return newStatus;
    } else {
      console.error('Migration failed:', result.errors);
      const failedStatus: MigrationStatus = {
        ...currentStatus,
        errors: [...currentStatus.errors, ...result.errors]
      };
      await saveMigrationStatus(failedStatus);
      return failedStatus;
    }

  } catch (error) {
    console.error('Migration initialization failed:', error);
    const errorStatus: MigrationStatus = {
      ...currentStatus,
      errors: [...currentStatus.errors, error instanceof Error ? error.message : 'Migration failed']
    };
    await saveMigrationStatus(errorStatus);
    return errorStatus;
  }
};

// =============================================================================
// Data Export/Import Utilities (Phase 5: Advanced Features)
// =============================================================================

export interface ExportData {
  version: string;
  exportedAt: number;
  prompts: Prompt[];
  categories: string[];
  settings: Record<string, any>;
  migrationStatus: MigrationStatus;
}

export const exportAllData = async (): Promise<ExportData> => {
  try {
    const [prompts, categories, migrationStatus] = await Promise.all([
      getPromptsUnified(),
      getCustomCategoriesUnified(),
      getMigrationStatus()
    ]);

    // Collect all settings
    const settings: Record<string, any> = {};
    const settingKeys = ['user_theme', 'filter_state', 'audit_endpoint'];

    for (const key of settingKeys) {
      try {
        const value = await getSettingFromIDB(key);
        if (value !== null && value !== undefined) {
          settings[key] = value;
        }
      } catch {}
    }

    return {
      version: '2.0.0',
      exportedAt: Date.now(),
      prompts,
      categories,
      settings,
      migrationStatus
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

export const importData = async (data: ExportData): Promise<{ success: boolean; importedItems: number; errors: string[] }> => {
  const errors: string[] = [];
  let importedItems = 0;

  try {
    // Validate data structure
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid prompts data');
    }

    // Import prompts
    if (data.prompts.length > 0) {
      await savePromptsUnified(data.prompts);
      importedItems += data.prompts.length;
    }

    // Import categories
    if (data.categories && Array.isArray(data.categories)) {
      await saveCustomCategoriesUnified(data.categories);
      importedItems += data.categories.length;
    }

    // Import settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        try {
          await saveSettingToIDB(key, value);
          importedItems += 1;
        } catch (error) {
          errors.push(`Failed to import setting ${key}: ${error}`);
        }
      }
    }

    // Update migration status
    if (data.migrationStatus) {
      await saveMigrationStatus(data.migrationStatus);
    }

    return {
      success: true,
      importedItems,
      errors
    };

  } catch (error) {
    console.error('Failed to import data:', error);
    return {
      success: false,
      importedItems,
      errors: [...errors, error instanceof Error ? error.message : 'Import failed']
    };
  }
};

// Clear all data (for testing or reset)
export const clearAllData = async (): Promise<void> => {
  try {
    const db = await openDB();

    const transaction = db.transaction([
      STORE_PROMPTS,
      STORE_CATEGORIES,
      STORE_THEMES,
      STORE_FILTERS,
      STORE_SETTINGS,
      STORE_HANDLES
    ], 'readwrite');

    // Clear all stores
    const stores = [
      STORE_PROMPTS,
      STORE_CATEGORIES,
      STORE_THEMES,
      STORE_FILTERS,
      STORE_SETTINGS,
      STORE_HANDLES
    ];

    const clearPromises = stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(storeName).clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    });

    await Promise.all(clearPromises);

    // Clear localStorage as well
    clearLegacyLocalStorage();

    // Clear cache
    settingsCache.clear();

    console.info('All data cleared successfully');
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
};
