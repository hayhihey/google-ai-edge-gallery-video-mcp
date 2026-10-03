/**
 * Google AI Edge Gallery Video MCP - Keyframe Generator & Frame Renderer
 * Generates universal, high-performance PPM keyframes compatible with 100% of FFmpeg builds.
 */
import fs from 'fs';
import path from 'path';
import { Config } from '../config.js';
export class FrameRenderer {
    /**
     * Render keyframes for all shots in a storyboard
     */
    static async renderStoryboardKeyframes(storyboard, customKeyframeMap) {
        Config.initDirectories();
        const results = [];
        for (const shot of storyboard.shots) {
            if (customKeyframeMap && customKeyframeMap[shot.id] && fs.existsSync(customKeyframeMap[shot.id])) {
                results.push({
                    shotId: shot.id,
                    filePath: customKeyframeMap[shot.id],
                    isSvg: false,
                    width: storyboard.resolution.width,
                    height: storyboard.resolution.height
                });
                continue;
            }
            const keyframePath = this.generateProceduralKeyframe(shot, storyboard.resolution, storyboard.id);
            results.push({
                shotId: shot.id,
                filePath: keyframePath,
                isSvg: false,
                width: storyboard.resolution.width,
                height: storyboard.resolution.height
            });
        }
        return results;
    }
    /**
     * Generates a smooth, high-fidelity PPM keyframe image
     */
    static generateProceduralKeyframe(shot, resolution, storyboardId) {
        const { width, height } = resolution;
        const fileName = `${storyboardId}_${shot.id}.ppm`;
        const outputPath = path.join(Config.FRAMES_DIR, fileName);
        const palettes = this.getColorPalettes(shot.colorGrade, shot.order);
        // PPM P6 header
        const header = Buffer.from(`P6\n${width} ${height}\n255\n`);
        const data = Buffer.alloc(width * height * 3);
        const cx = width / 2;
        const cy = height * 0.45;
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        // Precalculate row distances for blazing fast generation
        const dySquares = new Float32Array(height);
        const yRatios = new Float32Array(height);
        for (let y = 0; y < height; y++) {
            const dy = y - cy;
            dySquares[y] = dy * dy;
            yRatios[y] = y / height;
        }
        const dxSquares = new Float32Array(width);
        const xRatios = new Float32Array(width);
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            dxSquares[x] = dx * dx;
            xRatios[x] = x / width;
        }
        let ptr = 0;
        for (let y = 0; y < height; y++) {
            const yRatio = yRatios[y];
            const dy2 = dySquares[y];
            const baseR = palettes.r1 * (1 - yRatio) + palettes.r2 * yRatio;
            const baseB = palettes.b1 * (1 - yRatio) + palettes.b2 * yRatio;
            for (let x = 0; x < width; x++) {
                const xRatio = xRatios[x];
                const dist = Math.sqrt(dxSquares[x] + dy2) / maxDist;
                const glow = Math.max(0, 1 - dist * 1.8);
                let r = baseR + glow * 80;
                let g = palettes.g1 * (1 - xRatio) + palettes.g2 * xRatio + glow * 80;
                let b = baseB + glow * 100;
                const vig = Math.max(0.2, 1 - (dist * 0.5));
                data[ptr++] = Math.min(255, Math.floor(r * vig));
                data[ptr++] = Math.min(255, Math.floor(g * vig));
                data[ptr++] = Math.min(255, Math.floor(b * vig));
            }
        }
        fs.writeFileSync(outputPath, Buffer.concat([header, data]));
        return outputPath;
    }
    static getColorPalettes(grade, index) {
        const shift = (index * 40) % 255;
        switch (grade) {
            case 'cinematic_teal_orange':
                return { r1: 10, g1: 37, b1: 64, r2: 249, g2: 115, b2: 22 };
            case 'cyberpunk_neon':
                return { r1: 59, g1: 7, b1: 100, r2: 6, g2: 182, b2: 212 };
            case 'vivid_pop':
                return { r1: 30, g1: 27, b1: 75, r2: 236, g2: 72, b2: 153 };
            case 'vintage_warm':
                return { r1: 69, g1: 26, b1: 3, r2: 251, g2: 191, b2: 36 };
            case 'noir_monochrome':
                return { r1: 20, g1: 20, b1: 24, r2: 210, g2: 210, b2: 215 };
            default:
                return { r1: 15, g1: 23, b1: 42, r2: (56 + shift) % 255, g2: 189, b2: 248 };
        }
    }
}
//# sourceMappingURL=frame-renderer.js.map