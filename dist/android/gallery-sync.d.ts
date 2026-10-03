/**
 * Google AI Edge Gallery Video MCP - Gallery Sync Manager
 * Synchronizes generated video outputs with Android's MediaStore & DCIM folder.
 */
import { DeviceManager } from './device-manager.js';
export interface GallerySyncResult {
    synced: boolean;
    destinationPath: string;
    galleryUri: string;
    statusMessage: string;
}
export declare class GallerySync {
    private deviceManager;
    constructor(deviceManager?: DeviceManager);
    /**
     * Export video file to Android Gallery DCIM directory and register in Android MediaStore
     */
    exportToGallery(localFilePath: string, customTitle?: string): Promise<GallerySyncResult>;
    /**
     * List videos stored in the Edge AI output folder
     */
    listGalleryVideos(): Array<{
        name: string;
        path: string;
        sizeMb: number;
        createdAt: Date;
    }>;
}
