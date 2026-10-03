/**
 * Google AI Edge Gallery Video MCP - Video Effects & Filter Pipeline
 * Generates hardware-optimized filtergraphs for camera motion, color grading, and edge effects.
 */
import { CameraMotion, ColorGradePreset, VideoResolution } from './types.js';
export declare class FxPipeline {
    /**
     * Build an FFmpeg filtergraph for a single shot:
     * 1. Dynamic Camera Motion (Ken Burns Pan / Zoom)
     * 2. Color Grading
     * 3. Subtle Vignette
     */
    static buildShotFilterGraph(motion: CameraMotion, colorGrade: ColorGradePreset, resolution: VideoResolution, durationSeconds: number, fps: number): string;
    /**
     * Generate smooth Ken Burns pan / tilt / zoom expressions
     */
    private static getZoomPanFilter;
    /**
     * Hardware-friendly color grading curves using FFmpeg eq & colorbalance
     */
    private static getColorGradeFilter;
}
