import { Prompt, PromptStatus } from '../types';
import { getPrompts } from './storageService';

// DuckDB WASM imports
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

// DuckDB 实例
let db: duckdb.AsyncDuckDB | null = null;
let isInitialized = false;

/**
 * 初始化真正的 DuckDB 数据库
 */
export async function initializeDuckDB(): Promise<void> {
  if (isInitialized) return;

  try {
    console.info('Initializing real DuckDB database...');

    // 创建 DuckDB 实例
    db = new duckdb.AsyncDuckDB();

    // 初始化 worker 和 WASM
    await db.instantiate(
      duckdb_worker,
      duckdb_wasm,
      {
        persistent: true, // 启用持久化存储
        persistentStorage: 'indexeddb' // 使用 IndexedDB 作为底层存储
      }
    );

    // 创建数据库表
    await createTables();

    // 从主存储服务同步现有数据（如果需要）
    await syncFromMainStorage();

    isInitialized = true;
    console.info('DuckDB database initialized successfully');

  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

/**
 * 创建数据库表结构
 */
async function createTables(): Promise<void> {
  if (!db) throw new Error('DuckDB not initialized');

  console.info('Creating database tables...');

  // 主提示词表
  await db.run(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      english_prompt TEXT,
      chinese_prompt TEXT,
      system_instruction TEXT,
      examples TEXT, -- JSON string
      description TEXT,
      category TEXT,
      tags TEXT, -- JSON array string
      output_type TEXT,
      application_scene TEXT,
      technical_tags TEXT, -- JSON array string
      style_tags TEXT, -- JSON array string
      custom_labels TEXT, -- JSON array string
      preview_media_url TEXT,
      source TEXT,
      source_author TEXT,
      source_url TEXT,
      recommended_models TEXT, -- JSON array string
      language TEXT,
      visibility TEXT,
      usage_notes TEXT,
      cautions TEXT,
      extracted TEXT, -- JSON string
      collected_at INTEGER,
      is_favorite BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'active',
      config TEXT, -- JSON string
      history TEXT, -- JSON string
      saved_runs TEXT, -- JSON string
      last_variable_values TEXT, -- JSON string
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      deleted_at INTEGER
    )
  `);

  // 设置表
  await db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    )
  `);

  // SQL 历史记录表
  await db.run(`
    CREATE TABLE IF NOT EXISTS sql_history (
      id TEXT PRIMARY KEY,
      input_type TEXT,
      input_text TEXT,
      generated_sql TEXT,
      executed_sql TEXT,
      timestamp INTEGER,
      execution_time INTEGER,
      result_count INTEGER,
      success INTEGER,
      error TEXT
    )
  `);

  // SQL 收藏表
  await db.run(`
    CREATE TABLE IF NOT EXISTS sql_favorites (
      id TEXT PRIMARY KEY,
      name TEXT,
      sql_text TEXT,
      created_at INTEGER,
      tags TEXT -- JSON array string
    )
  `);

  // 数据分析会话表
  await db.run(`
    CREATE TABLE IF NOT EXISTS analysis_sessions (
      id TEXT PRIMARY KEY,
      file_name TEXT,
      file_type TEXT,
      ai_response TEXT,
      created_at INTEGER
    )
  `);

  console.info('Database tables created successfully');
}

/**
 * 从主存储服务同步数据
 */
async function syncFromMainStorage(): Promise<void> {
  if (!db) throw new Error('DuckDB not initialized');

  try {
    // 检查是否已有数据
    const existingCount = await db.run(`SELECT COUNT(*) as count FROM prompts`);
    const countResult = await existingCount.get(0);
    const count = countResult?.count || 0;

    if (count === 0) {
      console.info('No existing data found, syncing from main storage...');

      const realPrompts = await getPrompts();
      console.info(`Found ${realPrompts.length} prompts to migrate`);

      // 批量插入提示词数据
      for (const prompt of realPrompts) {
        await insertPrompt(prompt);
      }

      console.info(`Successfully migrated ${realPrompts.length} prompts to DuckDB`);
    } else {
      console.info(`DuckDB already contains ${count} prompts, skipping sync`);
    }
  } catch (error) {
    console.error('Failed to sync from main storage:', error);
    throw error;
  }
}

/**
 * 获取所有提示词
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  const result = await db.run(`
    SELECT * FROM prompts
    WHERE deleted_at IS NULL
    ORDER BY updated_at DESC, created_at DESC
  `);

  const prompts: Prompt[] = [];
  for await (const row of result) {
    prompts.push(deserializePrompt(row));
  }

  return prompts;
}

/**
 * 根据 ID 获取单个提示词
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  const result = await db.run(`
    SELECT * FROM prompts
    WHERE id = ? AND deleted_at IS NULL
  `, [id]);

  const row = await result.get(0);
  return row ? deserializePrompt(row) : null;
}

/**
 * 插入新提示词
 */
export async function insertPrompt(prompt: Prompt): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  await db.run(`
    INSERT INTO prompts (
      id, title, content, english_prompt, chinese_prompt, system_instruction,
      examples, description, category, tags, output_type, application_scene,
      technical_tags, style_tags, custom_labels, preview_media_url, source,
      source_author, source_url, recommended_models, language, visibility,
      usage_notes, cautions, extracted, collected_at, is_favorite, status,
      config, history, saved_runs, last_variable_values, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, serializePrompt(prompt));

  console.info(`Inserted prompt: ${prompt.title}`);
}

/**
 * 更新提示词
 */
export async function updatePrompt(prompt: Prompt): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  const updatedPrompt = { ...prompt, updatedAt: Date.now() };

  await db.run(`
    UPDATE prompts SET
      title = ?, content = ?, english_prompt = ?, chinese_prompt = ?, system_instruction = ?,
      examples = ?, description = ?, category = ?, tags = ?, output_type = ?, application_scene = ?,
      technical_tags = ?, style_tags = ?, custom_labels = ?, preview_media_url = ?, source = ?,
      source_author = ?, source_url = ?, recommended_models = ?, language = ?, visibility = ?,
      usage_notes = ?, cautions = ?, extracted = ?, collected_at = ?, is_favorite = ?, status = ?,
      config = ?, history = ?, saved_runs = ?, last_variable_values = ?, updated_at = ?
    WHERE id = ?
  `, [...serializePrompt(updatedPrompt).slice(1), updatedPrompt.id]);

  console.info(`Updated prompt: ${prompt.title}`);
}

/**
 * 删除提示词（软删除）
 */
export async function deletePrompt(id: string): Promise<void> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  await db.run(`
    UPDATE prompts SET
      deleted_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `, [Date.now(), id]);

  console.info(`Soft deleted prompt: ${id}`);
}

/**
 * 执行原生 DuckDB SQL 查询
 */
export async function executeSQL(sql: string, params: any[] = []): Promise<any[]> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  try {
    console.info('Executing SQL:', sql);

    // 对于 SELECT 查询，直接运行并返回结果
    if (sql.trim().toLowerCase().startsWith('select')) {
      const result = await db.run(sql, params);
      const rows: any[] = [];

      // 收集所有行
      for await (const row of result) {
        rows.push(row.toJSON());
      }

      console.info(`Query returned ${rows.length} rows`);
      return rows;
    }

    // 对于修改查询（INSERT, UPDATE, DELETE），运行并返回影响行数
    else {
      const statement = await db.prepare(sql);

      if (params.length > 0) {
        await statement.bind(params);
      }

      const result = await statement.run();
      await statement.close();

      // DuckDB 的修改操作返回受影响的行数
      const affectedRows = result.length || 0;
      console.info(`Query affected ${affectedRows} rows`);

      return [{
        affected_rows: affectedRows,
        message: getSuccessMessage(sql)
      }];
    }

  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  totalPrompts: number;
  favoritePrompts: number;
  categories: number;
  totalTags: number;
}> {
  if (!isInitialized) await initializeDuckDB();
  if (!db) throw new Error('DuckDB not initialized');

  const result = await db.run(`
    SELECT
      COUNT(*) as total_prompts,
      SUM(CASE WHEN is_favorite THEN 1 ELSE 0 END) as favorite_prompts,
      COUNT(DISTINCT category) as categories,
      (SELECT COUNT(*) FROM (
        SELECT unnest(string_split(tags, ',')) as tag
        FROM prompts
        WHERE deleted_at IS NULL AND tags IS NOT NULL
      )) as total_tags
    FROM prompts
    WHERE deleted_at IS NULL
  `);

  const stats = await result.get(0);
  return {
    totalPrompts: Number(stats?.total_prompts || 0),
    favoritePrompts: Number(stats?.favorite_prompts || 0),
    categories: Number(stats?.categories || 0),
    totalTags: Number(stats?.total_tags || 0)
  };
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.terminate();
    db = null;
  }
  isInitialized = false;
  console.info('DuckDB database closed');
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 序列化 Prompt 对象为数据库字段数组
 */
function serializePrompt(prompt: Prompt): any[] {
  return [
    prompt.id,
    prompt.title,
    prompt.content,
    prompt.englishPrompt || null,
    prompt.chinesePrompt || null,
    prompt.systemInstruction || null,
    prompt.examples ? JSON.stringify(prompt.examples) : null,
    prompt.description,
    prompt.category,
    prompt.tags ? JSON.stringify(prompt.tags) : null,
    prompt.outputType || null,
    prompt.applicationScene || null,
    prompt.technicalTags ? JSON.stringify(prompt.technicalTags) : null,
    prompt.styleTags ? JSON.stringify(prompt.styleTags) : null,
    prompt.customLabels ? JSON.stringify(prompt.customLabels) : null,
    prompt.previewMediaUrl || null,
    prompt.source || null,
    prompt.sourceAuthor || null,
    prompt.sourceUrl || null,
    prompt.recommendedModels ? JSON.stringify(prompt.recommendedModels) : null,
    prompt.language || null,
    prompt.visibility || null,
    prompt.usageNotes || null,
    prompt.cautions || null,
    prompt.extracted ? JSON.stringify(prompt.extracted) : null,
    prompt.collectedAt || null,
    prompt.isFavorite,
    prompt.status || 'active',
    prompt.config ? JSON.stringify(prompt.config) : null,
    prompt.history ? JSON.stringify(prompt.history) : null,
    prompt.savedRuns ? JSON.stringify(prompt.savedRuns) : null,
    prompt.lastVariableValues ? JSON.stringify(prompt.lastVariableValues) : null,
    prompt.createdAt,
    prompt.updatedAt || null
  ];
}

/**
 * 从数据库行反序列化为 Prompt 对象
 */
function deserializePrompt(row: any): Prompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    englishPrompt: row.english_prompt || undefined,
    chinesePrompt: row.chinese_prompt || undefined,
    systemInstruction: row.system_instruction || undefined,
    examples: row.examples ? JSON.parse(row.examples) : undefined,
    description: row.description,
    category: row.category,
    tags: row.tags ? JSON.parse(row.tags) : [],
    outputType: row.output_type || undefined,
    applicationScene: row.application_scene || undefined,
    technicalTags: row.technical_tags ? JSON.parse(row.technical_tags) : undefined,
    styleTags: row.style_tags ? JSON.parse(row.style_tags) : undefined,
    customLabels: row.custom_labels ? JSON.parse(row.custom_labels) : undefined,
    previewMediaUrl: row.preview_media_url || undefined,
    source: row.source || undefined,
    sourceAuthor: row.source_author || undefined,
    sourceUrl: row.source_url || undefined,
    recommendedModels: row.recommended_models ? JSON.parse(row.recommended_models) : undefined,
    language: row.language || undefined,
    visibility: row.visibility as 'public' | 'private' || undefined,
    usageNotes: row.usage_notes || undefined,
    cautions: row.cautions || undefined,
    extracted: row.extracted ? JSON.parse(row.extracted) : undefined,
    collectedAt: row.collected_at || undefined,
    isFavorite: Boolean(row.is_favorite),
    status: row.status as PromptStatus || 'active',
    config: row.config ? JSON.parse(row.config) : undefined,
    history: row.history ? JSON.parse(row.history) : undefined,
    savedRuns: row.saved_runs ? JSON.parse(row.saved_runs) : undefined,
    lastVariableValues: row.last_variable_values ? JSON.parse(row.last_variable_values) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined
  };
}

/**
 * 根据 SQL 类型返回成功消息
 */
function getSuccessMessage(sql: string): string {
  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith('insert')) {
    return 'Record inserted successfully';
  } else if (sqlLower.startsWith('update')) {
    return 'Record updated successfully';
  } else if (sqlLower.startsWith('delete')) {
    return 'Record deleted successfully';
  } else if (sqlLower.startsWith('create')) {
    return 'Table created successfully';
  } else if (sqlLower.startsWith('alter')) {
    return 'Table altered successfully';
  } else if (sqlLower.startsWith('drop')) {
    return 'Table dropped successfully';
  }

  return 'Query executed successfully';
}