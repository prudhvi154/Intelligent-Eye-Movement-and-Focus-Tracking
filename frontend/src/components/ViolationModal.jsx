import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, X, Volume2, VolumeX, CheckCircle } from 'lucide-react';

// Web Audio API synthesized warning sound chime
export function playWarningChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("Web Audio chime prevented by browser autoplay policy:", e);
  }
}

export default function ViolationModal({ alertInfo, newEvent, isAudioMuted, toggleAudioMute, onClose }) {
  if (!alertInfo || (alertInfo.status === "NORMAL" && !newEvent)) {
    return null;
  }

  const isHighSeverity = alertInfo.level === "high" || (newEvent && newEvent.severity === "high");
  const alertTitle = newEvent ? (newEvent.event_type || newEvent.type || "").replace(/_/g, ' ') : alertInfo.label;
  const alertDescription = newEvent ? (newEvent.description || newEvent.message) : alertInfo.message;

  useEffect(() => {
    if (!isAudioMuted) {
      playWarningChime();
    }
  }, [alertInfo, newEvent, isAudioMuted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`max-w-md w-full rounded-2xl glass-panel border p-6 shadow-2xl space-y-5 transition-all ${
        isHighSeverity ? 'border-red-500/50 shadow-red-500/10' : 'border-amber-500/50 shadow-amber-500/10'
      }`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isHighSeverity ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isHighSeverity ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {isHighSeverity ? 'CRITICAL VIOLATION' : 'ATTENTION REQUIRED'}
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1 capitalize">{alertTitle.toLowerCase()}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {alertDescription || "Potential proctoring non-compliance detected."}
          </p>

          {newEvent && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 font-mono">
              <span>Confidence: <strong className="text-cyan-400">{Math.round((newEvent.confidence || 0.9) * 100)}%</strong></span>
              <span>Duration: <strong className="text-amber-400">{newEvent.duration_seconds || 2.0}s</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={toggleAudioMute}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio Active</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-black transition-all flex items-center justify-center gap-1.5 ${
              isHighSeverity ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/25' : 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Acknowledge Alert</span>
          </button>
        </div>

      </div>
    </div>
  );
}
