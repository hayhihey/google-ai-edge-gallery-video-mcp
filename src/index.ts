#!/usr/bin/env node
/**
 * Google AI Edge Gallery Video MCP Server
 * Model Context Protocol (MCP) server for on-device and edge video creation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { ToolDefinitions } from './tools/tool-definitions.js';
import { Config } from './config.js';

class EdgeVideoMcpServer {
  private server: Server;
  private tools: ToolDefinitions;

  constructor() {
    this.server = new Server(
      {
        name: 'google-ai-edge-gallery-video-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    this.tools = new ToolDefinitions();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // 1. Tools Listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                  default: 12, 
                  description: 'Total video length in seconds (3 - 120s)' 
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
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: rawArgs } = request.params;
      const args = rawArgs || {};

      try {
        switch (name) {
          case 'edge_video_create': {
            const parsed = ToolDefinitions.EdgeVideoCreateSchema.parse(args);
            const res = await this.tools.handleEdgeVideoCreate(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'edge_storyboard_plan': {
            const parsed = ToolDefinitions.EdgeStoryboardPlanSchema.parse(args);
            const res = this.tools.handleEdgeStoryboardPlan(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'edge_generate_keyframes': {
            const parsed = ToolDefinitions.EdgeGenerateKeyframesSchema.parse(args);
            const res = await this.tools.handleEdgeGenerateKeyframes(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'edge_apply_video_fx': {
            const parsed = ToolDefinitions.EdgeApplyVideoFxSchema.parse(args);
            const res = this.tools.handleEdgeApplyVideoFx(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'edge_compile_video': {
            const parsed = ToolDefinitions.EdgeCompileVideoSchema.parse(args);
            const res = await this.tools.handleEdgeCompileVideo(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'android_device_status': {
            const res = await this.tools.handleAndroidDeviceStatus();
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'android_gallery_export': {
            const parsed = ToolDefinitions.AndroidGalleryExportSchema.parse(args);
            const res = await this.tools.handleAndroidGalleryExport(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          case 'edge_models_manager': {
            const parsed = ToolDefinitions.EdgeModelsManagerSchema.parse(args);
            const res = this.tools.handleEdgeModelsManager(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found.`);
        }
      } catch (err: any) {
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
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
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
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'edge://device/telemetry') {
        const text = await this.tools.getTelemetryResource();
        return { contents: [{ uri, mimeType: 'application/json', text }] };
      }

      if (uri === 'edge://gallery/videos') {
        const text = this.tools.getGalleryVideosResource();
        return { contents: [{ uri, mimeType: 'application/json', text }] };
      }

      if (uri === 'edge://models/inventory') {
        const text = this.tools.getModelsResource();
        return { contents: [{ uri, mimeType: 'application/json', text }] };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
    });

    // 5. Prompts Listing
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
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
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
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
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    Config.initDirectories();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google AI Edge Gallery Video MCP Server running on stdio transport.');
  }
}

const server = new EdgeVideoMcpServer();
server.start().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
