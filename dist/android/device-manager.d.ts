/**
 * Google AI Edge Gallery Video MCP - Unified Device Manager
 * Dynamically resolves execution mode (Termux, ADB, Local) and provides hardware-aware telemetry.
 */
import { DeviceTelemetry, DeviceExecutionMode } from '../core/types.js';
import { AdbBridge } from './adb-bridge.js';
export declare class DeviceManager {
    private adbBridge;
    constructor();
    /**
     * Determine the current execution mode
     */
    getExecutionMode(): Promise<DeviceExecutionMode>;
    /**
     * Get real-time device telemetry
     */
    getTelemetry(): Promise<DeviceTelemetry>;
    getAdbBridge(): AdbBridge;
}
