export type Progress = { stage: string; percent?: number; loaded?: number; total?: number; backend?: string };
export type Report = (progress: Progress) => void;
export type CropData = { x: number; y: number; width: number; height: number; rotate: number; scaleX: number; scaleY: number };
export type Watermark = { text: string; fontSize: number; textColor: string; textOpacity: number; textX: number; textY: number; textRotation: number; textAlign: 'left' | 'center' | 'right' };
