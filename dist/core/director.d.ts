/**
 * Google AI Edge Gallery Video MCP - Storyboard Director
 * Synthesizes creative prompts into production-grade cinematic storyboards.
 */
import { VideoStoryboard, AspectRatio } from './types.js';
export interface PlanStoryboardOptions {
    prompt: string;
    title?: string;
    aspectRatio?: AspectRatio;
    targetDurationSeconds?: number;
    shotsCount?: number;
    style?: 'cinematic' | 'social_reel' | 'documentary' | 'cyberpunk' | 'minimalist';
    isMobileConstrained?: boolean;
}
export declare class StoryboardDirector {
    /**
     * Plan and structure a comprehensive video storyboard from a concept prompt
     */
    static planStoryboard(options: PlanStoryboardOptions): VideoStoryboard;
    private static extractTitleFromPrompt;
    private static generateShots;
    private static generateCaptionForShot;
}
