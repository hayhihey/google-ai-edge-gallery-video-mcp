import { describe, it, expect } from 'vitest';
import { FxPipeline } from '../src/core/fx-pipeline.js';

describe('FxPipeline', () => {
  it('should generate zoom_in panzoom filter with vignette and color balance', () => {
    const filter = FxPipeline.buildShotFilterGraph(
      'zoom_in',
      'cinematic_teal_orange',
      { width: 1080, height: 1920 },
      4,
      30
    );

    expect(filter).toContain('zoompan=z=\'min(zoom+');
    expect(filter).toContain('vignette=PI/4');
    expect(filter).toContain('colorbalance=');
  });

  it('should handle static shot motion gracefully', () => {
    const filter = FxPipeline.buildShotFilterGraph(
      'static',
      'noir_monochrome',
      { width: 1920, height: 1080 },
      3,
      30
    );

    expect(filter).toContain('scale=1920:1080');
    expect(filter).toContain('hue=s=0');
  });
});
