import React, { useRef, useEffect, useState } from 'react';
import { Camera, Eye, Zap, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

export default function CameraView({ isDemoMode, activeSessionId, onMetricsUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [demoFrame, setDemoFrame] = useState(0);

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
