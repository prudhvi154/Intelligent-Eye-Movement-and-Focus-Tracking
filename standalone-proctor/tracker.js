// tracker.js
// Handles MediaPipe FaceLandmarker model loading, video frame processing, 
// facial analytics math (EAR, Head Pose, Gaze estimation), and screen gaze calibration.

import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

export class EyeTracker {
  constructor() {
    this.faceLandmarker = null;
    this.isModelLoaded = false;
    this.isTracking = false;
    this.animationFrameId = null;
    this.videoElement = null;
    
    // Calibration parameters
    this.calibrationPoints = {
      center: [],
      top_left: [],
      top_right: [],
      bottom_left: [],
      bottom_right: []
    };
    this.isCalibrated = false;
    
    // Calibrated bounds
    this.bounds = {
      minX: 0.42,
      maxX: 0.58,
      minY: 0.40,
      maxY: 0.60
    };

    // Distraction threshold configuration
    this.thresholds = {
      blinkDurationMs: 1500, // Drowsiness if eyes closed > 1.5s
      gazeOutBoundsRatio: 0.15, // Deviation from screen bounds
      yawLimit: 0.28,   // Head turn left/right threshold
      pitchLimit: 0.22, // Head tilt up/down threshold
      blinkThreshold: 0.62 // Blendshape blink value
    };
  }

  /**
   * Initializes the MediaPipe FaceLandmarker WASM bundle and model.
   * @param {function} onProgress - Callback with loading progress updates
   */
  async initialize(onProgress) {
    try {
      if (onProgress) onProgress("Initializing fileset resolver...");
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      if (onProgress) onProgress("Downloading face landmarker model (approx. 15MB)...");
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 3, // Detect up to 3 faces to flag multiple people cheating
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true
      });

      this.isModelLoaded = true;
      if (onProgress) onProgress("Model loaded successfully!");
      return true;
    } catch (error) {
      console.error("Error initializing MediaPipe FaceLandmarker:", error);
      if (onProgress) onProgress(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Starts the animation frame tracking loop.
   * @param {HTMLVideoElement} videoElement 
   * @param {function} onResult - Callback triggered with analysis results per frame
   * @param {function} onError - Error callback
   */
  startTracking(videoElement, onResult, onError) {
    if (!this.isModelLoaded) {
      if (onError) onError(new Error("Model not loaded yet."));
      return;
    }
    
    this.videoElement = videoElement;
    this.isTracking = true;

    const renderLoop = () => {
      if (!this.isTracking) return;

      try {
        if (this.videoElement.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          const timestamp = performance.now();
          const results = this.faceLandmarker.detectForVideo(this.videoElement, timestamp);
          
          const processedData = this.processFaceResults(results);
          if (onResult) onResult(processedData);
        }
      } catch (err) {
        console.error("Error in tracking loop:", err);
        if (onError) onError(err);
      }

      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  /**
   * Stops the active tracking loop.
   */
  stopTracking() {
    this.isTracking = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Process raw MediaPipe landmarks/blendshapes to extract eye-tracking metrics.
   * @param {object} results - Raw face landmarker output
   */
  processFaceResults(results) {
    const output = {
      numFaces: 0,
      faces: []
    };

    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return output;
    }

    output.numFaces = results.faceLandmarks.length;

    for (let f = 0; f < results.faceLandmarks.length; f++) {
      const landmarks = results.faceLandmarks[f];
      const blendshapes = results.faceBlendshapes && results.faceBlendshapes[f] ? results.faceBlendshapes[f].categories : [];
      
      // 1. Calculate Head Pose (Yaw, Pitch, Roll)
      const headPose = this.calculateHeadPose(landmarks);

      // 2. Calculate Blink Score (from blendshapes)
      const blinkLeft = this.findBlendshapeValue(blendshapes, "eyeBlinkLeft") || 0;
      const blinkRight = this.findBlendshapeValue(blendshapes, "eyeBlinkRight") || 0;
      const avgBlink = (blinkLeft + blinkRight) / 2;

      // 3. Gaze ratios (iris positioning inside eyes)
      const gazeData = this.calculateGazeRatios(landmarks);

      // 4. Map Gaze to Screen Coordinates (0 to 1 values for screen x & y)
      const gazeScreen = this.mapGazeToScreen(gazeData.gazeX, gazeData.gazeY, headPose.yaw, headPose.pitch);

      // 5. Categorize focus state
      const focusState = this.determineFocusState(gazeScreen, headPose, avgBlink, output.numFaces);

      output.faces.push({
        landmarks: landmarks, // Raw landmarks for drawing
        headPose: headPose,
        blink: {
          left: blinkLeft,
          right: blinkRight,
          average: avgBlink,
          closed: avgBlink > this.thresholds.blinkThreshold
        },
        gaze: {
          rawX: gazeData.gazeX,
          rawY: gazeData.gazeY,
          screenX: gazeScreen.x,
          screenY: gazeScreen.y
        },
        focus: focusState
      });
    }

    return output;
  }

  /**
   * Helper to find blendshape score by category name.
   */
  findBlendshapeValue(blendshapes, categoryName) {
    const shape = blendshapes.find(c => c.categoryName === categoryName);
    return shape ? shape.score : null;
  }

  /**
   * Calculates horizontal & vertical gaze ratios based on iris centers relative to eye corners.
   */
  calculateGazeRatios(landmarks) {
    // Right Eye: Inner corner = 133, Outer corner = 33, Upper lid = 159, Lower lid = 145, Iris center = 468
    // Left Eye: Inner corner = 362, Outer corner = 263, Upper lid = 386, Lower lid = 374, Iris center = 473
    
    const rIris = landmarks[468];
    const rInner = landmarks[133];
    const rOuter = landmarks[33];
    const rTop = landmarks[159];
    const rBottom = landmarks[145];

    const lIris = landmarks[473];
    const lInner = landmarks[362];
    const lOuter = landmarks[263];
    const lTop = landmarks[386];
    const lBottom = landmarks[374];

    if (!rIris || !lIris) {
      return { gazeX: 0.5, gazeY: 0.5 };
    }

    // Horizontal ratio (0 = looking outer corner / left, 1 = looking inner corner / right)
    // Formula: (iris.x - outer.x) / (inner.x - outer.x) for right eye, (iris.x - inner.x) / (outer.x - inner.x) for left eye
    const rGazeX = (rIris.x - rOuter.x) / (rInner.x - rOuter.x);
    const lGazeX = (lIris.x - lInner.x) / (lOuter.x - lInner.x);

    // Vertical ratio (0 = looking up, 1 = looking down)
    const rGazeY = (rIris.y - rTop.y) / (rBottom.y - rTop.y);
    const lGazeY = (lIris.y - lTop.y) / (lBottom.y - lTop.y);

    return {
      gazeX: (rGazeX + lGazeX) / 2,
      gazeY: (rGazeY + lGazeY) / 2
    };
  }

  /**
   * Computes approximate head orientation values using vector trigonometry.
   */
  calculateHeadPose(landmarks) {
    const nose = landmarks[4];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const leftEdge = landmarks[234];
    const rightEdge = landmarks[454];
    
    const eyeLeftOuter = landmarks[263];
    const eyeRightOuter = landmarks[33];

    if (!nose || !chin || !forehead || !leftEdge || !rightEdge || !eyeLeftOuter || !eyeRightOuter) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    // 1. Yaw (horizontal rotation): compare nose distance to left/right edge
    const distLeft = Math.abs(nose.x - leftEdge.x);
    const distRight = Math.abs(rightEdge.x - nose.x);
    const yawRatio = distLeft / (distLeft + distRight);
    const yaw = (yawRatio - 0.5) * 2; // Normalized around 0 (-1.0 to 1.0)

    // 2. Pitch (vertical rotation): compare nose distance to forehead/chin
    const distTop = Math.abs(nose.y - forehead.y);
    const distBottom = Math.abs(chin.y - nose.y);
    const pitchRatio = distTop / (distTop + distBottom);
    const pitch = (pitchRatio - 0.45) * 2.2; // Normalized around 0 (-1.0 to 1.0)

    // 3. Roll (tilt): slope angle of the eyes line
    const dx = eyeLeftOuter.x - eyeRightOuter.x;
    const dy = eyeLeftOuter.y - eyeRightOuter.y;
    const roll = Math.atan2(dy, dx); // Radians

    return { yaw, pitch, roll };
  }

  /**
   * Calibrates gaze position by recording eye/head metrics when looking at target locations.
   * @param {string} pointKey - e.g. "center", "top_left", etc.
   * @param {object} frameData - Processed frame info containing raw gaze & pose values
   */
  recordCalibrationSample(pointKey, frameData) {
    if (!this.calibrationPoints[pointKey]) return;
    
    // Add raw metrics. Include a small head pose compensation.
    const xFeature = frameData.gaze.rawX + frameData.headPose.yaw * 0.15;
    const yFeature = frameData.gaze.rawY + frameData.headPose.pitch * 0.15;
    
    this.calibrationPoints[pointKey].push({ x: xFeature, y: yFeature });
  }

  /**
   * Solves regression bounds from collected calibration points.
   */
  compileCalibration() {
    const averages = {};

    for (const key in this.calibrationPoints) {
      const samples = this.calibrationPoints[key];
      if (samples.length === 0) {
        console.warn(`Calibration incomplete. Missing data for: ${key}`);
        return false;
      }
      
      // Calculate average coordinates for this point
      const sum = samples.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
      averages[key] = {
        x: sum.x / samples.length,
        y: sum.y / samples.length
      };
    }

    // Set horizontal bounds based on left-side and right-side averages
    const leftAvg = (averages.top_left.x + averages.bottom_left.x) / 2;
    const rightAvg = (averages.top_right.x + averages.bottom_right.x) / 2;
    
    // Set vertical bounds based on top-side and bottom-side averages
    const topAvg = (averages.top_left.y + averages.top_right.y) / 2;
    const bottomAvg = (averages.bottom_left.y + averages.bottom_right.y) / 2;

    this.bounds.minX = Math.min(leftAvg, rightAvg);
    this.bounds.maxX = Math.max(leftAvg, rightAvg);
    this.bounds.minY = Math.min(topAvg, bottomAvg);
    this.bounds.maxY = Math.max(topAvg, bottomAvg);

    // Apply safety limits
    if (this.bounds.maxX - this.bounds.minX < 0.05) {
      this.bounds.minX = 0.42;
      this.bounds.maxX = 0.58;
    }
    if (this.bounds.maxY - this.bounds.minY < 0.05) {
      this.bounds.minY = 0.40;
      this.bounds.maxY = 0.60;
    }

    this.isCalibrated = true;
    console.log("Calibration compiled successfully. Bounds:", this.bounds);
    return true;
  }

  /**
   * Reset calibration cache.
   */
  resetCalibration() {
    this.calibrationPoints = {
      center: [],
      top_left: [],
      top_right: [],
      bottom_left: [],
      bottom_right: []
    };
    this.isCalibrated = false;
    this.bounds = {
      minX: 0.42,
      maxX: 0.58,
      minY: 0.40,
      maxY: 0.60
    };
  }

  /**
   * Maps current raw gaze ratios + head pose to screen coordinates (0 to 1).
   */
  mapGazeToScreen(rawX, rawY, yaw, pitch) {
    // Incorporate head pose offset into gaze ratios to handle head rotations
    const featureX = rawX + yaw * 0.15;
    const featureY = rawY + pitch * 0.15;

    // Linear mapping between bounds
    let screenX = (featureX - this.bounds.minX) / (this.bounds.maxX - this.bounds.minX);
    let screenY = (featureY - this.bounds.minY) / (this.bounds.maxY - this.bounds.minY);

    // Clamp values with a small overhang for smoother margins
    screenX = Math.max(-0.2, Math.min(1.2, screenX));
    screenY = Math.max(-0.2, Math.min(1.2, screenY));

    return { x: screenX, y: screenY };
  }

  /**
   * Classifies the focus state based on tracking metrics.
   * @returns {object} { focused: boolean, status: string, code: string, reason: string }
   */
  determineFocusState(gazeScreen, headPose, blinkValue, numFaces) {
    // 1. Multiple Face Violation
    if (numFaces > 1) {
      return {
        focused: false,
        status: "Multiple Faces",
        code: "MULTIPLE_FACES",
        reason: `${numFaces} individuals detected in frame.`
      };
    }

    // 2. Eyes closed (Drowsy or looking down cheating)
    if (blinkValue > this.thresholds.blinkThreshold) {
      return {
        focused: false,
        status: "Eyes Closed",
        code: "EYES_CLOSED",
        reason: "User closed their eyes or is looking straight down."
      };
    }

    // 3. Head turned away (Yaw / Pitch)
    if (Math.abs(headPose.yaw) > this.thresholds.yawLimit) {
      return {
        focused: false,
        status: "Head Turned Away",
        code: "HEAD_TURNED",
        reason: headPose.yaw > 0 ? "Looking far right." : "Looking far left."
      };
    }

    if (Math.abs(headPose.pitch) > this.thresholds.pitchLimit) {
      return {
        focused: false,
        status: "Head Tilted",
        code: "HEAD_TILTED",
        reason: headPose.pitch > 0 ? "Looking down." : "Looking up."
      };
    }

    // 4. Gaze off-screen
    const offScreenX = gazeScreen.x < -0.1 || gazeScreen.x > 1.1;
    const offScreenY = gazeScreen.y < -0.1 || gazeScreen.y > 1.1;
    if (offScreenX || offScreenY) {
      return {
        focused: false,
        status: "Gaze Off-Screen",
        code: "GAZE_AWAY",
        reason: "Eyes drifted away from the active window."
      };
    }

    // 5. Default focused state
    return {
      focused: true,
      status: "Focused",
      code: "FOCUSED",
      reason: "User is actively looking at the screen."
    };
  }
}
