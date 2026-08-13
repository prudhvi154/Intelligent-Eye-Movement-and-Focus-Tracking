import React, { useState } from 'react';
import { Eye, User, Hash, ArrowRight, Shield, Lock, Zap } from 'lucide-react';

export default function WelcomePage({ onProceed }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Please enter your full name.';
    if (!studentId.trim()) e.studentId = 'Please enter your Student ID.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onProceed({ name: name.trim(), studentId: studentId.trim() });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left – Branding */}
        <div className="space-y-8 text-center lg:text-left px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered Examination Platform</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Intelligent<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">
                Online Exam
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
              A real-time webcam-monitored MCQ examination with eye tracking, gaze detection, and focus analytics — all processed locally in your browser.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Eye, label: 'Eye Tracking', color: 'cyan' },
              { icon: Shield, label: 'Focus Score', color: 'purple' },
              { icon: Lock, label: '100% Private', color: 'emerald' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className={`p-3 rounded-xl glass-panel border border-${color}-500/20 text-center space-y-1`}>
                <Icon className={`w-5 h-5 text-${color}-400 mx-auto`} />
                <p className="text-[11px] font-semibold text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Form */}
        <div className="p-8 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl shadow-cyan-500/5 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Start Your Exam</h2>
            <p className="text-xs text-slate-400">Enter your details to begin the examination session.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(p => ({...p, name: null})); }}
                placeholder="e.g. Prudhvi Sai"
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                  errors.name ? 'border-red-500/60' : 'border-slate-700 hover:border-slate-600'
                }`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Student ID Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Student ID / Roll Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setErrors(p => ({...p, studentId: null})); }}
                placeholder="e.g. CS2024001"
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                  errors.studentId ? 'border-red-500/60' : 'border-slate-700 hover:border-slate-600'
                }`}
              />
              {errors.studentId && <p className="text-xs text-red-400">{errors.studentId}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Proceed to Instructions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            📷 Your webcam will only activate <strong className="text-slate-400">after</strong> you click "Start Exam" on the instructions page. No data leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}
