/**
 * Google AI Edge Gallery Video MCP - Native Termux Adapter
 * Interacts directly with on-device Android APIs when running inside Termux.
 */
export interface TermuxBatteryInfo {
    health: string;
    percentage: number;
    plugged: string;
    status: string;
    temperature: number;
    current: number;
}
export declare class TermuxAdapter {
    static isAvailable(): boolean;
    /**
     * Get battery statistics via termux-battery-status
     */
    static getBatteryStatus(): Promise<TermuxBatteryInfo | null>;
    /**
     * Notify Android MediaStore to index new video file so it appears instantly in Google Photos & Gallery
     */
    static scanMediaFile(filePath: string): Promise<boolean>;
    /**
     * Display on-device Android notification when video rendering completes
     */
    static showNotification(title: string, content: string): Promise<void>;
    /**
     * Check available storage space on /sdcard in Megabytes
     */
    static getStorageMb(): Promise<number>;
    /**
     * Check if Google AI Edge Gallery app directory or models are present
     */
    static getEdgeGalleryLocalPaths(): string[];
}
