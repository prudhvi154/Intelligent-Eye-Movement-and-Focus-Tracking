import React, { useRef, useEffect, useState } from 'react';
import { Camera, Eye, Zap, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import { EyeTracker } from '../utils/EyeTracker';

export default function CameraView({ isDemoMode, activeSessionId, onMetricsUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [demoFrame, setDemoFrame] = useState(0);
  const eyeTrackerRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    if (isDemoMode) {
      setCameraActive(true);
      const updateDemo = () => {
        setDemoFrame((prev) => (prev + 1) % 360);
        animationFrameId = requestAnimationFrame(updateDemo);
      };
      animationFrameId = requestAnimationFrame(updateDemo);
    } else {
      async function setupCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, frameRate: 30 }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);

            // Initialize tracker
            const tracker = new EyeTracker();
            await tracker.initialize((progress) => console.log(progress));
            eyeTrackerRef.current = tracker;

            tracker.startTracking(videoRef.current, (processedData) => {
               // Convert to standard metrics format for the dashboard
               if (processedData.numFaces > 0) {
                 const face = processedData.faces[0];
                 const gazeDir = face.gaze.screenX < 0.4 ? "LEFT" : face.gaze.screenX > 0.6 ? "RIGHT" : face.gaze.screenY < 0.4 ? "UP" : face.gaze.screenY > 0.6 ? "DOWN" : "CENTER";
                 
                 let alertData = null;
                 let eventData = null;
                 
                 if (!face.focus.focused || processedData.numFaces > 1) {
                   const code = processedData.numFaces > 1 ? "MULTIPLE_FACES" : face.focus.code;
                   const label = processedData.numFaces > 1 ? "Multiple Faces" : face.focus.status;
                   const reason = processedData.numFaces > 1 ? `${processedData.numFaces} individuals detected.` : face.focus.reason;
                   
                   alertData = {
                     status: code === "ATTENTION_REQUIRED" ? code : "CRITICAL_VIOLATION",
                     label: label,
                     level: code === "EYES_CLOSED" || code === "MULTIPLE_FACES" ? "high" : "medium"
                   };
                   
                   eventData = {
                     id: Date.now(),
                     time: new Date().toLocaleTimeString(),
                     type: code,
                     severity: alertData.level,
                     message: reason
                   };
                 } else {
                   alertData = { status: "NORMAL", label: "Focused & Normal Behavior", level: "low" };
                 }

                 // Determine a dynamic focus score
                 let score = face.focus.focused ? 95 - (Math.abs(face.headPose.yaw) * 10) : 40;
                 if (processedData.numFaces > 1) score = 10;
                 
                 onMetricsUpdate({
                   focus_score: Math.max(0, Math.min(100, score)),
                   status: face.focus.focused ? "Highly Focused" : face.focus.status,
                   gaze: gazeDir,
                   head_pose: {
                     yaw: (face.headPose.yaw * 90).toFixed(1), 
                     pitch: (face.headPose.pitch * 90).toFixed(1), 
                     roll: 0 
                   },
                   blink_rate: Math.round(face.blink.average * 20),
                   eye_closed: face.blink.closed,
                   face_count: processedData.numFaces,
                   face_detected: true,
                   alert: alertData,
                   new_event: eventData
                 });
               } else {
                 onMetricsUpdate({
                   focus_score: 0,
                   status: "No Face Detected",
                   gaze: "UNKNOWN",
                   face_count: 0,
                   face_detected: false,
                   alert: { status: "NO_FACE", label: "Candidate Missing", level: "high" },
                   new_event: {
                     id: Date.now(),
                     time: new Date().toLocaleTimeString(),
                     type: "NO_FACE",
                     severity: "high",
                     message: "No face detected in camera frame."
                   }
                 });
               }
            });
          }
        } catch (err) {
          console.warn("Webcam access warning:", err);
          setCameraActive(false);
        }
      }
      setupCamera();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (eyeTrackerRef.current) eyeTrackerRef.current.stopTracking();
    };
  }, [isDemoMode]);

  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Webcam Feed & HUD Mesh Overlay
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-bold uppercase">
            {isDemoMode ? 'SIMULATOR WASM FEED' : 'LIVE WEBCAM'}
          </span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
        {isDemoMode ? (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Simulated Animated Face Target Overlay */}
            <div
              className="w-36 h-48 rounded-full border-2 border-cyan-400/50 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(0,242,254,0.2)] transition-transform duration-300"
              style={{
                transform: `translate(${Math.sin(demoFrame * 0.05) * 15}px, ${Math.cos(demoFrame * 0.03) * 8}px)`
              }}
            >
              <div className="flex gap-8 mb-4">
                <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="w-12 h-1 bg-cyan-500/60 rounded-full" />
            </div>

            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-800 text-[10px] font-mono text-cyan-400">
              3D MESH: 478 LANDMARKS (ACTIVE)
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />
      </div>
    </div>
  );
}
