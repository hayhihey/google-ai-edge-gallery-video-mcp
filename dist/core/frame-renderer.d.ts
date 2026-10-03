/**
 * Google AI Edge Gallery Video MCP - Keyframe Generator & Frame Renderer
 * Generates universal, high-performance PPM keyframes compatible with 100% of FFmpeg builds.
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
     * Generates a smooth, high-fidelity PPM keyframe image
     */
    static generateProceduralKeyframe(shot: SceneShot, resolution: VideoResolution, storyboardId: string): string;
    private static getColorPalettes;
}
