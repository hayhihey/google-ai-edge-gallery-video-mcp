/**
 * Google AI Edge Gallery Video MCP - Video Effects & Filter Pipeline
 * Generates hardware-optimized filtergraphs for camera motion, color grading, and edge effects.
 */
export class FxPipeline {
    /**
     * Build an FFmpeg filtergraph for a single shot:
     * 1. Dynamic Camera Motion (Ken Burns Pan / Zoom)
     * 2. Color Grading
     * 3. Subtle Vignette
     */
    static buildShotFilterGraph(motion, colorGrade, resolution, durationSeconds, fps) {
        const totalFrames = Math.max(1, Math.round(durationSeconds * fps));
        const { width, height } = resolution;
        const filters = [];
        // 1. Camera Motion via zoompan filter
        const motionFilter = this.getZoomPanFilter(motion, width, height, totalFrames, fps);
        filters.push(motionFilter);
        // 2. Color Grading Preset
        const colorFilter = this.getColorGradeFilter(colorGrade);
        if (colorFilter) {
            filters.push(colorFilter);
        }
        // 3. Cinematic Vignette & Edge Softening
        filters.push('vignette=PI/4');
        return filters.join(',');
    }
    /**
     * Generate smooth Ken Burns pan / tilt / zoom expressions
     */
    static getZoomPanFilter(motion, width, height, totalFrames, fps) {
        const zStep = 0.2 / totalFrames; // Subtle zoom delta over the duration
        switch (motion) {
            case 'zoom_in':
                // Zoom from 1.0 to 1.2 toward center
                return `zoompan=z='min(zoom+${zStep.toFixed(5)},1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'zoom_out':
                // Zoom out from 1.2 to 1.0
                return `zoompan=z='if(lte(zoom,1.0),1.0,max(1.0,1.2-${zStep.toFixed(5)}*on))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'pan_right':
                // Slow pan from left to right at constant 1.15 zoom
                return `zoompan=z='1.15':x='if(lte(on,-1),(iw-iw/zoom)/2,min(iw-iw/zoom,(on/${totalFrames})*(iw-iw/zoom)))':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'pan_left':
                // Slow pan from right to left
                return `zoompan=z='1.15':x='if(lte(on,-1),(iw-iw/zoom)/2,max(0,(1-on/${totalFrames})*(iw-iw/zoom)))':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'tilt_up':
                return `zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,-1),(ih-ih/zoom)/2,max(0,(1-on/${totalFrames})*(ih-ih/zoom)))':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'tilt_down':
                return `zoompan=z='1.12':x='iw/2-(iw/zoom/2)':y='if(lte(on,-1),(ih-ih/zoom)/2,min(ih-ih/zoom,(on/${totalFrames})*(ih-ih/zoom)))':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
            case 'static':
            default:
                // Hold frame without motion jitter
                return `scale=${width}:${height}`;
        }
    }
    /**
     * Hardware-friendly color grading curves using FFmpeg eq & colorbalance
     */
    static getColorGradeFilter(grade) {
        switch (grade) {
            case 'cinematic_teal_orange':
                // Warm highlights, cool cyan shadows
                return 'eq=contrast=1.15:brightness=-0.02:saturation=1.2,colorbalance=rs=0.08:gs=-0.02:bs=-0.1:rm=-0.05:gm=0.0:bm=0.08';
            case 'cyberpunk_neon':
                // Hyper-saturated magenta / cyan high contrast
                return 'eq=contrast=1.3:brightness=-0.03:saturation=1.45,colorbalance=rs=0.12:gs=-0.1:bs=0.2';
            case 'vivid_pop':
                // Punchy saturated look for mobile social reels
                return 'eq=contrast=1.1:brightness=0.01:saturation=1.35';
            case 'vintage_warm':
                // Golden hour 70s film look
                return 'eq=contrast=1.05:brightness=0.02:saturation=0.9,colorbalance=rs=0.15:gs=0.08:bs=-0.15';
            case 'noir_monochrome':
                // High contrast black & white
                return 'hue=s=0,eq=contrast=1.4:brightness=-0.02';
            case 'standard':
            default:
                return 'eq=contrast=1.05:saturation=1.05';
        }
    }
}
//# sourceMappingURL=fx-pipeline.js.map