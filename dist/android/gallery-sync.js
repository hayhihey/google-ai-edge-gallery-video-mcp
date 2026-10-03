/**
 * Google AI Edge Gallery Video MCP - Gallery Sync Manager
 * Synchronizes generated video outputs with Android's MediaStore & DCIM folder.
 */
import fs from 'fs';
import path from 'path';
import { Config } from '../config.js';
import { DeviceManager } from './device-manager.js';
import { TermuxAdapter } from './termux-adapter.js';
export class GallerySync {
    deviceManager;
    constructor(deviceManager) {
        this.deviceManager = deviceManager || new DeviceManager();
    }
    /**
     * Export video file to Android Gallery DCIM directory and register in Android MediaStore
     */
    async exportToGallery(localFilePath, customTitle) {
        if (!fs.existsSync(localFilePath)) {
            return {
                synced: false,
                destinationPath: localFilePath,
                galleryUri: '',
                statusMessage: `File not found: ${localFilePath}`
            };
        }
        const mode = await this.deviceManager.getExecutionMode();
        const fileName = customTitle
            ? `${customTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.mp4`
            : path.basename(localFilePath);
        // Scenario 1: Native Termux execution on Android
        if (mode === 'android-termux') {
            const dcimDir = Config.ANDROID_DCIM;
            try {
                if (!fs.existsSync(dcimDir)) {
                    fs.mkdirSync(dcimDir, { recursive: true });
                }
                const destPath = path.join(dcimDir, fileName);
                fs.copyFileSync(localFilePath, destPath);
                // Notify Android MediaStore to index it immediately
                await TermuxAdapter.scanMediaFile(destPath);
                await TermuxAdapter.showNotification('AI Video Created!', `Saved to Gallery: ${fileName}`);
                return {
                    synced: true,
                    destinationPath: destPath,
                    galleryUri: `content://media/external/video/media/${encodeURIComponent(fileName)}`,
                    statusMessage: 'Successfully exported to Android DCIM and indexed in MediaStore.'
                };
            }
            catch (err) {
                return {
                    synced: false,
                    destinationPath: localFilePath,
                    galleryUri: '',
                    statusMessage: `Termux gallery export error: ${err.message}`
                };
            }
        }
        // Scenario 2: Remote ADB Connected Android Device
        if (mode === 'android-adb') {
            const adb = this.deviceManager.getAdbBridge();
            const res = await adb.pushVideoToGallery(localFilePath, 'GoogleEdgeAI');
            if (res.success) {
                return {
                    synced: true,
                    destinationPath: res.remotePath,
                    galleryUri: `content://media/external/video/media/${encodeURIComponent(fileName)}`,
                    statusMessage: `Video pushed to Android device over ADB: ${res.remotePath}`
                };
            }
            else {
                return {
                    synced: false,
                    destinationPath: localFilePath,
                    galleryUri: '',
                    statusMessage: 'Failed to push video over ADB bridge.'
                };
            }
        }
        // Scenario 3: Local host machine (no Android device connected)
        const localOutputDir = Config.OUTPUT_DIR;
        Config.initDirectories();
        const destPath = path.join(localOutputDir, fileName);
        if (path.resolve(localFilePath) !== path.resolve(destPath)) {
            fs.copyFileSync(localFilePath, destPath);
        }
        return {
            synced: true,
            destinationPath: destPath,
            galleryUri: `file://${destPath}`,
            statusMessage: 'Saved locally. Connect an Android device (via ADB or run on Termux) to sync to phone Gallery.'
        };
    }
    /**
     * List videos stored in the Edge AI output folder
     */
    listGalleryVideos() {
        Config.initDirectories();
        const targetDir = Config.IS_TERMUX ? Config.ANDROID_DCIM : Config.OUTPUT_DIR;
        if (!fs.existsSync(targetDir))
            return [];
        try {
            const files = fs.readdirSync(targetDir);
            return files
                .filter(f => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'))
                .map(f => {
                const fullPath = path.join(targetDir, f);
                const stat = fs.statSync(fullPath);
                return {
                    name: f,
                    path: fullPath,
                    sizeMb: parseFloat((stat.size / (1024 * 1024)).toFixed(2)),
                    createdAt: stat.birthtime || stat.mtime
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=gallery-sync.js.map