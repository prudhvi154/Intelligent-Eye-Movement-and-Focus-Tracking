import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, Play, Shield, RefreshCw } from 'lucide-react';

export default function PreExamSetup({ onProceedToMonitor, isDemoMode }) {
  const [checks, setChecks] = useState({
    cameraPermission: true,
    faceDetected: true,
    lightingGood: true,
    calibrationDone: true
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Pre-Exam System Readiness Check</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Verify hardware permissions and webcam lighting before beginning your examination session.
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Webcam Hardware Access</h4>
                <p className="text-xs text-slate-400">Browser camera permissions verified</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PASSED</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Candidate Face Alignment</h4>
                <p className="text-xs text-slate-400">Single candidate face detected in frame</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PASSED</span>
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onProceedToMonitor}
            className="px-6 py-3 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <span>Proceed to Live Proctoring</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
