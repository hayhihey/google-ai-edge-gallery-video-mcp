#!/usr/bin/env node
/**
 * Google AI Edge Gallery Video MCP Server
 * Model Context Protocol (MCP) server for on-device and edge video creation.
 * Supports Stdio and HTTP/SSE transports.
 */
import http from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ToolDefinitions } from './tools/tool-definitions.js';
import { Config } from './config.js';
export function createServerInstance() {
    const server = new Server({
        name: 'google-ai-edge-gallery-video-mcp',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {},
            resources: {},
            prompts: {}
        }
    });
    const tools = new ToolDefinitions();
    // 1. Tools Listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'edge_video_create',
                    description: 'End-to-end prompt-to-video pipeline powered by Google AI Edge Gallery standards. Plans storyboard scenes, renders keyframes, applies Ken Burns motion and color grading, compiles into MP4, and syncs directly to Android DCIM Gallery / Google Photos.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            prompt: { type: 'string', description: 'The video concept, prompt, or script' },
                            title: { type: 'string', description: 'Optional custom title for the video' },
                            aspectRatio: {
                                type: 'string',
                                enum: ['9:16', '16:9', '1:1', '4:3'],
                                default: '9:16',
                                description: 'Aspect ratio: 9:16 (vertical reel/short), 16:9 (landscape), 1:1 (square)'
                            },
                            targetDurationSeconds: {
                                type: 'number',
                                default: 6,
                                description: 'Total video length in seconds (3 - 8s; longer values are capped to 8s for fast on-device creation)'
                            },
                            style: {
                                type: 'string',
                                enum: ['cinematic', 'social_reel', 'documentary', 'cyberpunk', 'minimalist'],
                                default: 'social_reel',
                                description: 'Aesthetic style and motion dynamics'
                            },
                            addBackgroundScore: {
                                type: 'boolean',
                                default: true,
                                description: 'Synthesize ambient Edge AI background soundtrack'
                            },
                            applyMotionFx: {
                                type: 'boolean',
                                default: true,
                                description: 'Apply dynamic Ken Burns camera motion (pan/zoom)'
                            },
                            exportToAndroidGallery: {
                                type: 'boolean',
                                default: true,
                                description: 'Export and index into Android MediaStore / Google Photos'
                            }
                        },
                        required: ['prompt']
                    }
                },
                {
                    name: 'edge_storyboard_plan',
                    description: 'Plans a director-level screenplay and storyboard breakdown from a raw prompt, specifying scene shots, camera dynamics, transitions, and timing.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            prompt: { type: 'string', description: 'The creative concept or script' },
                            title: { type: 'string', description: 'Optional project title' },
                            aspectRatio: { type: 'string', enum: ['9:16', '16:9', '1:1', '4:3'], default: '9:16' },
                            targetDurationSeconds: { type: 'number', default: 15 },
                            shotsCount: { type: 'number', description: 'Custom shot count (optional)' }
                        },
                        required: ['prompt']
                    }
                },
                {
                    name: 'edge_generate_keyframes',
                    description: 'Generates visual keyframe cards and assets for each shot in a storyboard.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            storyboard: { type: 'object', description: 'Storyboard JSON object from edge_storyboard_plan' }
                        },
                        required: ['storyboard']
                    }
                },
                {
                    name: 'edge_apply_video_fx',
                    description: 'Generates hardware-optimized filtergraphs for Ken Burns camera motion, color balance, and cinematic vignette.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            motion: {
                                type: 'string',
                                enum: ['static', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down'],
                                default: 'zoom_in'
                            },
                            colorGrade: {
                                type: 'string',
                                enum: ['standard', 'cinematic_teal_orange', 'cyberpunk_neon', 'vintage_warm', 'noir_monochrome', 'vivid_pop'],
                                default: 'cinematic_teal_orange'
                            },
                            aspectRatio: { type: 'string', enum: ['9:16', '16:9', '1:1', '4:3'], default: '9:16' },
                            durationSeconds: { type: 'number', default: 4 },
                            fps: { type: 'number', default: 30 }
                        }
                    }
                },
                {
                    name: 'edge_compile_video',
                    description: 'Compiles an existing storyboard, keyframes, transitions, and audio into final MP4 video file.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            storyboard: { type: 'object', description: 'Storyboard object' },
                            outputFileName: { type: 'string', description: 'Custom output file name (.mp4)' },
                            addBackgroundScore: { type: 'boolean', default: true },
                            applyMotionFx: { type: 'boolean', default: true },
                            exportToAndroidGallery: { type: 'boolean', default: true }
                        },
                        required: ['storyboard']
                    }
                },
                {
                    name: 'android_device_status',
                    description: 'Checks Android device battery percentage, thermal throttling status, available storage, and acceleration mode (Termux, ADB bridge, or Host).',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'android_gallery_export',
                    description: 'Exports any video file to Android DCIM folder and triggers Android MediaStore scanner so it instantly shows up in Google Photos / Gallery.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            videoFilePath: { type: 'string', description: 'Path to video file' },
                            customTitle: { type: 'string', description: 'Display title' }
                        },
                        required: ['videoFilePath']
                    }
                },
                {
                    name: 'edge_models_manager',
                    description: 'Inspects and manages Google AI Edge Gallery models (Gemma 2, Gemma 3n, MobileDiffusion, MediaPipe tasks).',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: { type: 'string', enum: ['list', 'get_recommended', 'verify'], default: 'list' },
                            task: { type: 'string', enum: ['storyboarding', 'captioning', 'image_gen', 'segmentation'] }
                        }
                    }
                }
            ]
        };
    });
    // 2. Tools Execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: rawArgs } = request.params;
        const args = rawArgs || {};
        try {
            switch (name) {
                case 'edge_video_create': {
                    const parsed = ToolDefinitions.EdgeVideoCreateSchema.parse(args);
                    const res = await tools.handleEdgeVideoCreate(parsed);
                    // Compact plain-text result: small on-device models and the Gallery app handle this
                    // far more reliably than a large nested JSON blob.
                    const summary = `Video created successfully: ${res.videoFileName} ` +
                        `(${res.durationSeconds}s, ${res.resolution}, ${res.fileSizeMb} MB, ${res.shotsCount} shots). ` +
                        `Saved at: ${res.videoPath}`;
                    return { content: [{ type: 'text', text: summary }], isError: false };
                }
                case 'edge_storyboard_plan': {
                    const parsed = ToolDefinitions.EdgeStoryboardPlanSchema.parse(args);
                    const res = tools.handleEdgeStoryboardPlan(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'edge_generate_keyframes': {
                    const parsed = ToolDefinitions.EdgeGenerateKeyframesSchema.parse(args);
                    const res = await tools.handleEdgeGenerateKeyframes(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'edge_apply_video_fx': {
                    const parsed = ToolDefinitions.EdgeApplyVideoFxSchema.parse(args);
                    const res = tools.handleEdgeApplyVideoFx(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'edge_compile_video': {
                    const parsed = ToolDefinitions.EdgeCompileVideoSchema.parse(args);
                    const res = await tools.handleEdgeCompileVideo(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'android_device_status': {
                    const res = await tools.handleAndroidDeviceStatus();
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'android_gallery_export': {
                    const parsed = ToolDefinitions.AndroidGalleryExportSchema.parse(args);
                    const res = await tools.handleAndroidGalleryExport(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                case 'edge_models_manager': {
                    const parsed = ToolDefinitions.EdgeModelsManagerSchema.parse(args);
                    const res = tools.handleEdgeModelsManager(parsed);
                    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
                }
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found.`);
            }
        }
        catch (err) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error executing ${name}: ${err.message || String(err)}`
                    }
                ],
                isError: true
            };
        }
    });
    // 3. Resources Listing
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: 'edge://device/telemetry',
                    name: 'Device Telemetry & Acceleration',
                    mimeType: 'application/json',
                    description: 'Real-time battery, thermal, and acceleration stats for Android / Edge runtime.'
                },
                {
                    uri: 'edge://gallery/videos',
                    name: 'Created Edge Videos Catalog',
                    mimeType: 'application/json',
                    description: 'List of videos stored in Android DCIM or local Edge output folder.'
                },
                {
                    uri: 'edge://models/inventory',
                    name: 'Edge AI Models Inventory',
                    mimeType: 'application/json',
                    description: 'Catalog of models compatible with Google AI Edge Gallery.'
                }
            ]
        };
    });
    // 4. Resource Read
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        if (uri === 'edge://device/telemetry') {
            const text = await tools.getTelemetryResource();
            return { contents: [{ uri, mimeType: 'application/json', text }] };
        }
        if (uri === 'edge://gallery/videos') {
            const text = tools.getGalleryVideosResource();
            return { contents: [{ uri, mimeType: 'application/json', text }] };
        }
        if (uri === 'edge://models/inventory') {
            const text = tools.getModelsResource();
            return { contents: [{ uri, mimeType: 'application/json', text }] };
        }
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
    });
    // 5. Prompts Listing
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return {
            prompts: [
                {
                    name: 'ai_video_director',
                    description: 'Guides the AI to act as an edge cinematic director, crafting multi-shot video plans for on-device generation.',
                    arguments: [
                        { name: 'topic', description: 'The video topic or story premise', required: true },
                        { name: 'targetDuration', description: 'Target duration in seconds (e.g. 15)', required: false }
                    ]
                },
                {
                    name: 'social_shorts_creator',
                    description: 'Creates a viral 9:16 vertical short optimized for mobile attention spans, hooks, dynamic captions, and Google AI Edge aesthetics.',
                    arguments: [
                        { name: 'hook', description: 'The attention-grabbing opening hook', required: true },
                        { name: 'keyTakeaway', description: 'The core message or reveal', required: true }
                    ]
                }
            ]
        };
    });
    // 6. Prompts Get
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        if (name === 'ai_video_director') {
            const topic = args?.topic || 'Futuristic Mobile AI';
            const dur = args?.targetDuration || '15';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are an expert AI Video Director utilizing Google AI Edge Gallery. ` +
                                `Design a cinematic video about '${topic}' that lasts approximately ${dur} seconds. ` +
                                `Break it down into distinct scenes with camera motion (zoom_in, pan_right, tilt_up), ` +
                                `visual prompts, transitions, and compelling lower-third captions.`
                        }
                    }
                ]
            };
        }
        if (name === 'social_shorts_creator') {
            const hook = args?.hook || 'Did you know your phone can generate full videos offline?';
            const reveal = args?.keyTakeaway || 'Google AI Edge Gallery runs directly on device NPU.';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are creating a fast-paced vertical (9:16) social short. ` +
                                `Hook: "${hook}" ` +
                                `Key Takeaway: "${reveal}" ` +
                                `Structure a 3-shot sequence (Hook -> Explanation -> Climax) with punchy on-screen captions.`
                        }
                    }
                ]
            };
        }
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt name: ${name}`);
    });
    server.onerror = (error) => {
        console.error('[MCP Error]', error);
    };
    return { server, tools };
}
// --- Transport Runner (Stdio vs SSE HTTP) ---
async function run() {
    Config.initDirectories();
    const args = process.argv.slice(2);
    const isSseMode = args.includes('--sse') || args.includes('-s') || Boolean(process.env.PORT) || process.env.MCP_TRANSPORT === 'sse';
    if (!isSseMode) {
        // Standard Stdio Transport (Claude Desktop / Cursor)
        const { server } = createServerInstance();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Google AI Edge Gallery Video MCP Server running on stdio transport.');
        return;
    }
    // HTTP + SSE Server (Google AI Edge Gallery Mobile App & Remote Web Clients)
    const port = parseInt(process.env.PORT || '3000', 10);
    const activeTransports = new Map();
    const httpServer = http.createServer(async (req, res) => {
        // Permissive CORS for mobile apps and web views
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
        if (req.method === 'OPTIONS') {
            res.writeHead(204).end();
            return;
        }
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        // 1. Root Health Check & Info
        if (pathname === '/' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'online',
                name: 'google-ai-edge-gallery-video-mcp',
                version: '1.0.0',
                sseEndpoint: '/sse',
                messagesEndpoint: '/messages',
                instructions: 'Use the /sse endpoint in Google AI Edge Gallery app'
            }, null, 2));
            return;
        }
        // 2. SSE Connection Endpoint (Clients connect here)
        if (pathname === '/sse' && req.method === 'GET') {
            const { server } = createServerInstance();
            const transport = new SSEServerTransport('/messages', res);
            const sessionId = transport.sessionId;
            activeTransports.set(sessionId, transport);
            transport.onclose = () => {
                activeTransports.delete(sessionId);
                console.log(`[SSE] Session disconnected: ${sessionId}`);
            };
            console.log(`[SSE] New client connected. Session ID: ${sessionId}`);
            await server.connect(transport);
            return;
        }
        // 3. Message Post Endpoint (Clients send JSON-RPC commands here)
        if (pathname === '/messages' && req.method === 'POST') {
            const sessionId = parsedUrl.searchParams.get('sessionId');
            if (!sessionId || !activeTransports.has(sessionId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing or invalid sessionId' }));
                return;
            }
            const transport = activeTransports.get(sessionId);
            await transport.handlePostMessage(req, res);
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    });
    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`================================================================`);
        console.log(`🚀 Google AI Edge Gallery Video MCP running via HTTP/SSE`);
        console.log(`📡 Local URL:   http://localhost:${port}/sse`);
        console.log(`📱 Android URL: http://0.0.0.0:${port}/sse`);
        console.log(`================================================================`);
    });
}
run().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map