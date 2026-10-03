/**
 * Google AI Edge Gallery Video MCP - Edge Models Registry & Manager
 * Catalogs and manages models compatible with Google AI Edge Gallery.
 */
import { EdgeModelInfo } from '../core/types.js';
export declare class EdgeModelManager {
    private static readonly MODEL_REGISTRY;
    /**
     * List all registered Edge AI models with availability flags
     */
    static listModels(): EdgeModelInfo[];
    /**
     * Get specific model info
     */
    static getModel(id: string): EdgeModelInfo | undefined;
    /**
     * Verify if a model exists or get recommended fallback
     */
    static resolveModelForTask(task: 'storyboarding' | 'captioning' | 'image_gen' | 'segmentation'): EdgeModelInfo;
}
