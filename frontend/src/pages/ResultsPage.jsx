import React, { useRef } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts';
import { Award, CheckCircle2, XCircle, Minus, BarChart3, Download, RotateCcw, Eye, Clock, AlertTriangle, Activity } from 'lucide-react';
import { questions } from '../data/questions';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }
function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}m ${pad(s)}s`;
}
function getFocusLevel(avg) {
  if (avg >= 80) return { label: 'HIGH',   color: 'emerald' };
  if (avg >= 60) return { label: 'MEDIUM', color: 'cyan' };
  if (avg >= 40) return { label: 'LOW',    color: 'amber' };
  return              { label: 'VERY LOW', color: 'red' };
}
function getPerformanceGrade(pct) {
  if (pct >= 90) return { grade: 'A+', label: 'EXCELLENT',       color: 'emerald' };
  if (pct >= 80) return { grade: 'A',  label: 'VERY GOOD',       color: 'cyan' };
  if (pct >= 70) return { grade: 'B+', label: 'GOOD',            color: 'blue' };
  if (pct >= 60) return { grade: 'B',  label: 'SATISFACTORY',    color: 'purple' };
  if (pct >= 50) return { grade: 'C',  label: 'AVERAGE',         color: 'amber' };
  return              { grade: 'F',  label: 'NEEDS IMPROVEMENT', color: 'red' };
}
function getMonitoringResult(suspicious, distractions) {
  if (suspicious > 4 || distractions > 8)  return { label: 'FLAGGED',  color: 'red' };
  if (suspicious > 1 || distractions > 4)  return { label: 'CAUTION',  color: 'amber' };
  return                                            { label: 'NORMAL',   color: 'emerald' };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function downloadCSV(result) {
  const rows = [
    ['student_name', 'student_id', 'score_pct', 'correct', 'wrong', 'unanswered',
     'total_questions', 'avg_focus', 'max_focus', 'min_focus',
     'distractions', 'suspicious_events', 'blink_count', 'duration_seconds', 'timestamp'],
    [
      result.studentInfo.name, result.studentInfo.studentId,
      result.examScore, result.correct, result.wrong, result.unanswered,
      result.totalQuestions, result.avgFocus, result.maxFocus, result.minFocus,
      result.distractions, result.suspiciousEvents, result.blinkCount,
      result.elapsedSeconds, new Date().toISOString()
    ]
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `exam_result_${result.studentInfo.studentId}_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResultsPage({ result, onRetake }) {
  const { studentInfo, scores, examScore, correct, wrong, unanswered, totalQuestions,
          elapsedSeconds, avgFocus, maxFocus, minFocus, blinkCount,
          distractions, suspiciousEvents, focusHistory, autoSubmitted } = result;

  const perf    = getPerformanceGrade(examScore);
  const focus   = getFocusLevel(avgFocus);
  const monitor = getMonitoringResult(suspiciousEvents, distractions);

  // Focused vs Distracted time (approx from history)
  const focusedTime    = focusHistory.filter(h => h.score >= 60).length * 2;
  const distractedTime = focusHistory.length * 2 - focusedTime;

  return (
    <div className="min-h-screen bg-[#0B0F19] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          {autoSubmitted && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⏰ Time's Up — Auto Submitted
            </div>
          )}
          <h1 className="text-4xl font-extrabold text-white">Exam Results</h1>
          <p className="text-slate-400 text-sm">
            <span className="text-cyan-400 font-semibold">{studentInfo.name}</span>
            {' '}&nbsp;·&nbsp;{' '}
            <span className="font-mono text-slate-300">{studentInfo.studentId}</span>
            {' '}&nbsp;·&nbsp;{' '}
            <span className="text-slate-400">Duration: {formatDuration(elapsedSeconds)}</span>
          </p>
        </div>

        {/* ── Score Banner ─────────────────────────────────────────────────── */}
        <div className={`p-8 rounded-3xl glass-panel border border-${perf.color}-500/25 shadow-2xl shadow-${perf.color}-500/10`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Score</p>
              <p className={`text-7xl font-extrabold text-${perf.color}-400 font-mono`}>{examScore}%</p>
              <p className={`text-lg font-bold text-${perf.color}-300`}>{perf.grade} — {perf.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Correct',    value: correct,    icon: CheckCircle2, color: 'emerald' },
                { label: 'Wrong',      value: wrong,      icon: XCircle,      color: 'red' },
                { label: 'Unanswered', value: unanswered, icon: Minus,        color: 'slate' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`p-4 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 space-y-1`}>
                  <Icon className={`w-5 h-5 text-${color}-400 mx-auto`} />
                  <p className={`text-2xl font-extrabold font-mono text-${color}-400`}>{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-Column: Focus Analytics + Monitoring Stats ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Focus Analytics */}
          <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Focus Analytics</h2>
            </div>
            {[
              { label: 'Average Focus Score', value: `${avgFocus}%`,      bold: true },
              { label: 'Maximum Focus',       value: `${maxFocus}%` },
              { label: 'Minimum Focus',       value: `${minFocus}%` },
              { label: 'Focus Level',         value: focus.label,          color: focus.color },
              { label: 'Focused Time',        value: formatDuration(focusedTime) },
              { label: 'Distracted Time',     value: formatDuration(distractedTime) },
            ].map(({ label, value, bold, color }) => (
              <div key={label} className="flex items-center justify-between text-sm border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-400">{label}</span>
                <span className={`font-bold font-mono ${color ? `text-${color}-400` : bold ? 'text-cyan-300' : 'text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Monitoring Stats */}
          <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Monitoring Statistics</h2>
            </div>
            {[
              { label: 'Blink Count',       value: blinkCount },
              { label: 'Distraction Events', value: distractions,      alert: distractions > 4 },
              { label: 'Suspicious Events',  value: suspiciousEvents,  alert: suspiciousEvents > 1 },
              { label: 'Exam Duration',      value: formatDuration(elapsedSeconds) },
              { label: 'Monitoring Result',  value: monitor.label,     color: monitor.color },
            ].map(({ label, value, alert, color }) => (
              <div key={label} className="flex items-center justify-between text-sm border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-400">{label}</span>
                <span className={`font-bold font-mono ${alert ? 'text-red-400' : color ? `text-${color}-400` : 'text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Overall Interpretation ───────────────────────────────────────── */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { title: 'Overall Performance', value: perf.label,    color: perf.color },
            { title: 'Focus Level',          value: focus.label,   color: focus.color },
            { title: 'Monitoring Result',    value: monitor.label, color: monitor.color },
          ].map(({ title, value, color }) => (
            <div key={title} className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{title}</p>
              <p className={`text-xl font-extrabold text-${color}-400 uppercase`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Focus Score Graph ─────────────────────────────────────────────── */}
        {focusHistory.length > 1 && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Focus Score Over Time</h2>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={focusHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }} />
                  <ReferenceLine y={60} stroke="#22d3ee" strokeDasharray="4 4" label={{ value: 'Focused', fill: '#22d3ee', fontSize: 10 }} />
                  <Line type="monotone" dataKey="score" stroke="#00F2FE" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Question Performance ──────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Question Performance</h2>
          <div className="space-y-2">
            {scores.map((s, i) => (
              <div key={s.id} className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                !s.selected
                  ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                  : s.correct
                  ? 'bg-emerald-500/8 border-emerald-500/20'
                  : 'bg-red-500/8 border-red-500/20'
              }`}>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Q{i + 1}</span>
                  {!s.selected
                    ? <Minus className="w-4 h-4 text-slate-500" />
                    : s.correct
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed truncate">{s.question}</p>
                  {s.selected && !s.correct && (
                    <p className="text-[10px] text-emerald-400 mt-0.5">✓ Correct: {s.answer}</p>
                  )}
                  {!s.selected && (
                    <p className="text-[10px] text-slate-500 mt-0.5">Not answered</p>
                  )}
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${
                  !s.selected ? 'text-slate-500' : s.correct ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {!s.selected ? '—' : s.correct ? 'CORRECT' : 'WRONG'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => downloadCSV(result)}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Download CSV Report
          </button>
          <button
            onClick={onRetake}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Exam
          </button>
        </div>
      </div>
    </div>
  );
}
