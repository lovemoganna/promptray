import React, { useState, useRef } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, Database, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { duckDBStorage } from '../../services/duckdbStorageService';
import { ExportFormat, ImportResult, validateImportData } from '../../services/duckdbExportImport';

interface ExportImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete?: () => void;
}

type Tab = 'export' | 'import';

const EXPORT_FORMATS: { format: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
    { format: 'json', label: 'JSON', icon: <FileJson size={20} />, description: 'Human-readable, easy to edit' },
    { format: 'csv', label: 'CSV', icon: <FileSpreadsheet size={20} />, description: 'Spreadsheet compatible' },
    { format: 'parquet', label: 'Parquet', icon: <Database size={20} />, description: 'Efficient columnar storage' },
    { format: 'db', label: 'Full Backup', icon: <Database size={20} />, description: 'Complete database backup' },
];

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
    const [activeTab, setActiveTab] = useState<Tab>('export');
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsProcessing(true);
        setResult(null);

        try {
            const success = await duckDBStorage.exportAndDownload(selectedFormat);
            setResult({
                success,
                message: success ? `Export successful! File downloaded.` : 'Export failed. Please try again.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: `Export error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileSelect = async (file: File) => {
        setSelectedFile(file);
        setImportResult(null);
        setPreviewData(null);

        // Try to preview JSON files
        if (file.name.endsWith('.json')) {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                const validation = validateImportData(data);
                setPreviewData({
                    ...validation,
                    filename: file.name,
                    size: formatFileSize(file.size),
                });
            } catch {
                setPreviewData({ valid: false, errors: ['Could not parse file'], warnings: [] });
            }
        } else {
            setPreviewData({
                valid: true,
                errors: [],
                warnings: ['Preview not available for this file type. Import will attempt to parse the file.'],
                filename: file.name,
                size: formatFileSize(file.size),
            });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setImportResult(null);

        try {
            const result = await duckDBStorage.importFromFile(selectedFile);
            setImportResult(result);

            if (result.success && onImportComplete) {
                onImportComplete();
            }
        } catch (error) {
            setImportResult({
                success: false,
                importedCount: 0,
                skippedCount: 0,
                errors: [error instanceof Error ? error.message : 'Import failed'],
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetImport = () => {
        setSelectedFile(null);
        setPreviewData(null);
        setImportResult(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold">Export / Import</h2>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--muted)]/20 rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border)]">
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'export' ? 'border-b-2 border-[var(--brand)] text-[var(--brand)]' : 'text-[var(--muted)]'
                            }`}
                        onClick={() => { setActiveTab('export'); setResult(null); }}
                    >
                        <Download size={16} className="inline-block mr-2" />
                        Export
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'import' ? 'border-b-2 border-[var(--brand)] text-[var(--brand)]' : 'text-[var(--muted)]'
                            }`}
                        onClick={() => { setActiveTab('import'); resetImport(); }}
                    >
                        <Upload size={16} className="inline-block mr-2" />
                        Import
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'export' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--muted)]">
                                Export your prompts and settings to a file for backup or sharing.
                            </p>

                            {/* Format Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                {EXPORT_FORMATS.map(({ format, label, icon, description }) => (
                                    <button
                                        key={format}
                                        onClick={() => setSelectedFormat(format)}
                                        className={`p-3 rounded-lg border transition-all text-left ${selectedFormat === format
                                                ? 'border-[var(--brand)] bg-[var(--brand)]/10'
                                                : 'border-[var(--border)] hover:border-[var(--brand)]/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {icon}
                                            <span className="font-medium">{label}</span>
                                        </div>
                                        <p className="text-xs text-[var(--muted)]">{description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                disabled={isProcessing}
                                className="w-full py-3 bg-[var(--brand)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Export as {selectedFormat.toUpperCase()}
                                    </>
                                )}
                            </button>

                            {/* Result Message */}
                            {result && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${result.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                    }`}>
                                    {result.success ? <Check size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm">{result.message}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-4">
                            {!selectedFile ? (
                                <>
                                    <p className="text-sm text-[var(--muted)]">
                                        Import prompts from a JSON, CSV, or Parquet file.
                                    </p>

                                    {/* Drop Zone */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-[var(--border)]'
                                            }`}
                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={handleDrop}
                                    >
                                        <Upload size={40} className="mx-auto mb-3 text-[var(--muted)]" />
                                        <p className="text-sm mb-2">Drag and drop a file here, or</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[var(--brand)] hover:underline"
                                        >
                                            browse files
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json,.csv,.parquet"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        />
                                        <p className="text-xs text-[var(--muted)] mt-2">
                                            Supported: JSON, CSV, Parquet
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* File Preview */}
                                    <div className="bg-[var(--muted)]/10 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{previewData?.filename}</span>
                                            <button onClick={resetImport} className="text-[var(--muted)] hover:text-[var(--text)]">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-[var(--muted)]">Size: {previewData?.size}</p>

                                        {previewData?.promptCount !== undefined && (
                                            <p className="text-sm text-[var(--muted)]">Prompts: {previewData.promptCount}</p>
                                        )}

                                        {previewData?.warnings?.length > 0 && (
                                            <div className="mt-2 text-sm text-yellow-600">
                                                {previewData.warnings.map((w: string, i: number) => (
                                                    <p key={i}>⚠️ {w}</p>
                                                ))}
                                            </div>
                                        )}

                                        {previewData?.errors?.length > 0 && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {previewData.errors.map((e: string, i: number) => (
                                                    <p key={i}>❌ {e}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Import Button */}
                                    <button
                                        onClick={handleImport}
                                        disabled={isProcessing || !previewData?.valid}
                                        className="w-full py-3 bg-[var(--brand)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Import Data
                                            </>
                                        )}
                                    </button>

                                    {/* Import Result */}
                                    {importResult && (
                                        <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-500/10' : 'bg-red-500/10'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {importResult.success ? (
                                                    <Check size={18} className="text-green-600" />
                                                ) : (
                                                    <AlertCircle size={18} className="text-red-600" />
                                                )}
                                                <span className={`font-medium ${importResult.success ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                                                </span>
                                            </div>

                                            {importResult.details && (
                                                <div className="text-sm text-[var(--muted)] space-y-1">
                                                    <p>Prompts imported: {importResult.details.prompts}</p>
                                                    <p>Categories imported: {importResult.details.categories}</p>
                                                    <p>Settings imported: {importResult.details.settings}</p>
                                                </div>
                                            )}

                                            {importResult.errors.length > 0 && (
                                                <div className="mt-2 text-sm text-red-600">
                                                    {importResult.errors.slice(0, 3).map((e, i) => (
                                                        <p key={i}>• {e}</p>
                                                    ))}
                                                    {importResult.errors.length > 3 && (
                                                        <p>...and {importResult.errors.length - 3} more errors</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ExportImportModal;
