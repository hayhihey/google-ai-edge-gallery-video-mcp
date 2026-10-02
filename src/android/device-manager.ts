/**
 * Google AI Edge Gallery Video MCP - Unified Device Manager
 * Dynamically resolves execution mode (Termux, ADB, Local) and provides hardware-aware telemetry.
 */

import os from 'os';
import { Config } from '../config.js';
import { DeviceTelemetry, DeviceExecutionMode, VideoResolution } from '../core/types.js';
import { TermuxAdapter } from './termux-adapter.js';
import { AdbBridge, AdbDeviceInfo } from './adb-bridge.js';

export class DeviceManager {
  private adbBridge: AdbBridge;

  constructor() {
    this.adbBridge = new AdbBridge();
  }

  /**
   * Determine the current execution mode
   */
  public async getExecutionMode(): Promise<DeviceExecutionMode> {
    if (TermuxAdapter.isAvailable()) {
      return 'android-termux';
    }

    if (await this.adbBridge.isAdbAvailable()) {
      const devices = await this.adbBridge.getConnectedDevices();
      const activeDevice = devices.find(d => d.state === 'device');
      if (activeDevice) {
        return 'android-adb';
      }
    }

    return 'host-local';
  }

  /**
   * Get real-time device telemetry
   */
  public async getTelemetry(): Promise<DeviceTelemetry> {
    const mode = await this.getExecutionMode();

    if (mode === 'android-termux') {
      const battery = await TermuxAdapter.getBatteryStatus();
      const storageMb = await TermuxAdapter.getStorageMb();
      const localModels = TermuxAdapter.getEdgeGalleryLocalPaths();

      const isThrottled = (battery?.temperature ?? 25) > 42 || (battery?.percentage ?? 100) < 15;

      return {
        mode: 'android-termux',
        deviceName: `Android Phone (${os.hostname()})`,
        androidVersion: process.env.ANDROID_DATA ? 'Modern Android (API 30+)' : 'Android',
        batteryLevel: battery?.percentage ?? 85,
        isCharging: battery?.plugged !== 'UNPLUGGED' && battery?.status === 'CHARGING',
        batteryTemperatureC: battery?.temperature ?? 30,
        thermalStatus: isThrottled ? 'serious' : 'nominal',
        availableStorageMb: storageMb,
        hasHardwareEncoder: true,
        recommendedResolution: isThrottled ? { width: 720, height: 1280 } : { width: 1080, height: 1920 },
        edgeAiGalleryDetected: localModels.length > 0,
        activeModelName: 'Gemma-2B-IT (LiteRT On-Device)'
      };
    }

    if (mode === 'android-adb') {
      const devices = await this.adbBridge.getConnectedDevices();
      const device = devices.find(d => d.state === 'device') as AdbDeviceInfo;
      const battery = await this.adbBridge.getBatteryInfo(device.id);
      const thermal = await this.adbBridge.getThermalStatus(device.id);
      const models = await this.adbBridge.scanEdgeGalleryModels(device.id);

      const isThrottled = (battery?.temperature ?? 25) > 40 || thermal !== 'nominal';

      return {
        mode: 'android-adb',
        deviceName: `${device.model} (${device.id})`,
        androidVersion: 'Android Device via ADB',
        batteryLevel: battery?.level ?? 90,
        isCharging: battery?.isCharging ?? true,
        batteryTemperatureC: battery?.temperature ?? 31,
        thermalStatus: thermal as DeviceTelemetry['thermalStatus'],
        availableStorageMb: 24500,
        hasHardwareEncoder: true,
        recommendedResolution: isThrottled ? { width: 720, height: 1280 } : { width: 1080, height: 1920 },
        edgeAiGalleryDetected: models.length > 0,
        activeModelName: 'Google AI Edge Gallery (Connected via ADB)'
      };
    }

    // host-local fallback
    return {
      mode: 'host-local',
      deviceName: `${os.type()} ${os.arch()} Workstation`,
      androidVersion: 'Simulated Edge Pipeline (No Android Device Attached)',
      batteryLevel: 100,
      isCharging: true,
      batteryTemperatureC: 35,
      thermalStatus: 'nominal',
      availableStorageMb: 50000,
      hasHardwareEncoder: true,
      recommendedResolution: { width: 1080, height: 1920 },
      edgeAiGalleryDetected: false,
      activeModelName: 'Gemma-2B-IT (LiteRT Simulator)'
    };
  }

  public getAdbBridge(): AdbBridge {
    return this.adbBridge;
  }
}
