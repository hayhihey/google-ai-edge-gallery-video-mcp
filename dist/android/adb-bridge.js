/**
 * Google AI Edge Gallery Video MCP - ADB Bridge
 * Enables remote control, execution, and video push to Android devices over USB/Wi-Fi.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Config } from '../config.js';
const execAsync = promisify(exec);
export class AdbBridge {
    adbCmd;
    constructor(adbBinaryPath = Config.ADB_PATH) {
        this.adbCmd = adbBinaryPath;
    }
    /**
     * Check if ADB is installed and reachable
     */
    async isAdbAvailable() {
        try {
            const { stdout } = await execAsync(`${this.adbCmd} version`, { timeout: 2000 });
            return stdout.includes('Android Debug Bridge');
        }
        catch {
            return false;
        }
    }
    /**
     * List connected Android devices
     */
    async getConnectedDevices() {
        try {
            const { stdout } = await execAsync(`${this.adbCmd} devices -l`);
            const lines = stdout.trim().split('\n').slice(1);
            const devices = [];
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    const id = parts[0];
                    const state = parts[1];
                    let model = 'Android Device';
                    let product = 'Unknown';
                    for (const item of parts.slice(2)) {
                        if (item.startsWith('model:'))
                            model = item.replace('model:', '');
                        if (item.startsWith('product:'))
                            product = item.replace('product:', '');
                    }
                    devices.push({ id, state, model, product });
                }
            }
            return devices;
        }
        catch {
            return [];
        }
    }
    /**
     * Run a shell command on the primary or specified Android device
     */
    async shell(command, deviceId) {
        const target = deviceId ? `-s ${deviceId}` : '';
        const { stdout } = await execAsync(`${this.adbCmd} ${target} shell "${command.replace(/"/g, '\\"')}"`);
        return stdout;
    }
    /**
     * Get device battery info via dumpsys
     */
    async getBatteryInfo(deviceId) {
        try {
            const out = await this.shell('dumpsys battery', deviceId);
            const lines = out.split('\n');
            let level = 100;
            let temp = 25;
            let status = 1;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('level:')) {
                    level = parseInt(trimmed.split(':')[1].trim(), 10);
                }
                else if (trimmed.startsWith('temperature:')) {
                    const rawTemp = parseInt(trimmed.split(':')[1].trim(), 10);
                    temp = rawTemp > 100 ? rawTemp / 10 : rawTemp;
                }
                else if (trimmed.startsWith('status:')) {
                    status = parseInt(trimmed.split(':')[1].trim(), 10);
                }
            }
            return {
                level,
                temperature: temp,
                isCharging: status === 2 || status === 5 // 2: charging, 5: full
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Get device thermal throttling status
     */
    async getThermalStatus(deviceId) {
        try {
            const out = await this.shell('dumpsys thermalservice', deviceId);
            if (out.includes('ThermalStatus: 0'))
                return 'nominal';
            if (out.includes('ThermalStatus: 1'))
                return 'fair';
            if (out.includes('ThermalStatus: 2'))
                return 'serious';
            if (out.includes('ThermalStatus: 3') || out.includes('ThermalStatus: 4'))
                return 'critical';
        }
        catch {
            // ignore
        }
        return 'nominal';
    }
    /**
     * Push generated video file to Android's DCIM / Gallery folder
     */
    async pushVideoToGallery(localFilePath, remoteSubDir = 'GoogleEdgeAI', deviceId) {
        const fileName = path.basename(localFilePath);
        const remoteDir = `/sdcard/DCIM/${remoteSubDir}`;
        const remotePath = `${remoteDir}/${fileName}`;
        const target = deviceId ? `-s ${deviceId}` : '';
        try {
            // Ensure target directory exists on device
            await this.shell(`mkdir -p ${remoteDir}`, deviceId);
            // Push file
            await execAsync(`${this.adbCmd} ${target} push "${localFilePath}" "${remotePath}"`);
            // Trigger MediaScanner so it instantly appears in Android Gallery / Google Photos
            await this.scanMedia(remotePath, deviceId);
            return { success: true, remotePath };
        }
        catch (err) {
            console.error(`[AdbBridge] Failed to push video: ${err.message}`);
            return { success: false, remotePath: '' };
        }
    }
    /**
     * Broadcast intent to trigger media scanner on Android
     */
    async scanMedia(remoteFilePath, deviceId) {
        try {
            await this.shell(`am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://${remoteFilePath}"`, deviceId);
        }
        catch {
            // Ignore broadcast failure
        }
    }
    /**
     * Discover Google AI Edge Gallery model assets on device
     */
    async scanEdgeGalleryModels(deviceId) {
        try {
            const candidatePaths = [
                '/sdcard/Android/data/com.google.ai.edge.gallery/files/models',
                '/sdcard/Download/GoogleEdgeAI/models'
            ];
            const found = [];
            for (const p of candidatePaths) {
                try {
                    const out = await this.shell(`ls -1 ${p} 2>/dev/null`, deviceId);
                    const files = out.trim().split('\n').filter(Boolean);
                    for (const f of files) {
                        found.push(`${p}/${f}`);
                    }
                }
                catch {
                    // ignore path
                }
            }
            return found;
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=adb-bridge.js.map