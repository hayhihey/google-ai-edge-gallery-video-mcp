import { describe, it, expect } from 'vitest';
import { DeviceManager } from '../src/android/device-manager.js';

describe('DeviceManager', () => {
  it('should return valid telemetry and recommendation', async () => {
    const manager = new DeviceManager();
    const telemetry = await manager.getTelemetry();

    expect(telemetry).toBeDefined();
    expect(['android-termux', 'android-adb', 'host-local']).toContain(telemetry.mode);
    expect(telemetry.recommendedResolution).toHaveProperty('width');
    expect(telemetry.recommendedResolution).toHaveProperty('height');
    expect(typeof telemetry.hasHardwareEncoder).toBe('boolean');
  }, 15000);
});
