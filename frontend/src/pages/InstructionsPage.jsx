import React from 'react';
import { CheckCircle2, Clock, Eye, Monitor, AlertTriangle, Play } from 'lucide-react';
import { EXAM_DURATION_MINUTES } from '../config';
import { questions } from '../data/questions';

const instructions = [
  { icon: Monitor, text: 'Make sure your face is clearly visible in the webcam.' },
  { icon: Eye,     text: 'Keep your eyes focused on the screen while answering.' },
  { icon: AlertTriangle, text: 'Avoid looking away for extended periods — distractions are recorded.' },
  { icon: CheckCircle2,  text: 'Answer all questions before time runs out.' },
  { icon: Clock,   text: `You have ${EXAM_DURATION_MINUTES} minutes to complete all ${questions.length} questions.` },
  { icon: Monitor, text: 'Do not leave the camera view during the exam.' },
  { icon: AlertTriangle, text: 'Multiple faces detected in the frame will be flagged as suspicious activity.' },
  { icon: CheckCircle2, text: 'You may navigate freely between questions. Answers are saved automatically.' },
  { icon: Play,    text: 'Your webcam will activate only after you click "Start Exam" below.' },
];

export default function InstructionsPage({ studentInfo, onStartExam }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Important — Read Before Starting</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Exam Instructions</h1>
          <p className="text-sm text-slate-400">
            Hello, <span className="text-cyan-400 font-semibold">{studentInfo?.name}</span> &nbsp;|&nbsp; ID: <span className="font-mono text-slate-300">{studentInfo?.studentId}</span>
          </p>
        </div>

        {/* Exam Info Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Questions', value: questions.length, color: 'cyan' },
            { label: 'Duration', value: `${EXAM_DURATION_MINUTES} min`, color: 'amber' },
            { label: 'Type', value: 'MCQ', color: 'purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-3 rounded-xl glass-panel border border-${color}-500/20 text-center`}>
              <p className={`text-2xl font-extrabold text-${color}-400 font-mono`}>{value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Instructions List */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/60 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Examination Rules</h2>
          {instructions.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          <strong>⚠️ Disclaimer:</strong> This system detects suspicious activity such as gaze deviations and head turns. It does <em>not</em> confirm cheating — events are recorded for review only and will appear in your final report.
        </div>

        {/* Action Button */}
        <button
          onClick={onStartExam}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-base transition-all shadow-2xl shadow-cyan-500/25 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-current" />
          I Understand — Start Exam &amp; Enable Webcam
        </button>

        <p className="text-center text-[11px] text-slate-500">
          By clicking above you consent to webcam monitoring during the exam session.
        </p>
      </div>
    </div>
  );
}
