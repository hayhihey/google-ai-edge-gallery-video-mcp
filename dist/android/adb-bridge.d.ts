/**
 * Google AI Edge Gallery Video MCP - ADB Bridge
 * Enables remote control, execution, and video push to Android devices over USB/Wi-Fi.
 */
export interface AdbDeviceInfo {
    id: string;
    state: 'device' | 'unauthorized' | 'offline';
    model?: string;
    product?: string;
}
export declare class AdbBridge {
    private adbCmd;
    constructor(adbBinaryPath?: string);
    /**
     * Check if ADB is installed and reachable
     */
    isAdbAvailable(): Promise<boolean>;
    /**
     * List connected Android devices
     */
    getConnectedDevices(): Promise<AdbDeviceInfo[]>;
    /**
     * Run a shell command on the primary or specified Android device
     */
    shell(command: string, deviceId?: string): Promise<string>;
    /**
     * Get device battery info via dumpsys
     */
    getBatteryInfo(deviceId?: string): Promise<{
        level: number;
        temperature: number;
        isCharging: boolean;
    } | null>;
    /**
     * Get device thermal throttling status
     */
    getThermalStatus(deviceId?: string): Promise<string>;
    /**
     * Push generated video file to Android's DCIM / Gallery folder
     */
    pushVideoToGallery(localFilePath: string, remoteSubDir?: string, deviceId?: string): Promise<{
        success: boolean;
        remotePath: string;
    }>;
    /**
     * Broadcast intent to trigger media scanner on Android
     */
    scanMedia(remoteFilePath: string, deviceId?: string): Promise<void>;
    /**
     * Discover Google AI Edge Gallery model assets on device
     */
    scanEdgeGalleryModels(deviceId?: string): Promise<string[]>;
}
