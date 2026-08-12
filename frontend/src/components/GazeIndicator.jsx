import React from 'react';
import { Eye, Compass } from 'lucide-react';

export default function GazeIndicator({ gaze = "CENTER" }) {
  return (
    <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase">Gaze Direction</span>
        <Compass className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="text-center font-mono font-bold text-lg text-cyan-400 bg-slate-900/80 py-2 rounded-lg border border-slate-800">
        {gaze}
      </div>
    </div>
  );
}
