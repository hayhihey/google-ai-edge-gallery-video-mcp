/**
 * Google AI Edge Gallery Video MCP - Video Compiler
 * Compiles keyframes, audio, transitions, and filters into mobile-optimized MP4 video.
 */
import { RenderResult, RenderOptions } from './types.js';
export declare class VideoCompiler {
    private ffmpegBin;
    private gallerySync;
    constructor(ffmpegBinaryPath?: string);
    /**
     * Verify if FFmpeg is installed and accessible
     */
    isFfmpegAvailable(): Promise<boolean>;
    /**
     * Full end-to-end rendering pipeline:
     * 1. Render/collect Keyframes
     * 2. Build individual animated shot clips
     * 3. Concatenate and assemble transitions
     * 4. Add audio score (Edge synth or user audio)
     * 5. Export to Android DCIM Gallery & index in MediaStore
     */
    renderVideo(options: RenderOptions): Promise<RenderResult>;
    /**
     * Compiles a single shot image with Ken Burns motion and color grading
     */
    private compileSingleShot;
    /**
     * Assemble shot clips into final MP4 with ambient Edge audio soundtrack
     */
    private assembleFinalVideo;
}
