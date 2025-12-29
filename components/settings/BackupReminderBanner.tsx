import React, { useState, useEffect } from 'react';
import { Download, X, Clock, ShieldCheck } from 'lucide-react';
import {
    getBackupReminderState,
    dismissBackupReminder,
    getBackupReminderMessage,
    formatLastBackupTime,
    BackupReminderState
} from '../../services/backupReminderService';
import { duckDBStorage } from '../../services/duckdbStorageService';

interface BackupReminderBannerProps {
    onOpenExportModal?: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({ onOpenExportModal }) => {
    const [state, setState] = useState<BackupReminderState | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        const checkBackupState = async () => {
            try {
                const backupState = await getBackupReminderState();
                setState(backupState);
                setIsVisible(backupState.shouldShowReminder);
            } catch (error) {
                console.error('[BackupBanner] Error checking backup state:', error);
            }
        };

        // Check after a short delay to not block initial render
        const timeout = setTimeout(checkBackupState, 2000);
        return () => clearTimeout(timeout);
    }, []);

    const handleBackupNow = async () => {
        setIsBackingUp(true);
        try {
            const success = await duckDBStorage.triggerBackup();
            if (success) {
                setIsVisible(false);
            }
        } catch (error) {
            console.error('[BackupBanner] Backup failed:', error);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDismiss = async () => {
        await dismissBackupReminder();
        setIsVisible(false);
    };

    const handleOpenExport = () => {
        if (onOpenExportModal) {
            onOpenExportModal();
        }
        setIsVisible(false);
    };

    if (!isVisible || !state) return null;

    const message = getBackupReminderMessage(state);
    const lastBackup = formatLastBackupTime(state.lastBackupTime);

    return (
        <div className="fixed bottom-4 right-4 z-40 max-w-md animate-slide-up">
            <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-600">
                        <ShieldCheck size={18} />
                        <span className="font-medium text-sm">Backup Reminder</span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-amber-600/60 hover:text-amber-600 transition-colors"
                        title="Remind me later"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-sm mb-3">{message}</p>

                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-4">
                        <Clock size={14} />
                        <span>Last backup: {lastBackup}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleBackupNow}
                            disabled={isBackingUp}
                            className="flex-1 py-2 px-3 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isBackingUp ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Backing up...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Backup Now
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleOpenExport}
                            className="py-2 px-3 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)]/10 transition-colors"
                        >
                            More Options
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default BackupReminderBanner;
