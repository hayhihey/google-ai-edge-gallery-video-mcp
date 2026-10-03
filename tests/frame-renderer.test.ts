import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { FrameRenderer } from '../src/core/frame-renderer.js';
import { StoryboardDirector } from '../src/core/director.js';

describe('FrameRenderer', () => {
  it('should generate SVG keyframes for a storyboard', async () => {
    const storyboard = StoryboardDirector.planStoryboard({
      prompt: 'Neon synthwave highway driving towards a glowing sun',
      aspectRatio: '9:16',
      targetDurationSeconds: 8,
      shotsCount: 2
    });

    const keyframes = await FrameRenderer.renderStoryboardKeyframes(storyboard);

    expect(keyframes).toHaveLength(2);
    expect(fs.existsSync(keyframes[0].filePath)).toBe(true);
    expect(keyframes[0].filePath.endsWith('.ppm')).toBe(true);

    const buffer = fs.readFileSync(keyframes[0].filePath);
    expect(buffer.toString('ascii', 0, 2)).toBe('P6');
    expect(buffer.length).toBeGreaterThan(1000);

    // Clean up test file
    try {
      for (const kf of keyframes) {
        if (fs.existsSync(kf.filePath)) fs.unlinkSync(kf.filePath);
      }
    } catch {}
  });
});
