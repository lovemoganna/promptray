/**
 * Backup Reminder Service
 * 
 * Provides periodic backup reminders and auto-backup functionality
 * to ensure users don't lose their prompt data.
 */

import { getSetting, saveSetting } from './duckdbService';
import { exportData, downloadBlob } from './duckdbExportImport';

// Configuration
const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BACKUP_SETTING_KEY = 'last_backup_time';
const REMINDER_DISMISSED_KEY = 'backup_reminder_dismissed';

export interface BackupReminderState {
    shouldShowReminder: boolean;
    lastBackupTime: number | null;
    daysSinceLastBackup: number | null;
    nextReminderTime: number | null;
}

// ============================================================================
// Backup Reminder Logic
// ============================================================================

/**
 * Check if backup reminder should be shown
 */
export async function getBackupReminderState(): Promise<BackupReminderState> {
    const lastBackupTime = await getLastBackupTime();
    const dismissed = await getSetting(REMINDER_DISMISSED_KEY);

    const now = Date.now();
    let shouldShowReminder = false;
    let daysSinceLastBackup: number | null = null;
    let nextReminderTime: number | null = null;

    if (lastBackupTime === null) {
        // Never backed up - show reminder after first few uses
        // We check if there's data worth backing up
        shouldShowReminder = !dismissed;
    } else {
        const timeSinceBackup = now - lastBackupTime;
        daysSinceLastBackup = Math.floor(timeSinceBackup / (24 * 60 * 60 * 1000));

        if (timeSinceBackup >= BACKUP_REMINDER_INTERVAL_MS) {
            shouldShowReminder = !dismissed;
        }

        nextReminderTime = lastBackupTime + BACKUP_REMINDER_INTERVAL_MS;
    }

    return {
        shouldShowReminder,
        lastBackupTime,
        daysSinceLastBackup,
        nextReminderTime,
    };
}

/**
 * Get the last backup timestamp
 */
export async function getLastBackupTime(): Promise<number | null> {
    const time = await getSetting(BACKUP_SETTING_KEY);
    return typeof time === 'number' ? time : null;
}

/**
 * Record that a backup was made
 */
export async function recordBackupTime(): Promise<void> {
    await saveSetting(BACKUP_SETTING_KEY, Date.now());
    await saveSetting(REMINDER_DISMISSED_KEY, false);
}

/**
 * Dismiss the backup reminder temporarily
 */
export async function dismissBackupReminder(): Promise<void> {
    await saveSetting(REMINDER_DISMISSED_KEY, true);
}

/**
 * Reset the dismissed state (called when new data is added)
 */
export async function resetReminderDismissed(): Promise<void> {
    await saveSetting(REMINDER_DISMISSED_KEY, false);
}

// ============================================================================
// Auto Backup
// ============================================================================

/**
 * Trigger an automatic backup download
 */
export async function triggerAutoBackup(): Promise<boolean> {
    try {
        const result = await exportData({
            format: 'json',
            includeSettings: true,
        });

        if (result.success) {
            downloadBlob(result.blob, result.filename);
            await recordBackupTime();
            return true;
        }

        console.error('[Backup] Auto backup failed:', result.error);
        return false;
    } catch (error) {
        console.error('[Backup] Auto backup error:', error);
        return false;
    }
}

/**
 * Trigger a full database backup
 */
export async function triggerFullBackup(): Promise<boolean> {
    try {
        const result = await exportData({
            format: 'db',
            includeSettings: true,
        });

        if (result.success) {
            downloadBlob(result.blob, result.filename);
            await recordBackupTime();
            return true;
        }

        console.error('[Backup] Full backup failed:', result.error);
        return false;
    } catch (error) {
        console.error('[Backup] Full backup error:', error);
        return false;
    }
}

// ============================================================================
// Backup Statistics
// ============================================================================

export interface BackupStats {
    totalBackups: number;
    lastBackupTime: number | null;
    lastBackupSize: number | null;
    averageBackupIntervalDays: number | null;
}

/**
 * Get backup statistics (simplified version)
 */
export async function getBackupStats(): Promise<BackupStats> {
    const lastBackupTime = await getLastBackupTime();

    return {
        totalBackups: lastBackupTime ? 1 : 0, // Simplified - could track history
        lastBackupTime,
        lastBackupSize: null, // Would need to track
        averageBackupIntervalDays: null,
    };
}

// ============================================================================
// Backup Notifications
// ============================================================================

/**
 * Format backup reminder message
 */
export function getBackupReminderMessage(state: BackupReminderState): string {
    if (state.lastBackupTime === null) {
        return "You haven't backed up your prompts yet. Create a backup to keep your data safe.";
    }

    if (state.daysSinceLastBackup !== null) {
        if (state.daysSinceLastBackup === 0) {
            return "Backed up today. Your data is safe!";
        } else if (state.daysSinceLastBackup === 1) {
            return "It's been 1 day since your last backup.";
        } else {
            return `It's been ${state.daysSinceLastBackup} days since your last backup. Time for a new backup?`;
        }
    }

    return "Consider backing up your prompts to keep your data safe.";
}

/**
 * Format last backup time for display
 */
export function formatLastBackupTime(timestamp: number | null): string {
    if (timestamp === null) {
        return 'Never';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}
