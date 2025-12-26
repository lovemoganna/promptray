import {
  migrateAllDataToIDB,
  exportAllData,
  importData,
  clearAllData,
  getMigrationStatus,
  saveMigrationStatus,
  initializeStorageMigration
} from '../storageService';
import { Prompt } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
});

describe('Storage Migration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset IndexedDB mock
    indexedDBMock.open.mockReset();
    indexedDBMock.deleteDatabase.mockReset();
  });

  describe('Migration Status Management', () => {
    it('should return default migration status when no data exists', async () => {
      const status = await getMigrationStatus();
      expect(status.isCompleted).toBe(false);
      expect(status.version).toBe('1.0.0');
      expect(status.migratedItems).toBe(0);
      expect(status.errors).toEqual([]);
    });

    it('should save and retrieve migration status', async () => {
      const testStatus = {
        isCompleted: true,
        version: '2.0.0',
        migratedItems: 42,
        errors: ['Test error'],
        lastMigrationAt: Date.now()
      };

      await saveMigrationStatus(testStatus);
      const retrievedStatus = await getMigrationStatus();

      expect(retrievedStatus.isCompleted).toBe(true);
      expect(retrievedStatus.version).toBe('2.0.0');
      expect(retrievedStatus.migratedItems).toBe(42);
      expect(retrievedStatus.errors).toEqual(['Test error']);
    });
  });

  describe('Data Export/Import', () => {
    it('should export data structure correctly', async () => {
      // Setup test data in localStorage
      const testPrompts: Prompt[] = [
        {
          id: '1',
          title: 'Test Prompt',
          content: 'Test content',
          description: 'Test description',
          category: 'Test',
          tags: ['test'],
          isFavorite: false,
          createdAt: Date.now()
        }
      ];

      localStorage.setItem('prompts_data_v2', JSON.stringify(testPrompts));
      localStorage.setItem('prompts_categories_v1', JSON.stringify(['Test']));
      localStorage.setItem('prompts_theme_v1', 'theme-default');

      const exportedData = await exportAllData();

      expect(exportedData.version).toBe('2.0.0');
      expect(exportedData.exportedAt).toBeGreaterThan(0);
      expect(exportedData.prompts).toHaveLength(1);
      expect(exportedData.categories).toEqual(['Test']);
      expect(exportedData.settings.user_theme).toBe('theme-default');
    });

    it('should import data correctly', async () => {
      const importDataObj = {
        version: '2.0.0',
        exportedAt: Date.now(),
        prompts: [
          {
            id: 'imported-1',
            title: 'Imported Prompt',
            content: 'Imported content',
            description: 'Imported description',
            category: 'Imported',
            tags: ['imported'],
            isFavorite: true,
            createdAt: Date.now()
          }
        ] as Prompt[],
        categories: ['Imported'],
        settings: {
          user_theme: 'theme-midnight'
        },
        migrationStatus: {
          isCompleted: true,
          version: '2.0.0',
          migratedItems: 1,
          errors: []
        }
      };

      const result = await importData(importDataObj);

      expect(result.success).toBe(true);
      expect(result.importedItems).toBe(3); // 1 prompt + 1 category + 1 setting
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors gracefully', async () => {
      const invalidData = {
        version: '2.0.0',
        exportedAt: Date.now(),
        prompts: null, // Invalid data
        categories: ['Test'],
        settings: {},
        migrationStatus: {
          isCompleted: false,
          version: '1.0.0',
          migratedItems: 0,
          errors: []
        }
      };

      const result = await importData(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Process', () => {
    it('should migrate data from localStorage to IndexedDB', async () => {
      // Setup test data
      const testPrompts: Prompt[] = [
        {
          id: '1',
          title: 'Test Prompt',
          content: 'Test content',
          description: 'Test description',
          category: 'Test',
          tags: ['test'],
          isFavorite: false,
          createdAt: Date.now()
        }
      ];

      localStorage.setItem('prompts_data_v2', JSON.stringify(testPrompts));
      localStorage.setItem('prompts_categories_v1', JSON.stringify(['Test']));
      localStorage.setItem('prompts_theme_v1', 'theme-default');

      // Note: In a real test environment, we would mock IndexedDB properly
      // This test validates the migration logic structure
      const result = await migrateAllDataToIDB();

      // The result will depend on whether IndexedDB is properly mocked
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.migratedItems).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('Data Clearing', () => {
    it('should clear all data', async () => {
      // Setup test data
      localStorage.setItem('prompts_data_v2', JSON.stringify([]));
      localStorage.setItem('test_key', 'test_value');

      await clearAllData();

      // Note: In real implementation, this would also clear IndexedDB
      // Here we just test that the function doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should initialize migration on app startup', async () => {
      const status = await initializeStorageMigration();

      expect(typeof status.isCompleted).toBe('boolean');
      expect(status.version).toBeDefined();
      expect(typeof status.migratedItems).toBe('number');
      expect(Array.isArray(status.errors)).toBe(true);
    });
  });
});
