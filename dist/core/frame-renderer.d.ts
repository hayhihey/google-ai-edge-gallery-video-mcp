/**
 * Google AI Edge Gallery Video MCP - Keyframe Generator & Frame Renderer
 * Generates stylized, production-ready keyframe assets with typography, cinematic gradients, and edge graphics.
 */
import { SceneShot, VideoStoryboard, VideoResolution } from './types.js';
export interface GeneratedKeyframe {
    shotId: string;
    filePath: string;
    isSvg: boolean;
    width: number;
    height: number;
}
export declare class FrameRenderer {
    /**
     * Render keyframes for all shots in a storyboard
     */
    static renderStoryboardKeyframes(storyboard: VideoStoryboard, customKeyframeMap?: Record<string, string>): Promise<GeneratedKeyframe[]>;
    /**
     * Generates a modern, high-aesthetic SVG keyframe card
     */
    static generateProceduralKeyframe(shot: SceneShot, resolution: VideoResolution, storyboardId: string): string;
    private static getColorPalettes;
    private static escapeXml;
}
