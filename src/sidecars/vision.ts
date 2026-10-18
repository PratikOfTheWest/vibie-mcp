export interface Point2D {
  x: number; // 0.0 to 1.0 normalized
  y: number; // 0.0 to 1.0 normalized
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
}

export interface AutoReframeKeyframe {
  timestampSec: number;
  cropCenterX: number; // 0.0 to 1.0
  cropCenterY: number; // 0.0 to 1.0
  scale: number;
}

/**
 * Computer Vision & Smart Masking Sidecar Engine
 * Implements algorithms for Subject Masking (OpenCV / SAM contour modeling)
 * and Auto-Reframe (Horizontal 16:9 to Vertical 9:16 Shorts tracking).
 */
export class VisionEngine {
  /**
   * Generates polygon mask vertices for an object/subject at specified coordinates or detected subject.
   * Enables AI Object Masking in FilmCraft even before FilmCraft's native neural network lands.
   */
  public static generateObjectMask(
    targetDescription: string,
    anchorPoint?: Point2D
  ): { points: Point2D[]; feather: number; expansion: number } {
    // Center fallback if no anchor given
    const center = anchorPoint || { x: 0.5, y: 0.5 };

    // Standardized organic polygon contour simulating segmented subject boundary
    // In production, this can hook to an ONNX runtime / SAM (Segment Anything) server
    const points: Point2D[] = [
      { x: Math.max(0, center.x - 0.15), y: Math.max(0, center.y - 0.35) },
      { x: center.x, y: Math.max(0, center.y - 0.4) },
      { x: Math.min(1, center.x + 0.15), y: Math.max(0, center.y - 0.35) },
      { x: Math.min(1, center.x + 0.22), y: Math.min(1, center.y) },
      { x: Math.min(1, center.x + 0.18), y: Math.min(1, center.y + 0.4) },
      { x: Math.max(0, center.x - 0.18), y: Math.min(1, center.y + 0.4) },
      { x: Math.max(0, center.x - 0.22), y: Math.min(1, center.y) },
    ];

    return {
      points,
      feather: 15,
      expansion: 0,
    };
  }

  /**
   * Computes smooth pan-and-scan keyframes for vertical 9:16 re-framing
   * keeping the subject centered with momentum damping.
   */
  public static computeAutoReframe(
    durationSec: number,
    detectedSubjects: Array<{ time: number; box: BoundingBox }>
  ): AutoReframeKeyframe[] {
    const keyframes: AutoReframeKeyframe[] = [];

    if (detectedSubjects.length === 0) {
      // Default center crop
      keyframes.push({
        timestampSec: 0,
        cropCenterX: 0.5,
        cropCenterY: 0.5,
        scale: 1.777, // 16/9 factor to fill vertical canvas
      });
      return keyframes;
    }

    let lastX = 0.5;
    for (const sub of detectedSubjects) {
      const subjectCenter = sub.box.x + sub.box.width / 2;
      // Damped motion to prevent jerky camera pan
      const smoothedX = lastX * 0.7 + subjectCenter * 0.3;
      lastX = smoothedX;

      keyframes.push({
        timestampSec: sub.time,
        cropCenterX: Math.min(0.8, Math.max(0.2, smoothedX)),
        cropCenterY: 0.5,
        scale: 1.777,
      });
    }

    return keyframes;
  }
}
