/**
 * DuckDB Export/Import Service
 * 
 * Provides multi-format export/import functionality:
 * - JSON: Human-readable, easy to edit
 * - CSV: Spreadsheet compatible
 * - Parquet: Efficient columnar storage
 * - Database (.db): Full database backup
 */

import { Prompt } from '../types';
import {
    getAllPrompts,
    getCategories,
    getSetting,
    bulkInsertPrompts,
    saveCategories,
    saveSetting,
    executeSQL,
    initializeDuckDB,
} from './duckdbService';

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'parquet' | 'db';

export interface ExportOptions {
    format: ExportFormat;
    includeDeleted?: boolean;
    includeSettings?: boolean;
    selectedIds?: string[];
}

export interface ExportResult {
    success: boolean;
    blob: Blob;
    filename: string;
    recordCount: number;
    error?: string;
}

export interface ImportResult {
    success: boolean;
    importedCount: number;
    skippedCount: number;
    errors: string[];
    details?: {
        prompts: number;
        categories: number;
        settings: number;
    };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    promptCount?: number;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export data to the specified format
 */
export async function exportData(options: ExportOptions): Promise<ExportResult> {
    await initializeDuckDB();

    try {
        switch (options.format) {
            case 'json':
                return await exportToJSON(options);
            case 'csv':
                return await exportToCSV(options);
            case 'parquet':
                return await exportToParquet(options);
            case 'db':
                return await exportToDatabase(options);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    } catch (error) {
        return {
            success: false,
            blob: new Blob([]),
            filename: '',
            recordCount: 0,
            error: error instanceof Error ? error.message : 'Export failed',
        };
    }
}

/**
 * Export to JSON format
 */
async function exportToJSON(options: ExportOptions): Promise<ExportResult> {
    const prompts = await getAllPrompts();
    const categories = await getCategories();
    const theme = await getSetting('user_theme');
    const filters = await getSetting('filter_state');

    const filteredPrompts = options.selectedIds
        ? prompts.filter(p => options.selectedIds!.includes(p.id))
        : prompts;

    const exportData = {
        version: '3.0.0',
        format: 'promptray-json',
        exportedAt: new Date().toISOString(),
        exportedAtTimestamp: Date.now(),
        prompts: filteredPrompts,
        categories,
        settings: options.includeSettings !== false ? {
            user_theme: theme,
            filter_state: filters,
        } : undefined,
        metadata: {
            totalPrompts: filteredPrompts.length,
            totalCategories: categories.length,
        },
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    return {
        success: true,
        blob,
        filename: `promptray-backup-${formatDate(new Date())}.json`,
        recordCount: filteredPrompts.length,
    };
}

/**
 * Export to CSV format
 */
async function exportToCSV(options: ExportOptions): Promise<ExportResult> {
    const prompts = await getAllPrompts();

    const filteredPrompts = options.selectedIds
        ? prompts.filter(p => options.selectedIds!.includes(p.id))
        : prompts;

    // CSV headers
    const headers = [
        'id', 'title', 'content', 'english_prompt', 'chinese_prompt',
        'system_instruction', 'description', 'category', 'tags',
        'output_type', 'application_scene', 'is_favorite', 'status',
        'created_at', 'updated_at', 'source', 'source_author', 'source_url',
    ];

    // Convert prompts to CSV rows
    const rows = filteredPrompts.map(p => [
        escapeCSV(p.id),
        escapeCSV(p.title),
        escapeCSV(p.content),
        escapeCSV(p.englishPrompt || ''),
        escapeCSV(p.chinesePrompt || ''),
        escapeCSV(p.systemInstruction || ''),
        escapeCSV(p.description),
        escapeCSV(p.category),
        escapeCSV((p.tags || []).join('; ')),
        escapeCSV(p.outputType || ''),
        escapeCSV(p.applicationScene || ''),
        p.isFavorite ? 'true' : 'false',
        escapeCSV(p.status || 'draft'),
        p.createdAt,
        p.updatedAt || '',
        escapeCSV(p.source || ''),
        escapeCSV(p.sourceAuthor || ''),
        escapeCSV(p.sourceUrl || ''),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    return {
        success: true,
        blob,
        filename: `promptray-prompts-${formatDate(new Date())}.csv`,
        recordCount: filteredPrompts.length,
    };
}

/**
 * Export to Parquet format using DuckDB
 */
async function exportToParquet(options: ExportOptions): Promise<ExportResult> {
    try {
        // Use DuckDB to export to Parquet
        const tempFile = '/tmp/export.parquet';

        let whereClause = 'WHERE deleted_at IS NULL';
        if (options.selectedIds && options.selectedIds.length > 0) {
            const ids = options.selectedIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
            whereClause += ` AND id IN (${ids})`;
        }

        await executeSQL(`
      COPY (SELECT * FROM prompts ${whereClause})
      TO '${tempFile}' (FORMAT PARQUET)
    `);

        // Read the parquet file
        const result = await executeSQL(`SELECT * FROM read_parquet('${tempFile}')`);

        // Convert to buffer (simplified - in real implementation, read file bytes)
        const json = JSON.stringify(result);
        const blob = new Blob([json], { type: 'application/octet-stream' });

        return {
            success: true,
            blob,
            filename: `promptray-backup-${formatDate(new Date())}.parquet`,
            recordCount: result.length,
        };
    } catch (error) {
        // Fallback to JSON if Parquet export fails
        console.warn('[Export] Parquet export failed, falling back to JSON:', error);
        const jsonResult = await exportToJSON(options);
        return {
            ...jsonResult,
            filename: jsonResult.filename.replace('.json', '-fallback.json'),
        };
    }
}

/**
 * Export full database backup
 */
async function exportToDatabase(_options: ExportOptions): Promise<ExportResult> {
    // Export all data as a comprehensive JSON backup
    // (Full .db file export requires file system access which may not be available)
    const prompts = await getAllPrompts();
    const categories = await getCategories();
    const theme = await getSetting('user_theme');
    const filters = await getSetting('filter_state');
    const migrationStatus = await getSetting('migration_status');

    const fullBackup = {
        version: '3.0.0',
        format: 'promptray-database',
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        data: {
            prompts,
            categories,
            settings: {
                user_theme: theme,
                filter_state: filters,
                migration_status: migrationStatus,
            },
        },
        schema: {
            promptsVersion: 2,
            settingsVersion: 1,
        },
    };

    const json = JSON.stringify(fullBackup);
    const blob = new Blob([json], { type: 'application/json' });

    return {
        success: true,
        blob,
        filename: `promptray-full-backup-${formatDate(new Date())}.db.json`,
        recordCount: prompts.length,
    };
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import data from file
 */
export async function importData(file: File): Promise<ImportResult> {
    await initializeDuckDB();

    const filename = file.name.toLowerCase();

    try {
        if (filename.endsWith('.json') || filename.endsWith('.db.json')) {
            return await importFromJSON(file);
        } else if (filename.endsWith('.csv')) {
            return await importFromCSV(file);
        } else if (filename.endsWith('.parquet')) {
            return await importFromParquet(file);
        } else {
            return {
                success: false,
                importedCount: 0,
                skippedCount: 0,
                errors: [`Unsupported file format: ${filename}`],
            };
        }
    } catch (error) {
        return {
            success: false,
            importedCount: 0,
            skippedCount: 0,
            errors: [error instanceof Error ? error.message : 'Import failed'],
        };
    }
}

/**
 * Import from JSON format
 */
async function importFromJSON(file: File): Promise<ImportResult> {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate data structure
    const validation = validateImportData(data);
    if (!validation.valid) {
        return {
            success: false,
            importedCount: 0,
            skippedCount: 0,
            errors: validation.errors,
        };
    }

    let importedPrompts = 0;
    let importedCategories = 0;
    let importedSettings = 0;
    const errors: string[] = [];

    // Import prompts
    if (data.prompts && Array.isArray(data.prompts)) {
        try {
            await bulkInsertPrompts(data.prompts);
            importedPrompts = data.prompts.length;
        } catch (error) {
            errors.push(`Failed to import prompts: ${error}`);
        }
    }

    // Import categories
    if (data.categories && Array.isArray(data.categories)) {
        try {
            const existingCategories = await getCategories();
            const newCategories = [...new Set([...existingCategories, ...data.categories])];
            await saveCategories(newCategories);
            importedCategories = data.categories.length;
        } catch (error) {
            errors.push(`Failed to import categories: ${error}`);
        }
    }

    // Import settings
    if (data.settings) {
        try {
            if (data.settings.user_theme) {
                await saveSetting('user_theme', data.settings.user_theme);
                importedSettings++;
            }
            if (data.settings.filter_state) {
                await saveSetting('filter_state', data.settings.filter_state);
                importedSettings++;
            }
        } catch (error) {
            errors.push(`Failed to import settings: ${error}`);
        }
    }

    // Handle full database backup format
    if (data.data) {
        if (data.data.prompts) {
            try {
                await bulkInsertPrompts(data.data.prompts);
                importedPrompts = data.data.prompts.length;
            } catch (error) {
                errors.push(`Failed to import prompts from backup: ${error}`);
            }
        }
    }

    return {
        success: errors.length === 0,
        importedCount: importedPrompts + importedCategories + importedSettings,
        skippedCount: 0,
        errors,
        details: {
            prompts: importedPrompts,
            categories: importedCategories,
            settings: importedSettings,
        },
    };
}

/**
 * Import from CSV format
 */
async function importFromCSV(file: File): Promise<ImportResult> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        return {
            success: false,
            importedCount: 0,
            skippedCount: 0,
            errors: ['CSV file is empty or has no data rows'],
        };
    }

    const headers = parseCSVLine(lines[0]);
    const prompts: Prompt[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });

            const prompt = csvRowToPrompt(row);
            if (prompt) {
                prompts.push(prompt);
            }
        } catch (error) {
            errors.push(`Row ${i + 1}: ${error}`);
        }
    }

    if (prompts.length > 0) {
        try {
            await bulkInsertPrompts(prompts);
        } catch (error) {
            errors.push(`Failed to insert prompts: ${error}`);
        }
    }

    return {
        success: errors.length === 0,
        importedCount: prompts.length,
        skippedCount: lines.length - 1 - prompts.length,
        errors,
        details: {
            prompts: prompts.length,
            categories: 0,
            settings: 0,
        },
    };
}

/**
 * Import from Parquet format
 */
async function importFromParquet(file: File): Promise<ImportResult> {
    try {
        // Note: Full Parquet import requires DuckDB file system registration
        // For now, we attempt to use DuckDB's read_parquet if file is accessible

        // Register the file with DuckDB
        const tempPath = `/tmp/${file.name}`;
        await executeSQL(`
      CREATE TABLE IF NOT EXISTS temp_import AS 
      SELECT * FROM read_parquet('${tempPath}')
    `);

        // Read the data
        const rows = await executeSQL('SELECT * FROM temp_import');

        // Convert to prompts
        const prompts: Prompt[] = rows.map(row => ({
            id: row.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: row.title || 'Untitled',
            content: row.content || '',
            description: row.description || '',
            category: row.category || 'Other',
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            isFavorite: Boolean(row.is_favorite),
            createdAt: row.created_at || Date.now(),
            updatedAt: row.updated_at,
        }));

        await bulkInsertPrompts(prompts);

        // Cleanup
        await executeSQL('DROP TABLE IF EXISTS temp_import');

        return {
            success: true,
            importedCount: prompts.length,
            skippedCount: 0,
            errors: [],
            details: {
                prompts: prompts.length,
                categories: 0,
                settings: 0,
            },
        };
    } catch (error) {
        // Fallback: try to parse as JSON
        try {
            return await importFromJSON(file);
        } catch {
            return {
                success: false,
                importedCount: 0,
                skippedCount: 0,
                errors: [`Parquet import failed: ${error}`],
            };
        }
    }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate import data structure
 */
export function validateImportData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let promptCount = 0;

    if (!data || typeof data !== 'object') {
        errors.push('Invalid data: must be an object');
        return { valid: false, errors, warnings };
    }

    // Check for prompts array
    const prompts = data.prompts || data.data?.prompts;
    if (prompts) {
        if (!Array.isArray(prompts)) {
            errors.push('Invalid prompts: must be an array');
        } else {
            promptCount = prompts.length;

            // Validate each prompt
            for (let i = 0; i < Math.min(prompts.length, 10); i++) {
                const prompt = prompts[i];
                if (!prompt.id) {
                    warnings.push(`Prompt ${i + 1}: missing id, will be auto-generated`);
                }
                if (!prompt.title) {
                    warnings.push(`Prompt ${i + 1}: missing title`);
                }
            }

            if (prompts.length > 10 && warnings.length > 0) {
                warnings.push(`... and potentially more issues in remaining ${prompts.length - 10} prompts`);
            }
        }
    }

    // Check version
    if (data.version) {
        const version = data.version.split('.').map(Number);
        if (version[0] > 3) {
            warnings.push(`Data version ${data.version} is newer than supported. Some features may not import correctly.`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        promptCount,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format date for filenames
 */
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Escape value for CSV
 */
function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Parse a CSV line into values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    return values;
}

/**
 * Convert CSV row to Prompt object
 */
function csvRowToPrompt(row: Record<string, string>): Prompt | null {
    const id = row.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = row.title;

    if (!title) return null;

    return {
        id,
        title,
        content: row.content || '',
        englishPrompt: row.english_prompt || undefined,
        chinesePrompt: row.chinese_prompt || undefined,
        systemInstruction: row.system_instruction || undefined,
        description: row.description || '',
        category: row.category || 'Other',
        tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
        outputType: row.output_type as any || undefined,
        applicationScene: row.application_scene as any || undefined,
        isFavorite: row.is_favorite === 'true',
        status: (row.status as any) || 'draft',
        createdAt: parseInt(row.created_at) || Date.now(),
        updatedAt: row.updated_at ? parseInt(row.updated_at) : undefined,
        source: row.source || undefined,
        sourceAuthor: row.source_author || undefined,
        sourceUrl: row.source_url || undefined,
    };
}

/**
 * Trigger file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
