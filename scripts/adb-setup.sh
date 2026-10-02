#!/usr/bin/env bash
# ==============================================================================
# Google AI Edge Gallery Video MCP - ADB Bridge Setup
# Configures Android device for remote MCP video generation over ADB
# ==============================================================================

set -e

echo "🔍 Checking ADB connection..."
if ! command -v adb &> /dev/null; then
    echo "❌ Error: ADB is not installed or not in PATH."
    echo "Please install Android Platform Tools: https://developer.android.com/tools/releases/platform-tools"
    exit 1
fi

DEVICES=$(adb devices | grep -w "device" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo "⚠️ No authorized Android device detected over USB/Wi-Fi."
    echo "Please make sure:"
    echo "  1. Developer Options are enabled on your Android phone."
    echo "  2. USB Debugging (or Wireless Debugging) is turned ON."
    echo "  3. You accepted the 'Allow USB debugging?' RSA prompt on the phone screen."
    exit 1
fi

echo "📱 Connected Android Devices:"
echo "$DEVICES"

for DEV in $DEVICES; do
    echo "Setting up device: $DEV"
    adb -s "$DEV" shell mkdir -p /sdcard/DCIM/GoogleEdgeAI
    adb -s "$DEV" shell mkdir -p /sdcard/Download/GoogleEdgeAI
    MODEL=$(adb -s "$DEV" shell getprop ro.product.model | tr -d '\r')
    echo "✅ Successfully configured $MODEL ($DEV)"
done

echo ""
echo "🚀 ADB Bridge is ready! The MCP server will now automatically route video output to your Android Gallery."
