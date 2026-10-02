/**
 * Google AI Edge Gallery Video MCP - Edge Models Registry & Manager
 * Catalogs and manages models compatible with Google AI Edge Gallery.
 */

import fs from 'fs';
import path from 'path';
import { Config } from '../config.js';
import { EdgeModelInfo } from '../core/types.js';

export class EdgeModelManager {
  private static readonly MODEL_REGISTRY: EdgeModelInfo[] = [
    {
      id: 'gemma-2b-it-litert',
      name: 'Gemma 2B IT (LiteRT/MediaPipe)',
      category: 'llm',
      format: 'litert',
      sizeBytes: 1400000000, // ~1.4GB
      quantization: 'int4/int8 mixed',
      isAvailable: false,
      recommendedFor: ['storyboarding', 'captioning']
    },
    {
      id: 'gemma-3n-e4m-litert',
      name: 'Gemma 3n Multimodal (Vision-Language LiteRT)',
      category: 'vision-language',
      format: 'litert',
      sizeBytes: 2100000000, // ~2.1GB
      quantization: 'int4',
      isAvailable: false,
      recommendedFor: ['storyboarding', 'captioning', 'segmentation']
    },
    {
      id: 'mobilediffusion-litert',
      name: 'MobileDiffusion (Edge Video Keyframe Synthesizer)',
      category: 'diffusion',
      format: 'litert',
      sizeBytes: 520000000, // ~520MB
      quantization: 'fp16',
      isAvailable: false,
      recommendedFor: ['image_gen']
    },
    {
      id: 'mediapipe-selfie-segmenter',
      name: 'MediaPipe Video Segmenter & Matte FX',
      category: 'mediapipe-task',
      format: 'task',
      sizeBytes: 15000000, // ~15MB
      quantization: 'int8',
      isAvailable: true, // Bundled / Procedural edge shader
      recommendedFor: ['segmentation']
    }
  ];

  /**
   * List all registered Edge AI models with availability flags
   */
  public static listModels(): EdgeModelInfo[] {
    Config.initDirectories();
    const searchDirs = [
      Config.MODELS_CACHE_DIR,
      Config.ANDROID_GALLERY_APP_DATA,
      '/sdcard/Android/data/com.google.ai.edge.gallery/files/models',
      '/sdcard/Download/GoogleEdgeAI/models'
    ];

    return this.MODEL_REGISTRY.map(model => {
      let localPath: string | undefined;

      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const candidate = path.join(dir, `${model.id}.${model.format}`);
        if (fs.existsSync(candidate)) {
          localPath = candidate;
          break;
        }
      }

      return {
        ...model,
        localPath,
        isAvailable: Boolean(localPath) || model.id === 'mediapipe-selfie-segmenter'
      };
    });
  }

  /**
   * Get specific model info
   */
  public static getModel(id: string): EdgeModelInfo | undefined {
    return this.listModels().find(m => m.id === id);
  }

  /**
   * Verify if a model exists or get recommended fallback
   */
  public static resolveModelForTask(task: 'storyboarding' | 'captioning' | 'image_gen' | 'segmentation'): EdgeModelInfo {
    const models = this.listModels();
    const match = models.find(m => m.recommendedFor.includes(task) && m.isAvailable);
    if (match) return match;
    
    // Return default recommended even if running in edge procedural simulation mode
    return models.find(m => m.recommendedFor.includes(task)) || models[0];
  }
}
