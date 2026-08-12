import React from 'react';
import { Move } from 'lucide-react';

export default function HeadPosePanel({ pose = { yaw: 0, pitch: 0, roll: 0 } }) {
  return (
    <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase">Head Pose Angles</span>
        <Move className="w-4 h-4 text-purple-400" />
      </div>
      <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs font-semibold">
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">YAW</span>
          <span className="text-purple-400">{pose?.yaw || 0}°</span>
        </div>
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">PITCH</span>
          <span className="text-purple-400">{pose?.pitch || 0}°</span>
        </div>
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">ROLL</span>
          <span className="text-purple-400">{pose?.roll || 0}°</span>
        </div>
      </div>
    </div>
  );
}
