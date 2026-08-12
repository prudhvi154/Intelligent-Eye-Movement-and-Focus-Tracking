import React from 'react';
import { Target, Activity } from 'lucide-react';

export default function FocusScoreCard({ score = 95, status = "Highly Focused" }) {
  const roundedScore = Math.round(score);

  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-between space-y-4 shadow-xl">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Candidate Focus Rating</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">REAL-TIME</span>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center">
        <div
          className="w-full h-full rounded-full flex items-center justify-center shadow-lg transition-all duration-500"
          style={{
            background: `radial-gradient(closest-side, #0B0F19 79%, transparent 80% 100%), conic-gradient(#00F2FE ${roundedScore}%, #1E293B 0)`
          }}
        >
          <div className="text-center">
            <span className="text-4xl font-extrabold font-mono text-white">{roundedScore}%</span>
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
