/**
 * Google AI Edge Gallery Video MCP - Configuration & Environment Manager
 */

import path from 'path';
import os from 'os';
import fs from 'fs';
import dotenv from 'dotenv';
import ffmpegStatic from 'ffmpeg-static';
import { AspectRatio, VideoResolution } from './core/types.js';

dotenv.config();

// Resolve FFmpeg binary
let resolvedFfmpeg = 'ffmpeg';
try {
  const staticPath = (ffmpegStatic as unknown as string) || (ffmpegStatic as any)?.default;
  if (typeof staticPath === 'string' && fs.existsSync(staticPath)) {
    resolvedFfmpeg = staticPath;
  }
} catch {
  // fallback to system ffmpeg
}

export class Config {
  // Environment Flags
  public static readonly IS_TERMUX = Boolean(
    process.env.TERMUX_VERSION || 
    fs.existsSync('/data/data/com.termux')
  );

  public static readonly IS_ANDROID = Config.IS_TERMUX || Boolean(process.env.ANDROID_ROOT);

  // Base Directories
  public static readonly HOME_DIR = os.homedir();
  
  // Android Specific Paths
  public static readonly ANDROID_DCIM = '/sdcard/DCIM/GoogleEdgeAI';
  public static readonly ANDROID_GALLERY_APP_DATA = '/data/data/com.google.ai.edge.gallery/files/models';
  public static readonly ANDROID_INTERNAL_STORAGE = '/sdcard/Download/GoogleEdgeAI';

  // Output Directories
  public static readonly BASE_WORK_DIR = process.env.EDGE_MCP_WORK_DIR || 
    (Config.IS_TERMUX 
      ? path.join(Config.HOME_DIR, '.edge_ai_video') 
      : path.join(process.cwd(), '.edge_ai_video'));

  public static readonly FRAMES_DIR = path.join(Config.BASE_WORK_DIR, 'frames');
  public static readonly OUTPUT_DIR = process.env.EDGE_MCP_OUTPUT_DIR || 
    (Config.IS_TERMUX 
      ? Config.ANDROID_DCIM 
      : path.join(Config.BASE_WORK_DIR, 'output'));

  public static readonly MODELS_CACHE_DIR = process.env.EDGE_MCP_MODELS_DIR || 
    path.join(Config.BASE_WORK_DIR, 'models');

  // Binary Paths
  public static readonly FFMPEG_PATH = process.env.FFMPEG_PATH || (Config.IS_TERMUX ? 'ffmpeg' : resolvedFfmpeg);
  public static readonly ADB_PATH = process.env.ADB_PATH || 'adb';

  // Video Resolutions Mapping
  public static getResolution(aspectRatio: AspectRatio, isMobileConstrained = false): VideoResolution {
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
  public static initDirectories(): void {
    const dirs = [Config.BASE_WORK_DIR, Config.FRAMES_DIR, Config.OUTPUT_DIR, Config.MODELS_CACHE_DIR];
    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (err) {
        // Fallback for restricted storage environments
        console.warn(`[Config] Directory initialization notice: ${dir} (${(err as Error).message})`);
      }
    }
  }
}
