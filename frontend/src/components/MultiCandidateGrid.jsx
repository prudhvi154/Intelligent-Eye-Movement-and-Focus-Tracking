import React, { useState, useEffect } from 'react';
import { Users, Eye, ShieldAlert, CheckCircle, Search, ExternalLink, Activity, AlertTriangle } from 'lucide-react';

const MOCK_CANDIDATES = [
  { id: "EXAM-2026-001", name: "Alex Morgan", score: 95, gaze: "CENTER", faces: 1, status: "Highly Focused", level: "low" },
  { id: "EXAM-2026-002", name: "Sarah Chen", score: 88, gaze: "CENTER", faces: 1, status: "Focused", level: "low" },
  { id: "EXAM-2026-003", name: "David Miller", score: 62, gaze: "LEFT", faces: 1, status: "Attention Required", level: "medium" },
  { id: "EXAM-2026-004", name: "Elena Rostova", score: 45, gaze: "DOWN", faces: 2, status: "Suspicious Activity", level: "high" },
  { id: "EXAM-2026-005", name: "James Wilson", score: 92, gaze: "CENTER", faces: 1, status: "Highly Focused", level: "low" },
  { id: "EXAM-2026-006", name: "Priya Sharma", score: 78, gaze: "RIGHT", faces: 1, status: "Focused", level: "low" }
];

export default function MultiCandidateGrid({ onInspectCandidate }) {
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Dynamic simulation update for live multi-candidate monitoring grid
  useEffect(() => {
    const interval = setInterval(() => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === "EXAM-2026-001") return c; // keep primary active candidate synced
          const delta = (Math.random() - 0.5) * 3;
          const newScore = Math.min(100, Math.max(30, Math.round(c.score + delta)));
          const gazes = ["CENTER", "CENTER", "CENTER", "LEFT", "RIGHT"];
          const newGaze = gazes[Math.floor(Math.random() * gazes.length)];
          return {
            ...c,
            score: newScore,
            gaze: newGaze,
            status: newScore >= 85 ? "Highly Focused" : newScore >= 70 ? "Focused" : "Attention Required"
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'ALERT') return matchesSearch && (c.score < 70 || c.faces > 1);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Grid Controls Header */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Candidate Live Proctoring Grid</h3>
            <p className="text-xs text-slate-400">Monitoring 6 Active Concurrent Exam Streams</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-56"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'ALL' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterStatus('ALERT')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'ALERT' ? 'bg-red-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Alerts ({candidates.filter(c => c.score < 70 || c.faces > 1).length})
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => {
          const isWarning = candidate.score < 70 || candidate.faces > 1;

          return (
            <div
              key={candidate.id}
              className={`p-5 rounded-2xl glass-panel border transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 shadow-xl ${
                isWarning ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{candidate.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{candidate.id}</span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  candidate.score >= 85
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : candidate.score >= 70
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                }`}>
                  {candidate.score}% FOCUS
                </span>
              </div>

              {/* Simulated Camera Video Stream Frame */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
                
                {/* Avatar / Camera feed representation */}
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-500/40 flex items-center justify-center text-xl font-bold text-slate-300 shadow-inner">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Status Badges Overlay */}
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">LIVE FEED</span>
                </div>

                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-slate-300 border border-slate-800">
                    GAZE: <strong className="text-cyan-400">{candidate.gaze}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded backdrop-blur text-[10px] font-mono border ${
                    candidate.faces > 1 ? 'bg-red-500/80 text-white border-red-500' : 'bg-black/70 text-slate-300 border-slate-800'
                  }`}>
                    FACES: {candidate.faces}
                  </span>
                </div>
              </div>

              {/* Footer Inspect Button */}
              <button
                onClick={() => onInspectCandidate && onInspectCandidate(candidate.id)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black font-semibold text-xs text-slate-200 transition-all flex items-center justify-center gap-1.5 group"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <span>Inspect Candidate Stream</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
