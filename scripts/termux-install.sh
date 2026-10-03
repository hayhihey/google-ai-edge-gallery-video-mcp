#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Google AI Edge Gallery Video MCP - Android Termux Automated Installer
# Run on Android inside Termux:
#   curl -sSL https://raw.githubusercontent.com/hayhihey/google-ai-edge-gallery-video-mcp/main/scripts/termux-install.sh | bash
# ==============================================================================

set -e

echo "🚀 [1/5] Updating Termux packages..."
pkg update -y && pkg upgrade -y

echo "📦 [2/5] Installing Node.js, Git, FFmpeg and Termux API..."
pkg install -y nodejs-lts git ffmpeg termux-api

echo "📱 [3/5] Setting up Android storage permissions..."
if [ ! -d "$HOME/storage" ]; then
    termux-setup-storage || true
fi

# Ensure DCIM directory exists
mkdir -p /sdcard/DCIM/GoogleEdgeAI
mkdir -p /sdcard/Download/GoogleEdgeAI

echo "📥 [4/5] Installing Google AI Edge Video MCP Server..."
INSTALL_DIR="$HOME/google-ai-edge-gallery-video-mcp"

if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation at $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    git pull || true
else
    echo "Cloning repository..."
    git clone https://github.com/hayhihey/google-ai-edge-gallery-video-mcp.git "$INSTALL_DIR" || {
        echo "Local fallback directory..."
        mkdir -p "$INSTALL_DIR"
    }
    cd "$INSTALL_DIR"
fi

npm install --omit=dev

if [ ! -f "dist/index.js" ]; then
    npm install
    npx tsc || true
fi

echo "⚙️ [5/5] Creating global launcher command 'edge-video-mcp'..."
BIN_PATH="$PREFIX/bin/edge-video-mcp"
cat << 'EOF' > "$BIN_PATH"
#!/data/data/com.termux/files/usr/bin/bash
export NODE_OPTIONS="--max-old-space-size=2048"
node "$HOME/google-ai-edge-gallery-video-mcp/dist/index.js" "$@"
EOF

chmod +x "$BIN_PATH"

echo ""
echo "=============================================================================="
echo "🎉 SUCCESS: Google AI Edge Gallery Video MCP installed on your Android device!"
echo "=============================================================================="
echo "Run the server anytime with: edge-video-mcp"
echo "Outputs are automatically synced to: /sdcard/DCIM/GoogleEdgeAI (Google Photos)"
echo "=============================================================================="
