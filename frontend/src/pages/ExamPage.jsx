import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, ChevronLeft, ChevronRight, Send, AlertTriangle,
  Eye, Activity, CheckCircle2, XCircle, Camera, Wifi, WifiOff
} from 'lucide-react';
import { EyeTracker } from '../utils/EyeTracker';
import { questions } from '../data/questions';
import {
  EXAM_DURATION_MINUTES, DISTRACTION_THRESHOLD_SECONDS,
  SUSPICIOUS_THRESHOLD_SECONDS, FOCUS_SMOOTH_ALPHA,
  FOCUS_HIGHLY_FOCUSED, FOCUS_FOCUSED, FOCUS_DISTRACTED,
  GAZE_SCREEN_X_LEFT, GAZE_SCREEN_X_RIGHT,
  GAZE_SCREEN_Y_UP, GAZE_SCREEN_Y_DOWN
} from '../config';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOTAL_SECONDS = EXAM_DURATION_MINUTES * 60;

function pad(n) { return String(n).padStart(2, '0'); }

function formatCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

function formatElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}m ${pad(s)}s`;
}

function getFocusStatus(score) {
  if (score >= FOCUS_HIGHLY_FOCUSED) return { label: 'HIGHLY FOCUSED', color: 'emerald' };
  if (score >= FOCUS_FOCUSED)        return { label: 'FOCUSED',        color: 'cyan' };
  if (score >= FOCUS_DISTRACTED)     return { label: 'DISTRACTED',     color: 'amber' };
  return                                     { label: 'HIGHLY DISTRACTED', color: 'red' };
}

function classifyGaze(screenX, screenY) {
  if (screenX < GAZE_SCREEN_X_LEFT)  return 'LEFT';
  if (screenX > GAZE_SCREEN_X_RIGHT) return 'RIGHT';
  if (screenY < GAZE_SCREEN_Y_UP)    return 'UP';
  if (screenY > GAZE_SCREEN_Y_DOWN)  return 'DOWN';
  return 'CENTER';
}

const GAZE_COLORS = {
  CENTER: 'text-emerald-400',
  LEFT:   'text-amber-400',
  RIGHT:  'text-amber-400',
  UP:     'text-amber-400',
  DOWN:   'text-amber-400',
  UNKNOWN:'text-slate-400'
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExamPage({ studentInfo, onSubmit }) {
  // ── Answers & Navigation ──
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [examStartTime] = useState(Date.now());
  const timerRef = useRef(null);

  // ── Webcam / Eye-Tracking State ──
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const trackerRef  = useRef(null);
  const streamRef   = useRef(null);

  const [cameraReady,     setCameraReady]     = useState(false);
  const [modelLoading,    setModelLoading]    = useState(true);
  const [modelStatus,     setModelStatus]     = useState('Initializing camera...');
  const [cameraError,     setCameraError]     = useState(null);

  // ── Live Monitoring State ──
  const [focusScore,      setFocusScore]      = useState(100);
  const [gaze,            setGaze]            = useState('CENTER');
  const [headStatus,      setHeadStatus]      = useState('NORMAL');
  const [faceDetected,    setFaceDetected]    = useState(true);
  const [faceCount,       setFaceCount]       = useState(1);
  const [eyesClosed,      setEyesClosed]      = useState(false);
  const [blinkCount,      setBlinkCount]      = useState(0);
  const [distractions,    setDistractions]    = useState(0);
  const [suspiciousEvents,setSuspiciousEvents]= useState(0);
  const [activeWarnings,  setActiveWarnings]  = useState([]);
  const [focusHistory,    setFocusHistory]    = useState([]);

  // ── Submit Dialog ──
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSubmitted,    setAutoSubmitted]    = useState(false);

  // Refs for smoothing / debouncing (mutable, not re-renders)
  const prevScoreRef         = useRef(100);
  const lookAwayStartRef     = useRef(null);
  const faceMissingStartRef  = useRef(null);
  const lastBlinkRef         = useRef(false);
  const lastDistractTimeRef  = useRef(0);
  const lastSuspiciousRef    = useRef(0);
  const examActiveRef        = useRef(true);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (examActiveRef.current) {
            setAutoSubmitted(true);
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Camera + MediaPipe ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setModelStatus('Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: 30 } });
        streamRef.current = stream;
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }

        setModelStatus('Loading AI model (~15 MB, one-time download)...');
        const tracker = new EyeTracker();
        trackerRef.current = tracker;
        await tracker.initialize((msg) => { if (!cancelled) setModelStatus(msg); });
        if (cancelled) return;

        setModelLoading(false);
        setModelStatus('Tracking active');

        tracker.startTracking(
          videoRef.current,
          (data) => { if (examActiveRef.current) processFrame(data); },
          (err)  => console.warn('Tracker error:', err)
        );
      } catch (err) {
        if (!cancelled) {
          setCameraError(err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow webcam access and refresh.'
            : `Camera error: ${err.message}`);
          setModelLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      examActiveRef.current = false;
      if (trackerRef.current) trackerRef.current.stopTracking();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Frame Processor ──────────────────────────────────────────────────────────
  const processFrame = useCallback((data) => {
    const now = Date.now();
    const warnings = [];
    let rawScore = 100;
    let newGaze = 'CENTER';
    let newHead = 'NORMAL';

    if (!data || data.numFaces === 0) {
      // Face missing
      rawScore = 5;
      newGaze = 'UNKNOWN';
      setFaceDetected(false);
      setFaceCount(0);
      warnings.push({ id: 'no_face', msg: '⚠️ Face not detected — please return to camera view.' });

      if (!faceMissingStartRef.current) faceMissingStartRef.current = now;
      const missingDuration = (now - faceMissingStartRef.current) / 1000;
      if (missingDuration > DISTRACTION_THRESHOLD_SECONDS) {
        if (now - lastDistractTimeRef.current > 5000) {
          setDistractions(d => d + 1);
          lastDistractTimeRef.current = now;
        }
      }
      if (missingDuration > SUSPICIOUS_THRESHOLD_SECONDS) {
        if (now - lastSuspiciousRef.current > 8000) {
          setSuspiciousEvents(s => s + 1);
          lastSuspiciousRef.current = now;
        }
      }
    } else {
      faceMissingStartRef.current = null;
      setFaceDetected(true);
      setFaceCount(data.numFaces);

      // Multiple faces
      if (data.numFaces > 1) {
        warnings.push({ id: 'multi_face', msg: `⚠️ Multiple faces detected (${data.numFaces}).` });
        rawScore -= 40;
        if (now - lastSuspiciousRef.current > 8000) {
          setSuspiciousEvents(s => s + 1);
          lastSuspiciousRef.current = now;
        }
      }

      const face = data.faces[0];

      // Blink counting
      const isClosed = face.blink.closed;
      setEyesClosed(isClosed);
      if (isClosed && !lastBlinkRef.current) {
        setBlinkCount(b => b + 1);
      }
      lastBlinkRef.current = isClosed;

      // Head pose
      const { yaw, pitch } = face.headPose;
      const headTurned = Math.abs(yaw) > 0.28 || Math.abs(pitch) > 0.22;
      if (headTurned) {
        newHead = 'TURNED';
        rawScore -= 25;
        warnings.push({ id: 'head', msg: '⚠️ Head turned — please look at the screen.' });
      }

      // Gaze direction
      newGaze = classifyGaze(face.gaze.screenX, face.gaze.screenY);
      const lookingAway = newGaze !== 'CENTER';

      if (lookingAway || headTurned || isClosed) {
        rawScore -= 30;
        if (!lookAwayStartRef.current) lookAwayStartRef.current = now;
        const awayDuration = (now - lookAwayStartRef.current) / 1000;

        if (awayDuration > DISTRACTION_THRESHOLD_SECONDS) {
          warnings.push({ id: 'gaze', msg: '⚠️ Please focus on the screen.' });
          if (now - lastDistractTimeRef.current > 5000) {
            setDistractions(d => d + 1);
            lastDistractTimeRef.current = now;
          }
        }
        if (awayDuration > SUSPICIOUS_THRESHOLD_SECONDS) {
          if (now - lastSuspiciousRef.current > 8000) {
            setSuspiciousEvents(s => s + 1);
            lastSuspiciousRef.current = now;
          }
        }
      } else {
        lookAwayStartRef.current = null;
      }

      if (isClosed) {
        warnings.push({ id: 'eyes', msg: '⚠️ Eyes closed.' });
        rawScore -= 20;
      }
    }

    rawScore = Math.max(0, Math.min(100, rawScore));

    // Smooth
    const smoothed = FOCUS_SMOOTH_ALPHA * prevScoreRef.current + (1 - FOCUS_SMOOTH_ALPHA) * rawScore;
    prevScoreRef.current = smoothed;

    setFocusScore(smoothed);
    setGaze(newGaze);
    setHeadStatus(newHead);
    setActiveWarnings(warnings);

    // Record to history (every ~2 seconds)
    setFocusHistory(prev => {
      if (prev.length === 0 || now - (prev[prev.length - 1]?.ts || 0) > 2000) {
        return [...prev, { ts: now, score: Math.round(smoothed), time: new Date().toLocaleTimeString() }];
      }
      return prev;
    });
  }, []);

  // ── Submission ───────────────────────────────────────────────────────────────
  const handleFinalSubmit = (auto = false) => {
    examActiveRef.current = false;
    clearInterval(timerRef.current);
    if (trackerRef.current) trackerRef.current.stopTracking();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    const elapsedSeconds = TOTAL_SECONDS - timeLeft;
    const scores = questions.map(q => ({
      id: q.id,
      question: q.question,
      selected: answers[q.id] || null,
      correct: answers[q.id] === q.answer,
      answer: q.answer
    }));
    const correct   = scores.filter(s => s.correct).length;
    const unanswered = scores.filter(s => !s.selected).length;

    const focusScores = focusHistory.map(h => h.score);
    const avgFocus = focusScores.length > 0
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : Math.round(prevScoreRef.current);
    const maxFocus = focusScores.length > 0 ? Math.max(...focusScores) : 100;
    const minFocus = focusScores.length > 0 ? Math.min(...focusScores) : Math.round(prevScoreRef.current);

    onSubmit({
      studentInfo,
      scores,
      totalQuestions: questions.length,
      correct,
      wrong: questions.length - correct - unanswered,
      unanswered,
      examScore: Math.round((correct / questions.length) * 100),
      elapsedSeconds,
      autoSubmitted: auto,
      focusHistory,
      avgFocus,
      maxFocus,
      minFocus,
      blinkCount,
      distractions,
      suspiciousEvents,
    });
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[currentQ];
  const focusStatus = getFocusStatus(focusScore);
  const timerDanger = timeLeft < 60;

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">ONLINE EXAM</p>
            <p className="text-[10px] text-slate-500">{studentInfo?.name} · {studentInfo?.studentId}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-colors ${
          timerDanger ? 'bg-red-500/15 border border-red-500/40 text-red-400 animate-pulse' : 'bg-slate-900 border border-slate-800 text-white'
        }`}>
          <Clock className="w-4 h-4" />
          {formatCountdown(timeLeft)}
        </div>

        <button
          onClick={() => setShowSubmitDialog(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-[0.97] transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          Submit Exam
        </button>
      </header>

      {/* ── Auto-submit Banner ───────────────────────────────────────────────── */}
      {autoSubmitted && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-3 text-center text-red-300 text-sm font-semibold">
          ⏰ Time's up! Your exam has been automatically submitted.
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">

        {/* ── LEFT: Question Area ────────────────────────────────────────────── */}
        <div className="lg:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5">

          {/* Question Nav Grid */}
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const answered = !!answers[q.id];
              const isCurrent = i === currentQ;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                    isCurrent
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-110'
                      : answered
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {i + 1}
                  {answered && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
            <span className="ml-2 self-center text-xs text-slate-500">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-700/60 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Question {currentQ + 1} of {questions.length}
              </span>
              {answers[q.id] && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {q.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, oi) => {
                const letters = ['A', 'B', 'C', 'D'];
                const selected = answers[q.id] === option;
                return (
                  <label
                    key={oi}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all group ${
                      selected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                      selected
                        ? 'bg-cyan-500 border-cyan-500 text-black'
                        : 'border-slate-600 text-slate-400 group-hover:border-slate-400'
                    }`}>
                      {letters[oi]}
                    </div>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={option}
                      checked={selected}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: option }))}
                      className="sr-only"
                    />
                    <span className="text-sm leading-relaxed">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentQ === 0}
              onClick={() => setCurrentQ(i => i - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm font-semibold transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              disabled={currentQ === questions.length - 1}
              onClick={() => setCurrentQ(i => i + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm font-semibold transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Monitoring Panel ────────────────────────────────────────── */}
        <div className="lg:col-span-4 bg-slate-950/70 border-l border-slate-800 p-4 space-y-4 overflow-y-auto">

          {/* Camera Feed */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative aspect-video">
            {cameraError ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                <WifiOff className="w-8 h-8 text-red-400" />
                <p className="text-xs text-red-300">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />
                {modelLoading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-cyan-300 leading-relaxed">{modelStatus}</p>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 text-[10px] font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-slate-300">{cameraReady ? 'LIVE' : 'LOADING'}</span>
                </div>
              </>
            )}
          </div>

          {/* Warnings */}
          {activeWarnings.length > 0 && (
            <div className="space-y-1.5">
              {activeWarnings.map(w => (
                <div key={w.id} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{w.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Focus Score */}
          <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Score</span>
              <span className={`text-[10px] font-bold text-${focusStatus.color}-400 uppercase`}>{focusStatus.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold font-mono text-${focusStatus.color}-400`}>
                {Math.round(focusScore)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full bg-${focusStatus.color}-500 transition-all duration-500`}
                style={{ width: `${focusScore}%` }}
              />
            </div>
          </div>

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'GAZE', value: gaze, cls: GAZE_COLORS[gaze] || 'text-slate-300' },
              { label: 'HEAD', value: headStatus, cls: headStatus === 'NORMAL' ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'FACE', value: faceDetected ? `${faceCount} Detected` : 'Missing', cls: faceDetected && faceCount === 1 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'EYES', value: eyesClosed ? 'CLOSED' : 'OPEN', cls: eyesClosed ? 'text-amber-400' : 'text-emerald-400' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">{m.label}</p>
                <p className={`text-sm font-bold font-mono ${m.cls}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Counters */}
          <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Monitoring Stats</p>
            {[
              { label: 'Blink Count',        value: blinkCount },
              { label: 'Distractions',       value: distractions,       alert: distractions > 3 },
              { label: 'Suspicious Events',  value: suspiciousEvents,   alert: suspiciousEvents > 0 },
              { label: 'Elapsed',            value: formatElapsed(TOTAL_SECONDS - timeLeft) },
            ].map(({ label, value, alert }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className={`font-mono font-bold ${alert ? 'text-red-400' : 'text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Monitoring Status Badge */}
          <div className={`p-3 rounded-xl border text-center text-xs font-bold uppercase tracking-wider ${
            suspiciousEvents > 2 || (distractions > 5)
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : activeWarnings.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {suspiciousEvents > 2 || distractions > 5
              ? '⚠️ Suspicious Activity Detected'
              : activeWarnings.length > 0
              ? '⚠️ Attention Required'
              : '✓ Monitoring Normal'}
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ─────────────────────────────────────────── */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <Send className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Submit Exam?</h3>
              <p className="text-sm text-slate-400">
                Are you sure you want to submit?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xl font-extrabold text-emerald-400">{answeredCount}</p>
                <p className="text-[11px] text-slate-400">Answered</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xl font-extrabold text-amber-400">{questions.length - answeredCount}</p>
                <p className="text-[11px] text-slate-400">Unanswered</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowSubmitDialog(false); handleFinalSubmit(false); }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
