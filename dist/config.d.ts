/**
 * Google AI Edge Gallery Video MCP - Configuration & Environment Manager
 */
import { AspectRatio, VideoResolution } from './core/types.js';
export declare class Config {
    static readonly IS_TERMUX: boolean;
    static readonly IS_ANDROID: boolean;
    static readonly HOME_DIR: string;
    static readonly ANDROID_DCIM = "/sdcard/DCIM/GoogleEdgeAI";
    static readonly ANDROID_GALLERY_APP_DATA = "/data/data/com.google.ai.edge.gallery/files/models";
    static readonly ANDROID_INTERNAL_STORAGE = "/sdcard/Download/GoogleEdgeAI";
    static readonly BASE_WORK_DIR: string;
    static readonly FRAMES_DIR: string;
    static readonly OUTPUT_DIR: string;
    static readonly MODELS_CACHE_DIR: string;
    static readonly FFMPEG_PATH: string;
    static readonly ADB_PATH: string;
    static getResolution(aspectRatio: AspectRatio, isMobileConstrained?: boolean): VideoResolution;
    static initDirectories(): void;
}
