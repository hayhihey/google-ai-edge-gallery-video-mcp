import { describe, it, expect } from 'vitest';
import { StoryboardDirector } from '../src/core/director.js';

describe('StoryboardDirector', () => {
  it('should generate a valid 9:16 vertical storyboard for mobile', () => {
    const storyboard = StoryboardDirector.planStoryboard({
      prompt: 'A cyberpunk drone racing through neon Tokyo',
      aspectRatio: '9:16',
      targetDurationSeconds: 12,
      style: 'cyberpunk'
    });

    expect(storyboard).toBeDefined();
    expect(storyboard.aspectRatio).toBe('9:16');
    expect(storyboard.resolution.width).toBe(1080);
    expect(storyboard.resolution.height).toBe(1920);
    expect(storyboard.shots.length).toBeGreaterThanOrEqual(3);
    expect(storyboard.shots[0].cameraMotion).toBe('zoom_in');
    expect(storyboard.shots[0].colorGrade).toBe('cyberpunk_neon');
    expect(storyboard.shots[0].captionText).toContain('DISCOVER:');
  });

  it('should adapt resolution for mobile-constrained device', () => {
    const storyboard = StoryboardDirector.planStoryboard({
      prompt: 'Nature documentary of mountain peaks',
      aspectRatio: '16:9',
      targetDurationSeconds: 16,
      style: 'documentary',
      isMobileConstrained: true
    });

    expect(storyboard.resolution.width).toBe(1280);
    expect(storyboard.resolution.height).toBe(720);
    expect(storyboard.fps).toBe(24);
  });

  it('should respect custom shot count when specified', () => {
    const storyboard = StoryboardDirector.planStoryboard({
      prompt: 'Product demo',
      shotsCount: 5,
      targetDurationSeconds: 20
    });

    expect(storyboard.shots.length).toBe(5);
    expect(storyboard.shots[0].durationSeconds).toBe(4);
  });
});
