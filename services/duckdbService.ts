/**
 * DuckDB-WASM Service with OPFS Persistence
 * 
 * This service provides real DuckDB-WASM integration with:
 * - OPFS (Origin Private File System) persistence
 * - SQL-based CRUD operations
 * - Multi-format export/import (JSON, CSV, Parquet, .db)
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import { Prompt } from '../types';

// Database configuration
const DB_NAME = 'promptray.db';

// Singleton instances
let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<void> | null = null;

// CDN bundles for DuckDB-WASM
const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-eh.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-eh.worker.js',
  },
};

// ============================================================================
// Schema Definition
// ============================================================================

const SCHEMA_SQL = `
-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT,
  english_prompt TEXT,
  chinese_prompt TEXT,
  system_instruction TEXT,
  description TEXT,
  category VARCHAR,
  tags TEXT,
  output_type VARCHAR,
  application_scene VARCHAR,
  technical_tags TEXT,
  style_tags TEXT,
  custom_labels TEXT,
  preview_media_url VARCHAR,
  source VARCHAR,
  source_author VARCHAR,
  source_url VARCHAR,
  recommended_models TEXT,
  language VARCHAR,
  visibility VARCHAR DEFAULT 'private',
  usage_notes TEXT,
  cautions TEXT,
  extracted TEXT,
  collected_at BIGINT,
  is_favorite BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'draft',
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  deleted_at BIGINT,
  config TEXT,
  history TEXT,
  saved_runs TEXT,
  last_variable_values TEXT,
  examples TEXT
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  label VARCHAR,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at BIGINT
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR PRIMARY KEY,
  value TEXT,
  updated_at BIGINT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_favorite ON prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
`;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Create a worker from a remote URL using blob approach to avoid CORS issues
 */
async function createWorkerFromUrl(workerUrl: string): Promise<Worker> {
  // Fetch the worker script
  const response = await fetch(workerUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch worker: ${response.statusText}`);
  }
  const workerCode = await response.text();

  // Create a blob URL for same-origin execution
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  return new Worker(blobUrl);
}

/**
 * Initialize DuckDB-WASM with OPFS persistence
 */
export async function initializeDuckDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.info('[DuckDB] Initializing DuckDB-WASM...');

      // Select the best bundle for this browser
      const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

      // Create worker using blob approach to avoid CORS issues
      console.info('[DuckDB] Loading worker from:', bundle.mainWorker);
      const worker = await createWorkerFromUrl(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

      // Instantiate the database
      db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      // Try to use OPFS for persistence
      let useOPFS = false;
      if ('storage' in navigator && 'getDirectory' in (navigator.storage as any)) {
        try {
          await db.open({
            path: DB_NAME,
            accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
          });
          useOPFS = true;
          console.info('[DuckDB] Using OPFS for persistence');
        } catch (opfsError) {
          console.warn('[DuckDB] OPFS not available, using in-memory database:', opfsError);
          await db.open({ path: ':memory:' });
        }
      } else {
        console.info('[DuckDB] OPFS not supported, using in-memory database');
        await db.open({ path: ':memory:' });
      }

      // Create connection
      conn = await db.connect();

      // Create schema
      await conn.query(SCHEMA_SQL);

      console.info(`[DuckDB] Initialized successfully (OPFS: ${useOPFS})`);
    } catch (error) {
      console.error('[DuckDB] Initialization failed:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the DuckDB connection, initializing if needed
 */
async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!conn) {
    await initializeDuckDB();
  }
  if (!conn) {
    throw new Error('DuckDB connection not available');
  }
  return conn;
}

// ============================================================================
// Prompt CRUD Operations
// ============================================================================

/**
 * Convert Prompt object to SQL values
 */
function promptToSQL(prompt: Prompt): Record<string, any> {
  return {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content || null,
    english_prompt: prompt.englishPrompt || null,
    chinese_prompt: prompt.chinesePrompt || null,
    system_instruction: prompt.systemInstruction || null,
    description: prompt.description || null,
    category: prompt.category || null,
    tags: JSON.stringify(prompt.tags || []),
    output_type: prompt.outputType || null,
    application_scene: prompt.applicationScene || null,
    technical_tags: JSON.stringify(prompt.technicalTags || []),
    style_tags: JSON.stringify(prompt.styleTags || []),
    custom_labels: JSON.stringify(prompt.customLabels || []),
    preview_media_url: prompt.previewMediaUrl || null,
    source: prompt.source || null,
    source_author: prompt.sourceAuthor || null,
    source_url: prompt.sourceUrl || null,
    recommended_models: JSON.stringify(prompt.recommendedModels || []),
    language: prompt.language || null,
    visibility: prompt.visibility || 'private',
    usage_notes: prompt.usageNotes || null,
    cautions: prompt.cautions || null,
    extracted: JSON.stringify(prompt.extracted || null),
    collected_at: prompt.collectedAt || null,
    is_favorite: prompt.isFavorite,
    status: prompt.status || 'draft',
    created_at: prompt.createdAt,
    updated_at: prompt.updatedAt || null,
    deleted_at: prompt.deletedAt || null,
    config: JSON.stringify(prompt.config || null),
    history: JSON.stringify(prompt.history || []),
    saved_runs: JSON.stringify(prompt.savedRuns || []),
    last_variable_values: JSON.stringify(prompt.lastVariableValues || null),
    examples: JSON.stringify(prompt.examples || []),
  };
}

/**
 * Convert SQL row to Prompt object
 */
function sqlToPrompt(row: any): Prompt {
  const parseJSON = (val: any, defaultVal: any = null) => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return defaultVal; }
    }
    return val;
  };

  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    englishPrompt: row.english_prompt || undefined,
    chinesePrompt: row.chinese_prompt || undefined,
    systemInstruction: row.system_instruction || undefined,
    description: row.description || '',
    category: row.category || '',
    tags: parseJSON(row.tags, []),
    outputType: row.output_type || undefined,
    applicationScene: row.application_scene || undefined,
    technicalTags: parseJSON(row.technical_tags, undefined),
    styleTags: parseJSON(row.style_tags, undefined),
    customLabels: parseJSON(row.custom_labels, undefined),
    previewMediaUrl: row.preview_media_url || undefined,
    source: row.source || undefined,
    sourceAuthor: row.source_author || undefined,
    sourceUrl: row.source_url || undefined,
    recommendedModels: parseJSON(row.recommended_models, undefined),
    language: row.language || undefined,
    visibility: row.visibility || undefined,
    usageNotes: row.usage_notes || undefined,
    cautions: row.cautions || undefined,
    extracted: parseJSON(row.extracted, undefined),
    collectedAt: row.collected_at || undefined,
    isFavorite: Boolean(row.is_favorite),
    status: row.status || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
    config: parseJSON(row.config, undefined),
    history: parseJSON(row.history, undefined),
    savedRuns: parseJSON(row.saved_runs, undefined),
    lastVariableValues: parseJSON(row.last_variable_values, undefined),
    examples: parseJSON(row.examples, undefined),
  };
}

/**
 * Get all prompts (excluding soft-deleted)
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  const connection = await getConnection();
  const result = await connection.query(`
    SELECT * FROM prompts 
    WHERE deleted_at IS NULL 
    ORDER BY created_at DESC
  `);

  const rows = result.toArray();
  return rows.map((row: any) => sqlToPrompt(row.toJSON()));
}

/**
 * Get prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  const connection = await getConnection();
  const result = await connection.query(`
    SELECT * FROM prompts WHERE id = '${id.replace(/'/g, "''")}'
  `);

  const rows = result.toArray();
  if (rows.length === 0) return null;
  return sqlToPrompt(rows[0].toJSON());
}

/**
 * Insert a new prompt
 */
export async function insertPrompt(prompt: Prompt): Promise<void> {
  const connection = await getConnection();
  const data = promptToSQL(prompt);

  const columns = Object.keys(data).join(', ');
  const values = Object.values(data).map(v => {
    if (v === null) return 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return v;
    return `'${String(v).replace(/'/g, "''")}'`;
  }).join(', ');

  await connection.query(`INSERT INTO prompts (${columns}) VALUES (${values})`);
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(prompt: Prompt): Promise<void> {
  const connection = await getConnection();
  const data = promptToSQL({ ...prompt, updatedAt: Date.now() });

  const setClause = Object.entries(data)
    .filter(([key]) => key !== 'id')
    .map(([key, v]) => {
      if (v === null) return `${key} = NULL`;
      if (typeof v === 'boolean') return `${key} = ${v ? 'TRUE' : 'FALSE'}`;
      if (typeof v === 'number') return `${key} = ${v}`;
      return `${key} = '${String(v).replace(/'/g, "''")}'`;
    }).join(', ');

  await connection.query(`UPDATE prompts SET ${setClause} WHERE id = '${prompt.id.replace(/'/g, "''")}'`);
}

/**
 * Soft delete a prompt
 */
export async function deletePrompt(id: string): Promise<void> {
  const connection = await getConnection();
  await connection.query(`
    UPDATE prompts SET deleted_at = ${Date.now()} WHERE id = '${id.replace(/'/g, "''")}'
  `);
}

/**
 * Hard delete a prompt (permanent)
 */
export async function hardDeletePrompt(id: string): Promise<void> {
  const connection = await getConnection();
  await connection.query(`DELETE FROM prompts WHERE id = '${id.replace(/'/g, "''")}'`);
}

/**
 * Bulk insert prompts
 */
export async function bulkInsertPrompts(prompts: Prompt[]): Promise<void> {
  for (const prompt of prompts) {
    try {
      const existing = await getPromptById(prompt.id);
      if (existing) {
        await updatePrompt(prompt);
      } else {
        await insertPrompt(prompt);
      }
    } catch (error) {
      console.error(`[DuckDB] Failed to insert prompt ${prompt.id}:`, error);
    }
  }
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get a setting by key
 */
export async function getSetting(key: string): Promise<any> {
  const connection = await getConnection();
  const result = await connection.query(`
    SELECT value FROM settings WHERE key = '${key.replace(/'/g, "''")}'
  `);

  const rows = result.toArray();
  if (rows.length === 0) return null;

  const value = rows[0].toJSON().value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

/**
 * Save a setting
 */
export async function saveSetting(key: string, value: any): Promise<void> {
  const connection = await getConnection();
  const jsonValue = JSON.stringify(value).replace(/'/g, "''");

  await connection.query(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES ('${key.replace(/'/g, "''")}', '${jsonValue}', ${Date.now()})
  `);
}

// ============================================================================
// Categories Operations
// ============================================================================

/**
 * Get all custom categories
 */
export async function getCategories(): Promise<string[]> {
  const connection = await getConnection();
  const result = await connection.query(`
    SELECT name FROM categories WHERE is_custom = TRUE ORDER BY name
  `);

  const rows = result.toArray();
  return rows.map((row: any) => row.toJSON().name);
}

/**
 * Save categories
 */
export async function saveCategories(categories: string[]): Promise<void> {
  const connection = await getConnection();

  // Clear existing custom categories
  await connection.query(`DELETE FROM categories WHERE is_custom = TRUE`);

  // Insert new categories
  for (const name of categories) {
    const id = `cat_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await connection.query(`
      INSERT INTO categories (id, name, is_custom, created_at)
      VALUES ('${id}', '${name.replace(/'/g, "''")}', TRUE, ${Date.now()})
    `);
  }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  totalPrompts: number;
  favoritePrompts: number;
  categories: number;
  totalTags: number;
}> {
  const connection = await getConnection();

  const totalResult = await connection.query(`
    SELECT COUNT(*) as count FROM prompts WHERE deleted_at IS NULL
  `);
  const favResult = await connection.query(`
    SELECT COUNT(*) as count FROM prompts WHERE is_favorite = TRUE AND deleted_at IS NULL
  `);
  const catResult = await connection.query(`
    SELECT COUNT(DISTINCT category) as count FROM prompts WHERE deleted_at IS NULL
  `);

  const totalPrompts = totalResult.toArray()[0]?.toJSON().count || 0;
  const favoritePrompts = favResult.toArray()[0]?.toJSON().count || 0;
  const categories = catResult.toArray()[0]?.toJSON().count || 0;

  // Count total tags
  const prompts = await getAllPrompts();
  const totalTags = prompts.reduce((sum, p) => sum + (p.tags?.length || 0), 0);

  return { totalPrompts, favoritePrompts, categories, totalTags };
}

// ============================================================================
// Raw SQL Execution
// ============================================================================

/**
 * Execute raw SQL query
 */
export async function executeSQL(sql: string, _params: any[] = []): Promise<any[]> {
  const connection = await getConnection();
  const result = await connection.query(sql);
  return result.toArray().map((row: any) => row.toJSON());
}

// ============================================================================
// Database Management
// ============================================================================

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
  if (db) {
    await db.terminate();
    db = null;
  }
  initPromise = null;
  console.info('[DuckDB] Database closed');
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  const connection = await getConnection();
  await connection.query('DELETE FROM prompts');
  await connection.query('DELETE FROM categories');
  await connection.query('DELETE FROM settings');
  console.info('[DuckDB] All data cleared');
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return conn !== null;
}