/**
 * Google AI Edge Gallery Video MCP - Native Termux Adapter
 * Interacts directly with on-device Android APIs when running inside Termux.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
const execAsync = promisify(exec);
export class TermuxAdapter {
    static isAvailable() {
        return Boolean(process.env.TERMUX_VERSION ||
            fs.existsSync('/data/data/com.termux'));
    }
    /**
     * Get battery statistics via termux-battery-status
     */
    static async getBatteryStatus() {
        if (!this.isAvailable())
            return null;
        try {
            const { stdout } = await execAsync('termux-battery-status');
            return JSON.parse(stdout.trim());
        }
        catch {
            // Fallback: read directly from Linux sysfs on Android if termux-api package is not installed
            try {
                if (fs.existsSync('/sys/class/power_supply/battery/capacity')) {
                    const cap = parseInt(fs.readFileSync('/sys/class/power_supply/battery/capacity', 'utf8').trim(), 10);
                    let temp = 25;
                    if (fs.existsSync('/sys/class/power_supply/battery/temp')) {
                        const rawTemp = parseInt(fs.readFileSync('/sys/class/power_supply/battery/temp', 'utf8').trim(), 10);
                        temp = rawTemp > 100 ? rawTemp / 10 : rawTemp;
                    }
                    return {
                        health: 'GOOD',
                        percentage: cap,
                        plugged: 'UNKNOWN',
                        status: 'DISCHARGING',
                        temperature: temp,
                        current: 0
                    };
                }
            }
            catch {
                // ignore sysfs read failure
            }
            return null;
        }
    }
    /**
     * Notify Android MediaStore to index new video file so it appears instantly in Google Photos & Gallery
     */
    static async scanMediaFile(filePath) {
        if (!this.isAvailable())
            return false;
        try {
            await execAsync(`termux-media-scan "${filePath}"`);
            return true;
        }
        catch {
            // Fallback: send Android broadcast intent via am
            try {
                await execAsync(`am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://${filePath}"`);
                return true;
            }
            catch {
                return false;
            }
        }
    }
    /**
     * Display on-device Android notification when video rendering completes
     */
    static async showNotification(title, content) {
        if (!this.isAvailable())
            return;
        try {
            await execAsync(`termux-notification --title "${title.replace(/"/g, '\\"')}" --content "${content.replace(/"/g, '\\"')}" --priority high`);
        }
        catch {
            // notification is non-critical
        }
    }
    /**
     * Check available storage space on /sdcard in Megabytes
     */
    static async getStorageMb() {
        try {
            const { stdout } = await execAsync('df -m /sdcard');
            const lines = stdout.trim().split('\n');
            if (lines.length >= 2) {
                const parts = lines[1].split(/\s+/);
                if (parts.length >= 4) {
                    return parseInt(parts[3], 10);
                }
            }
        }
        catch {
            // fallback
        }
        return 10240; // Default estimate 10GB
    }
    /**
     * Check if Google AI Edge Gallery app directory or models are present
     */
    static getEdgeGalleryLocalPaths() {
        const candidatePaths = [
            '/sdcard/Android/data/com.google.ai.edge.gallery/files/models',
            '/data/data/com.google.ai.edge.gallery/files/models',
            '/sdcard/Download/GoogleEdgeAI/models',
            '/sdcard/Documents/GoogleEdgeAI/models'
        ];
        return candidatePaths.filter(p => {
            try {
                return fs.existsSync(p);
            }
            catch {
                return false;
            }
        });
    }
}
//# sourceMappingURL=termux-adapter.js.map