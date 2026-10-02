/**
 * Google AI Edge Gallery Video MCP - Core Types & Interfaces
 */

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export type VideoResolution = {
  width: number;
  height: number;
};

export type TransitionType = 
  | 'fade' 
  | 'wipeleft' 
  | 'wiperight' 
  | 'slideup' 
  | 'slidedown' 
  | 'circleopen' 
  | 'smoothleft' 
  | 'dissolve'
  | 'none';

export type CameraMotion = 
  | 'static' 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'pan_left' 
  | 'pan_right' 
  | 'tilt_up' 
  | 'tilt_down';

export type ColorGradePreset = 
  | 'standard' 
  | 'cinematic_teal_orange' 
  | 'cyberpunk_neon' 
  | 'vintage_warm' 
  | 'noir_monochrome' 
  | 'vivid_pop';

export interface SceneShot {
  id: string;
  order: number;
  durationSeconds: number;
  title: string;
  visualPrompt: string;
  narrativeText?: string;
  captionText?: string;
  cameraMotion: CameraMotion;
  transitionToNext: TransitionType;
  transitionDurationSeconds?: number;
  colorGrade: ColorGradePreset;
  soundCue?: string;
  imageUri?: string; // Path or base64 of keyframe
}

export interface VideoStoryboard {
  id: string;
  title: string;
  description: string;
  aspectRatio: AspectRatio;
  targetDurationSeconds: number;
  fps: number;
  resolution: VideoResolution;
  shots: SceneShot[];
  backgroundAudioPrompt?: string;
  targetPlatform: 'android-gallery' | 'youtube-shorts' | 'tiktok' | 'landscape-hd';
  createdAt: string;
}

export interface RenderOptions {
  storyboard: VideoStoryboard;
  outputFileName?: string;
  generateKeyframes?: boolean;
  applyMotionFx?: boolean;
  burnCaptions?: boolean;
  addBackgroundScore?: boolean;
  exportToAndroidGallery?: boolean;
  hardwareAcceleration?: 'auto' | 'mediacodec' | 'vaapi' | 'nvenc' | 'software';
}

export interface RenderResult {
  success: boolean;
  videoPath: string;
  videoFileName: string;
  durationSeconds: number;
  fileSizeBytes: number;
  resolution: VideoResolution;
  fps: number;
  androidGalleryUri?: string;
  androidScanStatus?: string;
  shotsCount: number;
  metrics: {
    storyboardTimeMs: number;
    renderingTimeMs: number;
    encodingTimeMs: number;
    totalTimeMs: number;
  };
}

export type DeviceExecutionMode = 'android-termux' | 'android-adb' | 'host-local';

export interface DeviceTelemetry {
  mode: DeviceExecutionMode;
  deviceName: string;
  androidVersion?: string;
  batteryLevel?: number; // 0-100
  isCharging?: boolean;
  batteryTemperatureC?: number;
  thermalStatus?: 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';
  availableStorageMb?: number;
  hasHardwareEncoder: boolean;
  recommendedResolution: VideoResolution;
  edgeAiGalleryDetected: boolean;
  activeModelName?: string;
}

export interface EdgeModelInfo {
  id: string;
  name: string;
  category: 'llm' | 'diffusion' | 'vision-language' | 'mediapipe-task';
  format: 'litert' | 'tflite' | 'task' | 'onnx';
  sizeBytes: number;
  quantization: string;
  localPath?: string;
  isAvailable: boolean;
  recommendedFor: ('storyboarding' | 'captioning' | 'image_gen' | 'segmentation')[];
}
