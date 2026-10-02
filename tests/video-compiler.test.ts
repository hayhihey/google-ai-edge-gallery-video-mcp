import { describe, it, expect } from 'vitest';
import { VideoCompiler } from '../src/core/video-compiler.js';
import { StoryboardDirector } from '../src/core/director.js';

describe('VideoCompiler', () => {
  it('should detect if ffmpeg is available', async () => {
    const compiler = new VideoCompiler();
    const available = await compiler.isFfmpegAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should throw clear actionable guidance when ffmpeg is missing', async () => {
    const compiler = new VideoCompiler('non_existent_ffmpeg_binary_path');
    const storyboard = StoryboardDirector.planStoryboard({
      prompt: 'Test video',
      targetDurationSeconds: 4
    });

    await expect(compiler.renderVideo({ storyboard })).rejects.toThrow(
      /FFmpeg not found/
    );
  });
});
