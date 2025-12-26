import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import {
  MigrationStatus,
  MigrationResult,
  initializeStorageMigration,
  migrateAllDataToIDB,
  exportAllData,
  importData,
  clearAllData,
  ExportData
} from '../../services/storageService';

interface StorageMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageMigrationModal: React.FC<StorageMigrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    localStorage: any;
    indexedDB: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMigrationStatus();
    }
  }, [isOpen]);

  const loadMigrationStatus = async () => {
    try {
      const status = await initializeStorageMigration();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    }
  };

  const handleManualMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateAllDataToIDB();
      setMigrationResult(result);

      if (result.success) {
        // Reload status
        await loadMigrationStatus();
      }
    } catch (error) {
      console.error('Manual migration failed:', error);
      setMigrationResult({
        success: false,
        migratedItems: 0,
        errors: [error instanceof Error ? error.message : 'Migration failed'],
        duration: 0
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const data = await exportAllData();

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompt-ray-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      const result = await importData(data);

      if (result.success) {
        alert(`Import successful! Imported ${result.importedItems} items.`);
        // Reload status
        await loadMigrationStatus();
      } else {
        alert(`Import failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: Invalid file format or corrupted data');
    }

    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone!')) {
      return;
    }

    setIsClearing(true);

    try {
      await clearAllData();
      alert('All data cleared successfully. The app will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Clear data failed:', error);
      alert('Clear data failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleDebugStorage = async () => {
    try {
      // Check localStorage
      const localStorageData = {
        prompts_data_v2: localStorage.getItem('prompts_data_v2') ? JSON.parse(localStorage.getItem('prompts_data_v2')!).length + ' items' : 'empty',
        prompts_categories_v1: localStorage.getItem('prompts_categories_v1') || 'empty',
        prompts_theme_v1: localStorage.getItem('prompts_theme_v1') || 'empty',
        prompts_filters_v1: localStorage.getItem('prompts_filters_v1') || 'empty',
        prompt_audit_endpoint: localStorage.getItem('prompt_audit_endpoint') || 'empty'
      };

      // Check IndexedDB (simplified - would need async access)
      const indexedDBData = {
        status: 'Check browser dev tools Application > Storage > IndexedDB > PromptRayDB'
      };

      setDebugInfo({
        localStorage: localStorageData,
        indexedDB: indexedDBData
      });

      console.log('Storage Debug Info:', {
        localStorage: localStorageData,
        indexedDB: indexedDBData
      });

    } catch (error) {
      console.error('Debug failed:', error);
      alert('Debug failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Storage Migration</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Current Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Current Status</h3>
            {migrationStatus ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    migrationStatus.isCompleted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {migrationStatus.isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Version: {migrationStatus.version}</div>
                  <div>Migrated Items: {migrationStatus.migratedItems}</div>
                  {migrationStatus.lastMigrationAt && (
                    <div>Last Migration: {new Date(migrationStatus.lastMigrationAt).toLocaleString()}</div>
                  )}
                  {migrationStatus.errors.length > 0 && (
                    <div className="text-red-600 mt-2">
                      Errors: {migrationStatus.errors.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </div>

          {/* Migration Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Migration Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={handleManualMigration}
                disabled={isMigrating || migrationStatus?.isCompleted}
                className="w-full"
              >
                {isMigrating ? 'Migrating...' : 'Start Manual Migration'}
              </Button>

              <Button
                onClick={async () => {
                  console.info('🚀 Force migration triggered');
                  const { migrateAllDataToIDB } = await import('../../services/storageService');
                  const result = await migrateAllDataToIDB();
                  console.info('✅ Force migration result:', result);
                  alert(`Migration ${result.success ? 'successful' : 'failed'}: ${result.migratedItems} items migrated`);
                  await loadMigrationStatus();
                }}
                variant="danger"
                className="w-full"
                disabled={isMigrating}
              >
                Force Migration (Debug)
              </Button>

              <Button
                onClick={handleDebugStorage}
                variant="secondary"
                className="w-full"
              >
                Debug Storage Status
              </Button>

              {migrationResult && (
                <div className={`p-3 rounded ${
                  migrationResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="text-sm">
                    <div>Status: {migrationResult.success ? 'Success' : 'Failed'}</div>
                    <div>Migrated Items: {migrationResult.migratedItems}</div>
                    <div>Duration: {migrationResult.duration}ms</div>
                    {migrationResult.errors.length > 0 && (
                      <div className="text-red-600">
                        Errors: {migrationResult.errors.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Debug Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">LocalStorage:</h4>
                <pre className="text-sm text-gray-700 mb-4">
                  {JSON.stringify(debugInfo.localStorage, null, 2)}
                </pre>

                <h4 className="font-medium mb-2">IndexedDB:</h4>
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(debugInfo.indexedDB, null, 2)}
                </pre>

                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Check browser dev tools → Application → Storage → IndexedDB → PromptRayDB for detailed IndexedDB contents
                </p>
              </div>
            </div>
          )}

          {/* Data Management */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Data Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="secondary"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isExporting}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={isExporting}
                >
                  Import Data
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-3 text-red-600">Danger Zone</h3>
            <Button
              onClick={handleClearAllData}
              disabled={isClearing}
              variant="danger"
              className="w-full"
            >
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
            <Text className="text-sm text-gray-500 mt-2">
              This will permanently delete all prompts, categories, and settings. Use with extreme caution!
            </Text>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
