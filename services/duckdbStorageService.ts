/**
 * DuckDB Storage Service - Unified API
 * 
 * Provides a high-level interface for storage operations
 * compatible with the existing app structure.
 */

import { Prompt } from '../types';
import {
  initializeDuckDB,
  getAllPrompts,
  getPromptById,
  insertPrompt,
  updatePrompt,
  deletePrompt as softDeletePrompt,
  bulkInsertPrompts,
  getCategories,
  saveCategories,
  getSetting,
  saveSetting,
  getDatabaseStats,
  executeSQL,
  closeDatabase,
  clearAllData,
  isDatabaseInitialized,
} from './duckdbService';
import {
  exportData,
  importData,
  downloadBlob,
  ExportFormat,
  ExportResult,
  ImportResult,
} from './duckdbExportImport';
import {
  getBackupReminderState,
  triggerAutoBackup,
  recordBackupTime,
  dismissBackupReminder,
  BackupReminderState,
} from './backupReminderService';

// ============================================================================
// Service Class
// ============================================================================

export class DuckDBStorageService {
  private static instance: DuckDBStorageService;
  private isInitialized = false;

  private constructor() { }

  static getInstance(): DuckDBStorageService {
    if (!DuckDBStorageService.instance) {
      DuckDBStorageService.instance = new DuckDBStorageService();
    }
    return DuckDBStorageService.instance;
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await initializeDuckDB();
      this.isInitialized = true;
      console.info('[DuckDBStorage] Service initialized');
    } catch (error) {
      console.error('[DuckDBStorage] Failed to initialize:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // --------------------------------------------------------------------------
  // Prompt Operations
  // --------------------------------------------------------------------------

  async getPrompts(): Promise<Prompt[]> {
    await this.ensureInitialized();
    return await getAllPrompts();
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    await this.ensureInitialized();
    return await getPromptById(id);
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    await this.ensureInitialized();

    const existing = await getPromptById(prompt.id);
    if (existing) {
      await updatePrompt(prompt);
    } else {
      await insertPrompt(prompt);
    }
  }

  async deletePrompt(id: string): Promise<void> {
    await this.ensureInitialized();
    await softDeletePrompt(id);
  }

  async savePrompts(prompts: Prompt[]): Promise<void> {
    await this.ensureInitialized();
    await bulkInsertPrompts(prompts);
  }

  // --------------------------------------------------------------------------
  // Category Operations
  // --------------------------------------------------------------------------

  async getCustomCategories(): Promise<string[]> {
    await this.ensureInitialized();
    return await getCategories();
  }

  async saveCustomCategories(categories: string[]): Promise<void> {
    await this.ensureInitialized();
    await saveCategories(categories);
  }

  // --------------------------------------------------------------------------
  // Settings Operations
  // --------------------------------------------------------------------------

  async getUserTheme(): Promise<string> {
    await this.ensureInitialized();
    const theme = await getSetting('user_theme');
    return theme || 'theme-default';
  }

  async saveUserTheme(themeId: string): Promise<void> {
    await this.ensureInitialized();
    await saveSetting('user_theme', themeId);
  }

  async getFilterState(): Promise<any> {
    await this.ensureInitialized();
    return await getSetting('filter_state');
  }

  async saveFilterState(filters: any): Promise<void> {
    await this.ensureInitialized();
    await saveSetting('filter_state', filters);
  }

  // --------------------------------------------------------------------------
  // Export/Import Operations
  // --------------------------------------------------------------------------

  async exportToFormat(format: ExportFormat, selectedIds?: string[]): Promise<ExportResult> {
    await this.ensureInitialized();
    return await exportData({
      format,
      includeSettings: true,
      selectedIds,
    });
  }

  async exportAndDownload(format: ExportFormat, selectedIds?: string[]): Promise<boolean> {
    const result = await this.exportToFormat(format, selectedIds);
    if (result.success) {
      downloadBlob(result.blob, result.filename);
      await recordBackupTime();
      return true;
    }
    return false;
  }

  async importFromFile(file: File): Promise<ImportResult> {
    await this.ensureInitialized();
    return await importData(file);
  }

  // --------------------------------------------------------------------------
  // Backup Operations
  // --------------------------------------------------------------------------

  async getBackupState(): Promise<BackupReminderState> {
    await this.ensureInitialized();
    return await getBackupReminderState();
  }

  async triggerBackup(): Promise<boolean> {
    await this.ensureInitialized();
    return await triggerAutoBackup();
  }

  async dismissBackup(): Promise<void> {
    await this.ensureInitialized();
    await dismissBackupReminder();
  }

  // --------------------------------------------------------------------------
  // Statistics & Database Management
  // --------------------------------------------------------------------------

  async getStats(): Promise<{
    totalPrompts: number;
    favoritePrompts: number;
    categories: number;
    totalTags: number;
  }> {
    await this.ensureInitialized();
    return await getDatabaseStats();
  }

  async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    await this.ensureInitialized();
    return await executeSQL(sql, params);
  }

  async exportData(): Promise<any> {
    await this.ensureInitialized();

    const prompts = await getAllPrompts();
    const categories = await getCategories();
    const theme = await getSetting('user_theme');
    const filters = await getSetting('filter_state');

    return {
      version: '3.0.0',
      exportedAt: Date.now(),
      prompts,
      categories,
      settings: {
        theme,
        filters,
      },
    };
  }

  async importDataFromObject(data: any): Promise<void> {
    await this.ensureInitialized();

    if (data.prompts && Array.isArray(data.prompts)) {
      await bulkInsertPrompts(data.prompts);
    }

    if (data.categories && Array.isArray(data.categories)) {
      const existing = await getCategories();
      const merged = [...new Set([...existing, ...data.categories])];
      await saveCategories(merged);
    }

    if (data.settings) {
      if (data.settings.theme) {
        await saveSetting('user_theme', data.settings.theme);
      }
      if (data.settings.filters) {
        await saveSetting('filter_state', data.settings.filters);
      }
    }
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    await clearAllData();
  }

  async close(): Promise<void> {
    await closeDatabase();
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized && isDatabaseInitialized();
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const duckDBStorage = DuckDBStorageService.getInstance();

// ============================================================================
// Compatibility Functions
// ============================================================================

// Prompt operations
export const getPromptsDuckDB = () => duckDBStorage.getPrompts();
export const savePromptsDuckDB = async (prompts: Prompt[]) => {
  await duckDBStorage.savePrompts(prompts);
};
export const savePromptDuckDB = (prompt: Prompt) => duckDBStorage.savePrompt(prompt);
export const deletePromptDuckDB = (id: string) => duckDBStorage.deletePrompt(id);

// Category operations
export const getCustomCategoriesDuckDB = () => duckDBStorage.getCustomCategories();
export const saveCustomCategoriesDuckDB = (categories: string[]) =>
  duckDBStorage.saveCustomCategories(categories);

// Settings operations
export const getUserThemeDuckDB = () => duckDBStorage.getUserTheme();
export const saveUserThemeDuckDB = (themeId: string) => duckDBStorage.saveUserTheme(themeId);
export const getFilterStateDuckDB = () => duckDBStorage.getFilterState();
export const saveFilterStateDuckDB = (filters: any) => duckDBStorage.saveFilterState(filters);
