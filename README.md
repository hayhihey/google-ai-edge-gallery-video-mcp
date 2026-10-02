# Google AI Edge Gallery Video MCP Server 🎬📱

[![CI](https://github.com/google-ai-edge/google-ai-edge-gallery-video-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/google-ai-edge/google-ai-edge-gallery-video-mcp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Linux%20%7C%20macOS%20%7C%20Windows-green.svg)](#supported-platforms)
[![MCP](https://img.shields.io/badge/MCP-Protocol%20v1.6-purple.svg)](https://modelcontextprotocol.io)

A high-performance **Model Context Protocol (MCP)** server enabling AI agents (Claude Desktop, Cursor, Antigravity, LLM frontends) to direct, generate, and compile on-device videos using the **Google AI Edge Gallery** ecosystem (`google-ai-edge/gallery`).

Built from the ground up to **run natively on Android devices (via Termux)**, through an **ADB Bridge (USB or Wi-Fi)**, or as a **Standalone Desktop Engine**, with automatic synchronization to Android's **DCIM / Google Photos Gallery** and hardware-aware battery & thermal throttling protection.

---

## 🌟 Key Highlights

- **On-Device Edge Video Generation**: Turn raw prompts and narrative ideas into complete, multi-scene video stories with cinematic keyframes, camera motions, color grades, and audio score.
- **Native Android & Termux Support**: Zero native C++ compilation hassles. One-line installer on Termux with automatic storage permissions and Android MediaStore scanning.
- **ADB Host-to-Device Bridge**: Run the MCP server on your PC/Mac while seamlessly streaming and indexing generated videos directly onto a connected Android smartphone.
- **Hardware-Aware Telemetry**: Monitors Android battery charge, device temperature, and thermal throttling states to automatically adapt video resolution (720p vs 1080p) and frame rates.
- **Google AI Edge Gallery Integration**: Built to interface with models supported by Google AI Edge Gallery (Gemma 2, Gemma 3n, MobileDiffusion, MediaPipe tasks).
- **Instant MediaStore Registration**: Broadcasts `ACTION_MEDIA_SCANNER_SCAN_FILE` intents so exported videos immediately appear in the phone's native Gallery and Google Photos.

---

## 🏗️ Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │              MCP Client                      │
                        │   (Claude Desktop / Cursor / Antigravity)   │
                        └──────────────────────┬───────────────────────┘
                                               │ JSON-RPC (stdio / SSE)
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Google AI Edge Gallery Video MCP Server                         │
├──────────────────────────────────────┬─────────────────────────────────────────────────┤
│           Core Engine                │              Android Subsystem                  │
│ ┌──────────────────────────────────┐ │ ┌──────────────────┐  ┌───────────────────────┐ │
│ │ Storyboard Director              │ │ │ Native Termux    │  │ ADB Bridge            │ │
│ │ (Gemma Scene Planning & Timing)  │ │ │ (On-Device Host) │  │ (Remote Device Push)  │ │
│ └────────────────┬─────────────────┘ │ └────────┬─────────┘  └───────────┬───────────┘ │
│                  ▼                   │          │                        │             │
│ ┌──────────────────────────────────┐ │          ▼                        ▼             │
│ │ Keyframe Generator & Styler      │ │ ┌─────────────────────────────────────────────┐ │
│ │ (Diffusion / Edge SVG Engine)    │ │ │ Unified Device Manager                      │ │
│ └────────────────┬─────────────────┘ │ │ - Battery Level & Temp Monitoring           │ │
│                  ▼                   │ │ - Thermal Throttling Mitigation             │ │
│ ┌──────────────────────────────────┐ │ └──────────────────────┬──────────────────────┘ │
│ │ MediaPipe FX & Filter Pipeline   │ │                        │                        │
│ │ (Ken Burns Pan/Zoom, Grade LUTs) │ │                        ▼                        │
│ └────────────────┬─────────────────┘ │ ┌─────────────────────────────────────────────┐ │
│                  ▼                   │ │ Gallery Sync Manager                        │ │
│ ┌──────────────────────────────────┐ │ │ - Destination: /sdcard/DCIM/GoogleEdgeAI    │ │
│ │ Hardware-Aware Video Compiler    │─┼─► │ - MediaStore Intent Broadcast             │ │
│ │ (FFmpeg H.264 + Ambient Audio)   │ │ │ - Google Photos / Gallery Auto-Indexing     │ │
│ └──────────────────────────────────┘ │ └─────────────────────────────────────────────┘ │
└──────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Option 1: Native on Android (Termux)

Run this one-line command inside [Termux](https://f-droid.org/en/packages/com.termux/):

```bash
pkg install -y curl && curl -sSL https://raw.githubusercontent.com/google-ai-edge/google-ai-edge-gallery-video-mcp/main/scripts/termux-install.sh | bash
```

Once installed, simply start the server:
```bash
edge-video-mcp
```
All created videos will automatically appear in your phone's Gallery under **GoogleEdgeAI** (`/sdcard/DCIM/GoogleEdgeAI`)!

---

### Option 2: Host PC with Android Phone Connected (ADB Bridge)

1. Enable **Developer Options** and **USB Debugging** (or Wireless Debugging) on your Android phone.
2. Connect your phone to your computer via USB or Wi-Fi (`adb connect <phone_ip>:5555`).
3. Clone and build the project:
   ```bash
   git clone https://github.com/google-ai-edge/google-ai-edge-gallery-video-mcp.git
   cd google-ai-edge-gallery-video-mcp
   npm install
   npm run build
   ```
4. Verify Android device connectivity:
   ```bash
   bash scripts/adb-setup.sh
   ```

---

### Option 3: Desktop Standalone (No phone required)

The server automatically detects when no Android device is attached and runs the edge simulation pipeline locally on Windows, macOS, or Linux.

Prerequisite: Ensure `ffmpeg` is installed:
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install -y ffmpeg`
- **Windows**: `winget install Gyan.FFmpeg` or `choco install ffmpeg`

```bash
git clone https://github.com/google-ai-edge/google-ai-edge-gallery-video-mcp.git
cd google-ai-edge-gallery-video-mcp
npm install
npm run build
npm start
```

---

## 🔌 Connecting to MCP Clients

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-ai-edge-video": {
      "command": "node",
      "args": [
        "/path/to/google-ai-edge-gallery-video-mcp/dist/index.js"
      ],
      "env": {
        "EDGE_MCP_OUTPUT_DIR": "/path/to/custom/output"
      }
    }
  }
}
```

*On Windows, use escaped backslashes: `C:\\Users\\<Username>\\...\\dist\\index.js`*

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `edge_video_create` | `prompt`, `title?`, `aspectRatio` (9:16, 16:9, 1:1), `targetDurationSeconds`, `style`, `addBackgroundScore`, `applyMotionFx`, `exportToAndroidGallery` | **Full end-to-end video synthesis pipeline**. Directs scenes, synthesizes keyframes, applies camera motions & color grading, encodes MP4, and indexes in Android Gallery. |
| `edge_storyboard_plan` | `prompt`, `title?`, `aspectRatio`, `targetDurationSeconds`, `shotsCount?` | Directs multi-shot scene breakdowns, camera motions (`zoom_in`, `pan_right`, `tilt_up`), transitions, and captions. |
| `edge_generate_keyframes` | `storyboard` | Generates high-fidelity keyframe image assets for each scene. |
| `edge_apply_video_fx` | `motion`, `colorGrade`, `aspectRatio`, `durationSeconds`, `fps` | Generates hardware-optimized filtergraphs for Ken Burns motions, vignette, and cinematic color palettes. |
| `edge_compile_video` | `storyboard`, `outputFileName?`, `addBackgroundScore`, `applyMotionFx`, `exportToAndroidGallery` | Low-level assembler for stitching shot clips, transitions, and audio beds into an H.264 MP4. |
| `android_device_status` | *(None)* | Inspects real-time battery charge, temperature, thermal throttling state, and acceleration delegates. |
| `android_gallery_export` | `videoFilePath`, `customTitle?` | Moves any video into `/sdcard/DCIM/GoogleEdgeAI` and broadcasts Android's `MEDIA_SCANNER_SCAN_FILE` intent. |
| `edge_models_manager` | `action` (`list`, `get_recommended`), `task?` | Catalogs models compatible with Google AI Edge Gallery (Gemma 2, Gemma 3n, MobileDiffusion, MediaPipe). |

---

## 📦 MCP Resources & Prompts

### Resources
- `edge://device/telemetry`: Real-time hardware telemetry (battery, temperature, storage, encoder support).
- `edge://gallery/videos`: Catalog of generated video files with sizes and timestamps.
- `edge://models/inventory`: List of edge models available on device.

### Prompts
- `ai_video_director`: Creative director persona to brainstorm screenplays tailored to edge constraints.
- `social_shorts_creator`: High-engagement 9:16 vertical short template designed for TikTok, Reels, and Shorts.

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:

```bash
npm test
```

Test coverage includes:
- Storyboard director planning across aspect ratios (9:16, 16:9, 1:1).
- Mobile-constrained thermal throttling logic.
- Procedural SVG keyframe rendering and XML escaping.
- Ken Burns motion expressions and color grading filtergraphs.
- Unified device detection (Termux / ADB / Local).

---

## 🐳 Docker Deployment

A lightweight multi-stage Docker image with built-in FFmpeg and Android tools:

```bash
# Build and run with docker compose
docker compose up -d

# Or run directly with docker
docker build -t edge-video-mcp .
docker run --rm -v $(pwd)/output:/app/output edge-video-mcp
```

---

## 🚢 Deploying to GitHub

To publish this repository to your GitHub account:

```bash
# 1. Initialize git repository
git init -b main

# 2. Add files and make initial commit
git add .
git commit -m "feat: initial release of Google AI Edge Gallery Video MCP Server"

# 3. Create a new repository on GitHub (e.g. google-ai-edge-gallery-video-mcp)
# 4. Link remote and push:
git remote add origin https://github.com/<your-username>/google-ai-edge-gallery-video-mcp.git
git push -u origin main
```

The pre-configured **GitHub Actions CI/CD workflows** (`.github/workflows/ci.yml` and `release.yml`) will automatically:
- Run automated tests across Ubuntu and Windows on Node.js 18, 20, and 22.
- Package releases upon pushing tags (e.g. `git tag v1.0.0 && git push origin v1.0.0`).

---

## 📄 License

Licensed under the [Apache License, Version 2.0](LICENSE).
