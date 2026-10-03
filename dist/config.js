/**
 * Google AI Edge Gallery Video MCP - Configuration & Environment Manager
 */
import path from 'path';
import os from 'os';
import fs from 'fs';
import dotenv from 'dotenv';
import ffmpegStatic from 'ffmpeg-static';
dotenv.config();
// Resolve FFmpeg binary
let resolvedFfmpeg = 'ffmpeg';
try {
    const staticPath = ffmpegStatic || ffmpegStatic?.default;
    if (typeof staticPath === 'string' && fs.existsSync(staticPath)) {
        resolvedFfmpeg = staticPath;
    }
}
catch {
    // fallback to system ffmpeg
}
export class Config {
    // Environment Flags
    static IS_TERMUX = Boolean(process.env.TERMUX_VERSION ||
        fs.existsSync('/data/data/com.termux'));
    static IS_ANDROID = Config.IS_TERMUX || Boolean(process.env.ANDROID_ROOT);
    // Base Directories
    static HOME_DIR = os.homedir();
    // Android Specific Paths
    static ANDROID_DCIM = '/sdcard/DCIM/GoogleEdgeAI';
    static ANDROID_GALLERY_APP_DATA = '/data/data/com.google.ai.edge.gallery/files/models';
    static ANDROID_INTERNAL_STORAGE = '/sdcard/Download/GoogleEdgeAI';
    // Output Directories
    static BASE_WORK_DIR = process.env.EDGE_MCP_WORK_DIR ||
        (Config.IS_TERMUX
            ? path.join(Config.HOME_DIR, '.edge_ai_video')
            : path.join(process.cwd(), '.edge_ai_video'));
    static FRAMES_DIR = path.join(Config.BASE_WORK_DIR, 'frames');
    static OUTPUT_DIR = process.env.EDGE_MCP_OUTPUT_DIR ||
        (Config.IS_TERMUX
            ? Config.ANDROID_DCIM
            : path.join(Config.BASE_WORK_DIR, 'output'));
    static MODELS_CACHE_DIR = process.env.EDGE_MCP_MODELS_DIR ||
        path.join(Config.BASE_WORK_DIR, 'models');
    // Binary Paths
    static FFMPEG_PATH = process.env.FFMPEG_PATH || (Config.IS_TERMUX ? 'ffmpeg' : resolvedFfmpeg);
    static ADB_PATH = process.env.ADB_PATH || 'adb';
    // Video Resolutions Mapping
    static getResolution(aspectRatio, isMobileConstrained = false) {
        if (isMobileConstrained) {
            // Lower power / faster encoding for battery-constrained mobile edge runs
            switch (aspectRatio) {
                case '9:16':
                    return { width: 720, height: 1280 };
                case '16:9':
                    return { width: 1280, height: 720 };
                case '1:1':
                    return { width: 720, height: 720 };
                case '4:3':
                    return { width: 960, height: 720 };
            }
        }
        // High Quality standard
        switch (aspectRatio) {
            case '9:16':
                return { width: 1080, height: 1920 };
            case '16:9':
                return { width: 1920, height: 1080 };
            case '1:1':
                return { width: 1080, height: 1080 };
            case '4:3':
                return { width: 1440, height: 1080 };
        }
    }
    // Ensure working directories exist
    static initDirectories() {
        const dirs = [Config.BASE_WORK_DIR, Config.FRAMES_DIR, Config.OUTPUT_DIR, Config.MODELS_CACHE_DIR];
        for (const dir of dirs) {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            }
            catch (err) {
                // Fallback for restricted storage environments
                console.warn(`[Config] Directory initialization notice: ${dir} (${err.message})`);
            }
        }
    }
}
//# sourceMappingURL=config.js.map