import React from 'react';
import { Eye, Shield, BarChart3, Settings, Play, Radio, Monitor, Zap, Volume2, VolumeX } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, isDemoMode, setIsDemoMode, activeSessionId }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActivePage('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Eye className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
                PROCTOR AI
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Intelligent Real-Time Exam Monitoring
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActivePage('landing')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activePage === 'landing'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Overview</span>
          </button>

          <button
            onClick={() => setActivePage('setup')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activePage === 'setup'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Pre-Exam Check</span>
          </button>

          <button
            onClick={() => setActivePage('monitor')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activePage === 'monitor'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Monitor</span>
          </button>

          <button
            onClick={() => setActivePage('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activePage === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        </nav>

        {/* Right Section: Demo Mode Toggle, Audio Mute, & Session Badge */}
        <div className="flex items-center gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={() => setIsAudioMuted && setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border ${
              isAudioMuted
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-slate-700'
            }`}
            title={isAudioMuted ? "Unmute Proctor Alert Sounds" : "Mute Proctor Alert Sounds"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Demo Simulator Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isDemoMode
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
            title="Toggle simulated webcam stream for testing without physical camera"
          >
            <Zap className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            <span>{isDemoMode ? 'DEMO SIMULATOR' : 'LIVE CAMERA'}</span>
          </button>

          {/* Active Session indicator */}
          {activeSessionId && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeSessionId}</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
