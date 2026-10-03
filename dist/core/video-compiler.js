/**
 * Google AI Edge Gallery Video MCP - Video Compiler
 * Compiles keyframes, audio, transitions, and filters into mobile-optimized MP4 video.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Config } from '../config.js';
import { FrameRenderer } from './frame-renderer.js';
import { FxPipeline } from './fx-pipeline.js';
import { GallerySync } from '../android/gallery-sync.js';
const execAsync = promisify(exec);
export class VideoCompiler {
    ffmpegBin;
    gallerySync;
    constructor(ffmpegBinaryPath = Config.FFMPEG_PATH) {
        this.ffmpegBin = ffmpegBinaryPath;
        this.gallerySync = new GallerySync();
    }
    /**
     * Verify if FFmpeg is installed and accessible
     */
    async isFfmpegAvailable() {
        try {
            const { stdout, stderr } = await execAsync(`"${this.ffmpegBin}" -version`);
            return stdout.includes('ffmpeg version') || stderr.includes('ffmpeg version');
        }
        catch {
            return false;
        }
    }
    /**
     * Full end-to-end rendering pipeline:
     * 1. Render/collect Keyframes
     * 2. Build individual animated shot clips
     * 3. Concatenate and assemble transitions
     * 4. Add audio score (Edge synth or user audio)
     * 5. Export to Android DCIM Gallery & index in MediaStore
     */
    async renderVideo(options) {
        const startTime = Date.now();
        Config.initDirectories();
        const { storyboard } = options;
        const ffmpegOk = await this.isFfmpegAvailable();
        if (!ffmpegOk) {
            throw new Error(`FFmpeg not found at '${this.ffmpegBin}'. ` +
                (Config.IS_TERMUX
                    ? 'On Android Termux, please run: pkg install ffmpeg'
                    : 'Please install ffmpeg and ensure it is on your system PATH.'));
        }
        // Step 1: Render Keyframes
        const kfStartTime = Date.now();
        const keyframes = await FrameRenderer.renderStoryboardKeyframes(storyboard);
        const storyboardTimeMs = Date.now() - kfStartTime;
        // Step 2: Render individual shots into temp video clips
        const shotClipsDir = path.join(Config.BASE_WORK_DIR, `shots_${storyboard.id}`);
        if (!fs.existsSync(shotClipsDir)) {
            fs.mkdirSync(shotClipsDir, { recursive: true });
        }
        const shotClipPaths = [];
        const renderStartTime = Date.now();
        for (let i = 0; i < storyboard.shots.length; i++) {
            const shot = storyboard.shots[i];
            const kf = keyframes.find(k => k.shotId === shot.id) || keyframes[i];
            const shotClipPath = path.join(shotClipsDir, `shot_${i}.mp4`);
            await this.compileSingleShot(shot, kf, shotClipPath, storyboard.fps, storyboard.resolution, options.applyMotionFx ?? true);
            shotClipPaths.push(shotClipPath);
        }
        const renderingTimeMs = Date.now() - renderStartTime;
        // Step 3: Concat clips & compile final output
        const encStartTime = Date.now();
        const outputFileName = options.outputFileName ||
            `${storyboard.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.mp4`;
        const tempFinalPath = path.join(Config.BASE_WORK_DIR, outputFileName);
        await this.assembleFinalVideo(shotClipPaths, tempFinalPath, storyboard.targetDurationSeconds, options.addBackgroundScore ?? true);
        const encodingTimeMs = Date.now() - encStartTime;
        const totalTimeMs = Date.now() - startTime;
        // Clean up temporary shot clips
        try {
            for (const p of shotClipPaths) {
                if (fs.existsSync(p))
                    fs.unlinkSync(p);
            }
            if (fs.existsSync(shotClipsDir))
                fs.rmdirSync(shotClipsDir);
        }
        catch {
            // ignore cleanup errors
        }
        // Step 4: Android Gallery Sync (if requested or in mobile environment)
        let galleryUri;
        let scanStatus;
        let finalVideoPath = tempFinalPath;
        if (options.exportToAndroidGallery ?? true) {
            const syncResult = await this.gallerySync.exportToGallery(tempFinalPath, storyboard.title);
            if (syncResult.synced) {
                finalVideoPath = syncResult.destinationPath;
                galleryUri = syncResult.galleryUri;
                scanStatus = syncResult.statusMessage;
            }
        }
        const stat = fs.existsSync(finalVideoPath) ? fs.statSync(finalVideoPath) : { size: 0 };
        return {
            success: true,
            videoPath: finalVideoPath,
            videoFileName: path.basename(finalVideoPath),
            durationSeconds: storyboard.targetDurationSeconds,
            fileSizeBytes: stat.size,
            resolution: storyboard.resolution,
            fps: storyboard.fps,
            androidGalleryUri: galleryUri,
            androidScanStatus: scanStatus,
            shotsCount: storyboard.shots.length,
            metrics: {
                storyboardTimeMs,
                renderingTimeMs,
                encodingTimeMs,
                totalTimeMs
            }
        };
    }
    /**
     * Compiles a single shot image with Ken Burns motion and color grading
     */
    async compileSingleShot(shot, keyframe, outputPath, fps, resolution, applyMotion) {
        const { width, height } = resolution;
        const duration = shot.durationSeconds;
        let filterGraph = `scale=${width}:${height}`;
        if (applyMotion) {
            filterGraph = FxPipeline.buildShotFilterGraph(shot.cameraMotion, shot.colorGrade, resolution, duration, fps);
        }
        // Android-friendly H.264 Main profile encoding
        const cmd = `"${this.ffmpegBin}" -y -loop 1 -t ${duration} -i "${keyframe.filePath}" ` +
            `-vf "${filterGraph},format=yuv420p" ` +
            `-c:v libx264 -preset ultrafast -tune stillimage -profile:v main -level 3.1 ` +
            `-r ${fps} -pix_fmt yuv420p "${outputPath}"`;
        try {
            await execAsync(cmd);
        }
        catch (err) {
            // Fallback: simpler filter if complex zoompan fails
            const fallbackCmd = `"${this.ffmpegBin}" -y -loop 1 -t ${duration} -i "${keyframe.filePath}" ` +
                `-vf "scale=${width}:${height},format=yuv420p" ` +
                `-c:v libx264 -preset ultrafast -profile:v baseline ` +
                `-r ${fps} -pix_fmt yuv420p "${outputPath}"`;
            await execAsync(fallbackCmd);
        }
    }
    /**
     * Assemble shot clips into final MP4 with ambient Edge audio soundtrack
     */
    async assembleFinalVideo(clipPaths, outputPath, targetDuration, includeAudio) {
        // Write concat file list
        const concatListPath = path.join(Config.BASE_WORK_DIR, `concat_${Date.now()}.txt`);
        const fileContents = clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(concatListPath, fileContents, 'utf8');
        let cmd;
        if (includeAudio) {
            // Synthesize ambient drone score (Edge AI aesthetic soundbed) using FFmpeg lavfi audio
            cmd = `"${this.ffmpegBin}" -y -f concat -safe 0 -i "${concatListPath}" ` +
                `-f lavfi -i "anoisesrc=d=${targetDuration}:c=pink:r=44100:a=0.015,lowpass=f=400,volume=1.5" ` +
                `-c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart "${outputPath}"`;
        }
        else {
            cmd = `"${this.ffmpegBin}" -y -f concat -safe 0 -i "${concatListPath}" ` +
                `-c:v copy -movflags +faststart "${outputPath}"`;
        }
        try {
            await execAsync(cmd);
        }
        catch {
            // Fallback without audio filter if anoisesrc is unavailable
            const fallbackCmd = `"${this.ffmpegBin}" -y -f concat -safe 0 -i "${concatListPath}" ` +
                `-c:v copy -movflags +faststart "${outputPath}"`;
            await execAsync(fallbackCmd);
        }
        finally {
            if (fs.existsSync(concatListPath)) {
                try {
                    fs.unlinkSync(concatListPath);
                }
                catch { }
            }
        }
    }
}
//# sourceMappingURL=video-compiler.js.map