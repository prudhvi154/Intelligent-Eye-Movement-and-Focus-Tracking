import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Radio, Square, RefreshCw, Eye, Move, Users, Activity, Clock, ShieldAlert, Flame, Grid, User } from 'lucide-react';

import CameraView from '../components/CameraView';
import FocusScoreCard from '../components/FocusScoreCard';
import GazeIndicator from '../components/GazeIndicator';
import HeadPosePanel from '../components/HeadPosePanel';
import AlertPanel from '../components/AlertPanel';
import EventTimeline from '../components/EventTimeline';
import ViolationModal from '../components/ViolationModal';
import GazeHeatmapOverlay from '../components/GazeHeatmapOverlay';
import MultiCandidateGrid from '../components/MultiCandidateGrid';
import ReportExporter from '../components/ReportExporter';
import { createMonitoringWebSocket, startSession, endSession } from '../services/api';

export default function MonitoringDashboard({ isDemoMode, activeSessionId, setActiveSessionId, isAudioMuted, setIsAudioMuted }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // View modes: "SINGLE" candidate view vs "MULTI" candidate grid view
  const [viewMode, setViewMode] = useState('SINGLE'); // SINGLE, MULTI

  // Center pane sub-tab: "CAMERA" vs "HEATMAP"
  const [centerTab, setCenterTab] = useState('CAMERA'); // CAMERA, HEATMAP

  // Active modal violation alert
  const [activeModalAlert, setActiveModalAlert] = useState(null);

  // Live metrics state
  const [metrics, setMetrics] = useState({
    focus_score: 95.0,
    status: "Highly Focused",
    gaze: "CENTER",
    head_pose: { yaw: -1.2, pitch: 0.8, roll: 0.2 },
    blink_rate: 12.0,
    eye_closed: false,
    face_count: 1,
    face_detected: true,
    alert: { status: "NORMAL", label: "Focused & Normal Behavior", level: "low" }
  });

  const [eventsLog, setEventsLog] = useState([]);
  const [chartData, setChartData] = useState([]);
  const wsRef = useRef(null);

  // Session elapsed timer
  useEffect(() => {
    let timer;
    if (sessionActive) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionActive]);

  // Connect WebSocket monitoring stream
  useEffect(() => {
    let ws;
    const currentId = activeSessionId || "EXAM-2026-001";

    try {
      ws = createMonitoringWebSocket(currentId, isDemoMode);
      wsRef.current = ws;

      ws.onopen = () => {
        setSessionActive(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setMetrics((prev) => ({
            ...prev,
            focus_score: data.focus_score !== undefined ? data.focus_score : prev.focus_score,
            status: data.status || prev.status,
            gaze: data.gaze || prev.gaze,
            head_pose: data.head_pose || prev.head_pose,
            blink_rate: data.blink_rate || prev.blink_rate,
            eye_closed: data.eye_closed !== undefined ? data.eye_closed : prev.eye_closed,
            face_count: data.face_count !== undefined ? data.face_count : prev.face_count,
            face_detected: data.face_detected !== undefined ? data.face_detected : prev.face_detected,
            alert: data.alert || prev.alert
          }));

          // Trigger violation popup on attention required or high severity event
          if (data.new_event) {
            setEventsLog((prev) => [data.new_event, ...prev]);
            setActiveModalAlert({
              alertInfo: data.alert || { label: "Violation Detected", level: "high" },
              newEvent: data.new_event
            });
          } else if (data.alert && data.alert.status === "ATTENTION_REQUIRED") {
            setActiveModalAlert({
              alertInfo: data.alert,
              newEvent: null
            });
          }

          // Append point to live focus timeline
          const timestampLabel = new Date().toLocaleTimeString();
          setChartData((prev) => {
            const updated = [...prev, { time: timestampLabel, score: data.focus_score || 90 }];
            return updated.slice(-30);
          });
        } catch (e) {
          console.error("Error parsing WebSocket payload:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket fallback active.");
      };
    } catch (err) {
      console.warn("WebSocket init fallback:", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isDemoMode, activeSessionId]);

  const handleStartNewSession = async () => {
    const session = await startSession();
    setActiveSessionId(session.session_id);
    setElapsedSeconds(0);
    setEventsLog([]);
    setChartData([]);
    setSessionActive(true);
  };

  const handleEndSession = async () => {
    if (activeSessionId) {
      await endSession(activeSessionId);
    }
    setSessionActive(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Real-Time Violation Modal Alert */}
      {activeModalAlert && (
        <ViolationModal
          alertInfo={activeModalAlert.alertInfo}
          newEvent={activeModalAlert.newEvent}
          isAudioMuted={isAudioMuted}
          toggleAudioMute={() => setIsAudioMuted && setIsAudioMuted(!isAudioMuted)}
          onClose={() => setActiveModalAlert(null)}
        />
      )}

      {/* Top Session Control Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">
                SESSION: {activeSessionId || "EXAM-2026-001"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                MONITORING ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Continuous AI Eye Tracking & Behavioral Proctoring</p>
          </div>
        </div>

        {/* View Mode Toggle & Exporter & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'SINGLE' ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Candidate</span>
            </button>

            <button
              onClick={() => setViewMode('MULTI')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'MULTI' ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Multi-Candidate Grid</span>
            </button>
          </div>

          {/* Quick PDF/CSV Export Toolbar */}
          <ReportExporter
            analytics={{
              session_id: activeSessionId || "EXAM-2026-001",
              average_focus_score: Math.round(metrics.focus_score),
              duration_seconds: elapsedSeconds,
              total_events: eventsLog.length,
              focus_status: metrics.status
            }}
            eventsLog={eventsLog}
            chartData={chartData}
          />

          {/* Timer & Session Control */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {sessionActive ? (
            <button
              onClick={handleEndSession}
              className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Session</span>
            </button>
          ) : (
            <button
              onClick={handleStartNewSession}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Conditional View Mode Render */}
      {viewMode === 'MULTI' ? (
        <MultiCandidateGrid
          onInspectCandidate={(candId) => {
            setActiveSessionId(candId);
            setViewMode('SINGLE');
          }}
        />
      ) : (
        <>
          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Live Camera View or Gaze Heatmap Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Camera vs Heatmap Tab Switcher Header */}
              <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setCenterTab('CAMERA')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    centerTab === 'CAMERA' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Live Webcam Video & HUD Stream</span>
                </button>

                <button
                  onClick={() => setCenterTab('HEATMAP')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    centerTab === 'HEATMAP' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Interactive Gaze Concentration Heatmap</span>
                </button>
              </div>

              {centerTab === 'CAMERA' ? (
                <CameraView
                  isDemoMode={isDemoMode}
                  activeSessionId={activeSessionId}
                  onMetricsUpdate={(clientMetrics) => {
                    // Update local metrics immediately for standalone client-side tracking
                    setMetrics((prev) => ({
                      ...prev,
                      ...clientMetrics
                    }));

                    // Update live chart
                    const timestampLabel = new Date().toLocaleTimeString();
                    setChartData((prev) => {
                      const updated = [...prev, { time: timestampLabel, score: clientMetrics.focus_score || 0 }];
                      return updated.slice(-30);
                    });

                    // Handle alerts locally
                    if (clientMetrics.new_event) {
                      setEventsLog((prev) => [clientMetrics.new_event, ...prev]);
                      setActiveModalAlert({
                        alertInfo: clientMetrics.alert,
                        newEvent: clientMetrics.new_event
                      });
                    } else if (clientMetrics.alert && clientMetrics.alert.status !== "NORMAL") {
                       // Only show modal for critical/attention required if needed, or rely on normal alert banner
                       if (clientMetrics.alert.level === "high") {
                           setActiveModalAlert({
                             alertInfo: clientMetrics.alert,
                             newEvent: null
                           });
                       }
                    }

                    // (Optional) still send to backend if it's connected
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isDemoMode) {
                      wsRef.current.send(JSON.stringify({ ...clientMetrics, session_id: activeSessionId }));
                    }
                  }}
                />
              ) : (
                <GazeHeatmapOverlay gaze={metrics.gaze} isDemoMode={isDemoMode} />
              )}

              {/* Quick Metrics Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Gaze Direction */}
                <div className="p-3 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">GAZE DIRECTION</span>
                  <span className="text-sm font-bold font-mono text-cyan-400 mt-1">{metrics.gaze}</span>
                </div>

                {/* Head Pose */}
                <div className="p-3 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">HEAD ORIENTATION</span>
                  <span className="text-xs font-bold font-mono text-purple-400 mt-1">
                    Y:{metrics.head_pose?.yaw}° P:{metrics.head_pose?.pitch}°
                  </span>
                </div>

                {/* Blink Rate */}
                <div className="p-3 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">BLINK RATE</span>
                  <span className="text-sm font-bold font-mono text-slate-200 mt-1">{metrics.blink_rate} / min</span>
                </div>

                {/* Candidate Presence */}
                <div className="p-3 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">FACE COUNT</span>
                  <span className={`text-sm font-bold font-mono mt-1 ${metrics.face_count > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {metrics.face_count} {metrics.face_count === 1 ? 'PERSON' : 'PEOPLE'}
                  </span>
                </div>

              </div>
            </div>

            {/* Right Side: Focus Score Gauge, Real-Time Alert & Visual Panels */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              {/* Focus Score Gauge */}
              <FocusScoreCard score={metrics.focus_score} status={metrics.status} />

              {/* Real-time Warning Alert Banner */}
              <AlertPanel alertInfo={metrics.alert} />

              {/* Gaze Compass & Head Pose Panels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GazeIndicator gaze={metrics.gaze} />
                <HeadPosePanel pose={metrics.head_pose} />
              </div>
            </div>

          </div>

          {/* Bottom Row: Live Focus Score Chart & Event Audit Log Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Real-Time Line Chart */}
            <div className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Focus Score Stream Over Time</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">LAST 30 SECONDS</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00F2FE"
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real-Time Event Audit Log Timeline */}
            <div className="lg:col-span-5">
              <EventTimeline events={eventsLog} />
            </div>

          </div>
        </>
      )}

    </div>
  );
}
