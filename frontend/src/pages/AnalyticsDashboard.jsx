import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { BarChart3, Clock, ShieldCheck, AlertTriangle, EyeOff, Users, Award, Download, Filter, Flame } from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import ReportExporter from '../components/ReportExporter';

export default function AnalyticsDashboard({ activeSessionId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const currentId = activeSessionId || "EXAM-2026-001";
      const data = await fetchAnalytics(currentId);

      if (data) {
        setAnalytics(data);
      } else {
        // Fallback synthetic mock analytics report if server data unavailable
        setAnalytics({
          session_id: currentId,
          start_time: new Date(Date.now() - 2700000).toISOString(),
          end_time: new Date().toISOString(),
          duration_seconds: 2700,
          average_focus_score: 84.5,
          min_focus_score: 52.0,
          max_focus_score: 98.0,
          focus_status: "Focused",
          total_events: 8,
          looking_away_events: 5,
          face_absence_events: 2,
          multiple_face_events: 1,
          prolonged_closure_events: 0,
          focus_timeline: Array.from({ length: 15 }, (_, i) => ({
            time: `${10 + Math.floor(i / 2)}:${(i * 4) % 60 < 10 ? '0' : ''}${(i * 4) % 60}`,
            score: Math.min(100, Math.max(45, 90 + Math.sin(i) * 15 - (i === 6 ? 35 : 0)))
          })),
          event_distribution: {
            "LOOKING_AWAY": 5,
            "FACE_NOT_DETECTED": 2,
            "MULTIPLE_FACE_DETECTED": 1,
            "PROLONGED_EYE_CLOSURE": 0
          }
        });
      }
      setLoading(false);
    }
    loadData();
  }, [activeSessionId]);

  if (loading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 font-mono text-sm">
        Loading session analytics report...
      </div>
    );
  }

  const PIE_COLORS = ['#00F2FE', '#FFB020', '#FF4D4D', '#7F56D9'];

  const distributionData = [
    { name: 'Looking Away', value: analytics.looking_away_events },
    { name: 'Face Absence', value: analytics.face_absence_events },
    { name: 'Multiple Faces', value: analytics.multiple_face_events },
    { name: 'Long Closure', value: analytics.prolonged_closure_events }
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            <span>Candidate Examination Analytics & Audit Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Session ID: <span className="font-mono text-cyan-400">{analytics.session_id}</span> • Status: <span className="font-semibold text-emerald-400">{analytics.focus_status}</span>
          </p>
        </div>

        {/* Integrated PDF & CSV Exporter */}
        <ReportExporter analytics={analytics} />
      </div>

      {/* Metric Cards Banner Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">AVG FOCUS SCORE</span>
          <span className="text-3xl font-extrabold font-mono text-cyan-400 mt-2">
            {analytics.average_focus_score}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Min: {analytics.min_focus_score}% | Max: {analytics.max_focus_score}%</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">SESSION DURATION</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
            {Math.round(analytics.duration_seconds / 60)} min
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Total Monitored Time</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">TOTAL DISTRACTIONS</span>
          <span className="text-3xl font-extrabold font-mono text-amber-400 mt-2">
            {analytics.total_events}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Logged Behavioral Events</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">RECOMMENDED STATUS</span>
          <span className="text-base font-extrabold text-purple-400 mt-2">
            {analytics.focus_status}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Overall Assessment</span>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Full Session Focus Timeline Line Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Focus Trajectory</h3>
            <span className="text-xs font-mono text-slate-400">CHRONOLOGICAL METRICS</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.focus_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#4FACFE" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Behavior Distribution Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Distraction Distribution</h3>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData.length > 0 ? distributionData : [{ name: 'None', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
