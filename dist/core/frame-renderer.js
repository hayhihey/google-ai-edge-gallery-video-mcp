/**
 * Google AI Edge Gallery Video MCP - Keyframe Generator & Frame Renderer
 * Generates stylized, production-ready keyframe assets with typography, cinematic gradients, and edge graphics.
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
            // Check if user provided custom image for this shot
            if (customKeyframeMap && customKeyframeMap[shot.id] && fs.existsSync(customKeyframeMap[shot.id])) {
                results.push({
                    shotId: shot.id,
                    filePath: customKeyframeMap[shot.id],
                    isSvg: customKeyframeMap[shot.id].endsWith('.svg'),
                    width: storyboard.resolution.width,
                    height: storyboard.resolution.height
                });
                continue;
            }
            // Generate procedural cinematic keyframe
            const keyframePath = this.generateProceduralKeyframe(shot, storyboard.resolution, storyboard.id);
            results.push({
                shotId: shot.id,
                filePath: keyframePath,
                isSvg: true,
                width: storyboard.resolution.width,
                height: storyboard.resolution.height
            });
        }
        return results;
    }
    /**
     * Generates a modern, high-aesthetic SVG keyframe card
     */
    static generateProceduralKeyframe(shot, resolution, storyboardId) {
        const { width, height } = resolution;
        const isPortrait = height > width;
        // Palette selection based on shot color grade
        const palettes = this.getColorPalettes(shot.colorGrade, shot.order);
        const fileName = `${storyboardId}_${shot.id}.svg`;
        const outputPath = path.join(Config.FRAMES_DIR, fileName);
        const titleEscaped = this.escapeXml(shot.title);
        const promptEscaped = this.escapeXml(shot.visualPrompt);
        const captionEscaped = this.escapeXml(shot.captionText || '');
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palettes.primary}" />
      <stop offset="50%" stop-color="${palettes.secondary}" />
      <stop offset="100%" stop-color="${palettes.dark}" />
    </linearGradient>

    <!-- Edge Glow Effect -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <radialGradient id="meshCenter" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${palettes.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${palettes.dark}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Base Dark Canvas -->
  <rect width="${width}" height="${height}" fill="#0A0D14" />
  
  <!-- Dynamic Gradient Backdrop -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" opacity="0.85" />
  <rect width="${width}" height="${height}" fill="url(#meshCenter)" />

  <!-- Futuristic Geometric Framing (Edge AI Graphic Motif) -->
  <g opacity="0.25" stroke="${palettes.accent}" stroke-width="1.5" fill="none">
    <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.38}" />
    <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.44}" stroke-dasharray="12 8" />
    <line x1="${width * 0.1}" y1="${height * 0.1}" x2="${width * 0.9}" y2="${height * 0.1}" />
    <line x1="${width * 0.1}" y1="${height * 0.9}" x2="${width * 0.9}" y2="${height * 0.9}" />
  </g>

  <!-- Top Edge AI Status Badge -->
  <g transform="translate(${width * 0.08}, ${isPortrait ? height * 0.08 : height * 0.07})">
    <rect width="${isPortrait ? 280 : 320}" height="42" rx="21" fill="#141923" fill-opacity="0.85" stroke="${palettes.accent}" stroke-width="1" />
    <circle cx="24" cy="21" r="6" fill="${palettes.accent}" filter="url(#glow)" />
    <text x="42" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" letter-spacing="1.5">
      GOOGLE AI EDGE • ${shot.id.toUpperCase()}
    </text>
  </g>

  <!-- Hero Visual Centerpiece -->
  <g transform="translate(${width / 2}, ${isPortrait ? height * 0.45 : height * 0.48})" text-anchor="middle">
    <!-- Center Orb / Model Visualizer -->
    <circle cx="0" cy="0" r="${isPortrait ? 130 : 110}" fill="${palettes.accent}" fill-opacity="0.15" filter="url(#glow)" />
    <polygon points="0,-70 60,35 -60,35" fill="${palettes.accent}" fill-opacity="0.4" />
    <polygon points="0,70 60,-35 -60,-35" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.6" />

    <!-- Scene Title -->
    <text y="${isPortrait ? 190 : 160}" font-family="system-ui, -apple-system, sans-serif" font-size="${isPortrait ? 44 : 40}" font-weight="800" fill="#FFFFFF">
      ${titleEscaped}
    </text>

    <!-- Visual Description -->
    <text y="${isPortrait ? 240 : 205}" font-family="system-ui, -apple-system, sans-serif" font-size="${isPortrait ? 20 : 18}" font-weight="400" fill="#CBD5E1" opacity="0.9">
      ${promptEscaped.substring(0, 50)}${promptEscaped.length > 50 ? '...' : ''}
    </text>
  </g>

  <!-- Bottom Captions / Lower Third -->
  ${captionEscaped ? `
  <g transform="translate(${width * 0.08}, ${isPortrait ? height * 0.82 : height * 0.78})">
    <rect width="${width * 0.84}" height="${isPortrait ? 85 : 75}" rx="16" fill="#0F172A" fill-opacity="0.85" stroke="#334155" stroke-width="1.5" />
    <text x="${(width * 0.84) / 2}" y="${isPortrait ? 52 : 46}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${isPortrait ? 24 : 22}" font-weight="800" fill="#38BDF8" letter-spacing="1">
      ${captionEscaped}
    </text>
  </g>
  ` : ''}

  <!-- Watermark / Footer -->
  <text x="${width / 2}" y="${height - 25}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#64748B" letter-spacing="2">
    ON-DEVICE INFERENCE • GOOGLE AI EDGE GALLERY
  </text>
</svg>`;
        fs.writeFileSync(outputPath, svgContent, 'utf8');
        return outputPath;
    }
    static getColorPalettes(grade, index) {
        const shift = (index * 45) % 360;
        switch (grade) {
            case 'cinematic_teal_orange':
                return { primary: '#0A2540', secondary: '#1E3A8A', accent: '#F97316', dark: '#030712' };
            case 'cyberpunk_neon':
                return { primary: '#3B0764', secondary: '#4C1D95', accent: '#06B6D4', dark: '#020617' };
            case 'vivid_pop':
                return { primary: '#1E1B4B', secondary: '#4338CA', accent: '#EC4899', dark: '#09090B' };
            case 'vintage_warm':
                return { primary: '#451A03', secondary: '#78350F', accent: '#FBBF24', dark: '#1C1917' };
            case 'noir_monochrome':
                return { primary: '#18181B', secondary: '#27272A', accent: '#E4E4E7', dark: '#09090B' };
            default:
                return {
                    primary: `hsl(${220 + shift}, 60%, 15%)`,
                    secondary: `hsl(${240 + shift}, 70%, 25%)`,
                    accent: '#38BDF8',
                    dark: '#030712'
                };
        }
    }
    static escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }
}
//# sourceMappingURL=frame-renderer.js.map