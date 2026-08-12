import React from 'react';
import { Shield, Eye, Activity, Award, ArrowRight, CheckCircle2, Lock, Zap } from 'lucide-react';

export default function LandingPage({ onStartMonitoring, onViewAnalytics }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Generation AI Examination Integrity</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Intelligent Real-Time <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">
            Eye Tracking & Proctoring
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          Empowering educational institutions and assessment centers with real-time MediaPipe 3D face mesh landmarking, head pose orientation vectors, and stateful attention score analytics.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartMonitoring}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <span>Launch Pre-Exam Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onViewAnalytics}
            className="px-6 py-3.5 rounded-xl glass-panel text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Explore Analytics Sandbox</span>
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">478 3D Iris Landmark Mesh</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            High-precision client-side WASM neural network models track iris coordinates and eyelid aspect ratios (EAR) at 30 FPS.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Stateful Distraction Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detects gaze deviation off-screen, head turns, multiple face assistance, and prolonged eye closure with cooldown timers.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">100% Privacy Preserving</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All neural computer vision inference executes directly inside your browser. No video streams or biometrics leave your device.
          </p>
        </div>
      </div>

    </div>
  );
}
