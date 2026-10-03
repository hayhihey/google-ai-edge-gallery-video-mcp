/**
 * Google AI Edge Gallery Video MCP - Tools, Resources & Prompts Registry
 */
import { z } from 'zod';
export declare class ToolDefinitions {
    private deviceManager;
    private gallerySync;
    private videoCompiler;
    constructor();
    static readonly EdgeVideoCreateSchema: z.ZodObject<{
        prompt: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        aspectRatio: z.ZodDefault<z.ZodEnum<["9:16", "16:9", "1:1", "4:3"]>>;
        targetDurationSeconds: z.ZodDefault<z.ZodNumber>;
        style: z.ZodDefault<z.ZodEnum<["cinematic", "social_reel", "documentary", "cyberpunk", "minimalist"]>>;
        addBackgroundScore: z.ZodDefault<z.ZodBoolean>;
        applyMotionFx: z.ZodDefault<z.ZodBoolean>;
        exportToAndroidGallery: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        prompt: string;
        aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
        targetDurationSeconds: number;
        style: "cinematic" | "social_reel" | "documentary" | "cyberpunk" | "minimalist";
        addBackgroundScore: boolean;
        applyMotionFx: boolean;
        exportToAndroidGallery: boolean;
        title?: string | undefined;
    }, {
        prompt: string;
        title?: string | undefined;
        aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | undefined;
        targetDurationSeconds?: number | undefined;
        style?: "cinematic" | "social_reel" | "documentary" | "cyberpunk" | "minimalist" | undefined;
        addBackgroundScore?: boolean | undefined;
        applyMotionFx?: boolean | undefined;
        exportToAndroidGallery?: boolean | undefined;
    }>;
    static readonly EdgeStoryboardPlanSchema: z.ZodObject<{
        prompt: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        aspectRatio: z.ZodDefault<z.ZodEnum<["9:16", "16:9", "1:1", "4:3"]>>;
        targetDurationSeconds: z.ZodDefault<z.ZodNumber>;
        shotsCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        prompt: string;
        aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
        targetDurationSeconds: number;
        shotsCount?: number | undefined;
        title?: string | undefined;
    }, {
        prompt: string;
        shotsCount?: number | undefined;
        title?: string | undefined;
        aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | undefined;
        targetDurationSeconds?: number | undefined;
    }>;
    static readonly EdgeGenerateKeyframesSchema: z.ZodObject<{
        storyboard: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        storyboard?: any;
    }, {
        storyboard?: any;
    }>;
    static readonly EdgeApplyVideoFxSchema: z.ZodObject<{
        motion: z.ZodDefault<z.ZodEnum<["static", "zoom_in", "zoom_out", "pan_left", "pan_right", "tilt_up", "tilt_down"]>>;
        colorGrade: z.ZodDefault<z.ZodEnum<["standard", "cinematic_teal_orange", "cyberpunk_neon", "vintage_warm", "noir_monochrome", "vivid_pop"]>>;
        aspectRatio: z.ZodDefault<z.ZodEnum<["9:16", "16:9", "1:1", "4:3"]>>;
        durationSeconds: z.ZodDefault<z.ZodNumber>;
        fps: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        durationSeconds: number;
        fps: number;
        aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
        motion: "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down";
        colorGrade: "standard" | "cinematic_teal_orange" | "cyberpunk_neon" | "vintage_warm" | "noir_monochrome" | "vivid_pop";
    }, {
        durationSeconds?: number | undefined;
        fps?: number | undefined;
        aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | undefined;
        motion?: "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down" | undefined;
        colorGrade?: "standard" | "cinematic_teal_orange" | "cyberpunk_neon" | "vintage_warm" | "noir_monochrome" | "vivid_pop" | undefined;
    }>;
    static readonly EdgeCompileVideoSchema: z.ZodObject<{
        storyboard: z.ZodAny;
        outputFileName: z.ZodOptional<z.ZodString>;
        addBackgroundScore: z.ZodDefault<z.ZodBoolean>;
        applyMotionFx: z.ZodDefault<z.ZodBoolean>;
        exportToAndroidGallery: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        addBackgroundScore: boolean;
        applyMotionFx: boolean;
        exportToAndroidGallery: boolean;
        storyboard?: any;
        outputFileName?: string | undefined;
    }, {
        storyboard?: any;
        addBackgroundScore?: boolean | undefined;
        applyMotionFx?: boolean | undefined;
        exportToAndroidGallery?: boolean | undefined;
        outputFileName?: string | undefined;
    }>;
    static readonly AndroidGalleryExportSchema: z.ZodObject<{
        videoFilePath: z.ZodString;
        customTitle: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        videoFilePath: string;
        customTitle?: string | undefined;
    }, {
        videoFilePath: string;
        customTitle?: string | undefined;
    }>;
    static readonly EdgeModelsManagerSchema: z.ZodObject<{
        action: z.ZodDefault<z.ZodEnum<["list", "get_recommended", "verify"]>>;
        task: z.ZodOptional<z.ZodEnum<["storyboarding", "captioning", "image_gen", "segmentation"]>>;
    }, "strip", z.ZodTypeAny, {
        action: "list" | "get_recommended" | "verify";
        task?: "storyboarding" | "captioning" | "image_gen" | "segmentation" | undefined;
    }, {
        task?: "storyboarding" | "captioning" | "image_gen" | "segmentation" | undefined;
        action?: "list" | "get_recommended" | "verify" | undefined;
    }>;
    handleEdgeVideoCreate(args: z.infer<typeof ToolDefinitions.EdgeVideoCreateSchema>): Promise<{
        message: string;
        videoPath: string;
        videoFileName: string;
        durationSeconds: number;
        fileSizeMb: number;
        resolution: string;
        androidGalleryUri: string | undefined;
        androidScanStatus: string | undefined;
        shotsCount: number;
        metrics: {
            storyboardTimeMs: number;
            renderingTimeMs: number;
            encodingTimeMs: number;
            totalTimeMs: number;
        };
        deviceMode: import("../core/types.js").DeviceExecutionMode;
    }>;
    handleEdgeStoryboardPlan(args: z.infer<typeof ToolDefinitions.EdgeStoryboardPlanSchema>): {
        storyboard: import("../core/types.js").VideoStoryboard;
        summary: string;
    };
    handleEdgeGenerateKeyframes(args: z.infer<typeof ToolDefinitions.EdgeGenerateKeyframesSchema>): Promise<{
        keyframesCount: number;
        keyframes: import("../core/frame-renderer.js").GeneratedKeyframe[];
    }>;
    handleEdgeApplyVideoFx(args: z.infer<typeof ToolDefinitions.EdgeApplyVideoFxSchema>): {
        motion: "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down";
        colorGrade: "standard" | "cinematic_teal_orange" | "cyberpunk_neon" | "vintage_warm" | "noir_monochrome" | "vivid_pop";
        filterGraph: string;
        notes: string;
    };
    handleEdgeCompileVideo(args: z.infer<typeof ToolDefinitions.EdgeCompileVideoSchema>): Promise<import("../core/types.js").RenderResult>;
    handleAndroidDeviceStatus(): Promise<import("../core/types.js").DeviceTelemetry>;
    handleAndroidGalleryExport(args: z.infer<typeof ToolDefinitions.AndroidGalleryExportSchema>): Promise<import("../android/gallery-sync.js").GallerySyncResult>;
    handleEdgeModelsManager(args: z.infer<typeof ToolDefinitions.EdgeModelsManagerSchema>): {
        recommendedModel: import("../core/types.js").EdgeModelInfo;
        models?: undefined;
        count?: undefined;
    } | {
        models: import("../core/types.js").EdgeModelInfo[];
        count: number;
        recommendedModel?: undefined;
    };
    getTelemetryResource(): Promise<string>;
    getGalleryVideosResource(): string;
    getModelsResource(): string;
}
