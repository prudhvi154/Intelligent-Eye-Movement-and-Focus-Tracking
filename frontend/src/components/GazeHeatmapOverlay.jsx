import React, { useRef, useEffect, useState } from 'react';
import { Flame, RefreshCw, Eye, Info } from 'lucide-react';

export default function GazeHeatmapOverlay({ gaze = "CENTER", isDemoMode }) {
  const canvasRef = useRef(null);
  const [pointsCount, setPointsCount] = useState(0);
  const historyRef = useRef([]);

  // Map gaze direction text to relative normalized coordinates on canvas (0.0 to 1.0)
  const getGazeCoords = (gazeDir) => {
    switch (gazeDir) {
      case 'LEFT': return { x: 0.25, y: 0.5 };
      case 'RIGHT': return { x: 0.75, y: 0.5 };
      case 'UP': return { x: 0.5, y: 0.25 };
      case 'DOWN': return { x: 0.5, y: 0.75 };
      case 'CENTER':
      default:
        // Add subtle random jitter for realism
        return {
          x: 0.5 + (Math.random() - 0.5) * 0.08,
          y: 0.5 + (Math.random() - 0.5) * 0.08
        };
    }
  };

  // Add new gaze point on gaze update or interval
  useEffect(() => {
    const coords = getGazeCoords(gaze);
    historyRef.current.push(coords);
    if (historyRef.current.length > 200) {
      historyRef.current.shift();
    }
    setPointsCount(historyRef.current.length);
    renderHeatmap();
  }, [gaze]);

  const renderHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw dark subtle background grid
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render radial gradient heat spots for each recorded point
    historyRef.current.forEach((pt) => {
      const px = pt.x * width;
      const py = pt.y * height;
      const radius = 35;

      const grad = ctx.createRadialGradient(px, py, 2, px, py, radius);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
      grad.addColorStop(0.4, 'rgba(255, 176, 32, 0.25)');
      grad.addColorStop(0.8, 'rgba(255, 77, 77, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw current active crosshair indicator
    const currentPt = getGazeCoords(gaze);
    const cx = currentPt.x * width;
    const cy = currentPt.y * height;

    ctx.strokeStyle = '#00F2FE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#00F2FE';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleResetHeatmap = () => {
    historyRef.current = [];
    setPointsCount(0);
    renderHeatmap();
  };

  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Real-Time Gaze Concentration Heatmap
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            Points: <strong className="text-cyan-400">{pointsCount}</strong>
          </span>
          <button
            onClick={handleResetHeatmap}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1"
            title="Reset Heatmap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Heatmap Canvas Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 aspect-video flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full object-cover"
        />

        {/* Heatmap Overlay Screen Target Labels */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-400">
          TOP-LEFT
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-400">
          TOP-RIGHT
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-400">
          BOTTOM-LEFT
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-400">
          BOTTOM-RIGHT
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/70 backdrop-blur border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold">
          EXAM DISPLAY TARGET
        </div>
      </div>

      {/* Heatmap Gradient Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
        <span>Low Fixation (Blue)</span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-red-500 opacity-80" />
        <span>High Fixation (Red)</span>
      </div>
    </div>
  );
}
