import React, { useState } from 'react';

// ── New Exam Flow Pages ──────────────────────────────────────────────────────
import WelcomePage      from './pages/WelcomePage';
import InstructionsPage from './pages/InstructionsPage';
import ExamPage         from './pages/ExamPage';
import ResultsPage      from './pages/ResultsPage';

// ── Legacy Proctoring Dashboard (kept for demo purposes) ─────────────────────
import Navbar               from './components/Navbar';
import LandingPage          from './pages/LandingPage';
import PreExamSetup         from './pages/PreExamSetup';
import MonitoringDashboard  from './pages/MonitoringDashboard';
import AnalyticsDashboard   from './pages/AnalyticsDashboard';

/**
 * Root app – two independent flows:
 *
 *   "exam" flow  →  welcome → instructions → exam → results
 *   "proctor" flow → landing → setup → monitor → analytics  (legacy)
 *
 * The default entry is the exam flow.
 */
export default function App() {
  // ── Exam flow state ────────────────────────────────────────────────────────
  const [examPage,      setExamPage]      = useState('welcome');   // welcome | instructions | exam | results
  const [studentInfo,   setStudentInfo]   = useState(null);
  const [examResult,    setExamResult]    = useState(null);

  // ── Legacy proctoring state (kept unchanged) ──────────────────────────────
  const [activePage,       setActivePage]       = useState('landing');
  const [isDemoMode,       setIsDemoMode]       = useState(false);
  const [activeSessionId,  setActiveSessionId]  = useState('EXAM-2026-001');
  const [isAudioMuted,     setIsAudioMuted]     = useState(false);

  // ── Routing: choose which top-level mode to show ──────────────────────────
  // We show the exam flow by default (examPage !== 'legacy')
  // Switching to 'legacy' shows the original proctoring dashboard.
  const [mode, setMode] = useState('exam'); // 'exam' | 'legacy'

  // ── Exam flow handlers ─────────────────────────────────────────────────────
  const handleWelcomeProceed = (info) => {
    setStudentInfo(info);
    setExamPage('instructions');
  };

  const handleStartExam = () => {
    setExamPage('exam');
  };

  const handleExamSubmit = (result) => {
    setExamResult(result);
    setExamPage('results');
  };

  const handleRetake = () => {
    setStudentInfo(null);
    setExamResult(null);
    setExamPage('welcome');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // ── Exam Flow ─────────────────────────────────────────────────────────────
  if (mode === 'exam') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans">

        {/* Small toggle to switch to legacy proctoring dashboard */}
        {examPage !== 'exam' && (
          <div className="fixed top-2 right-2 z-50">
            <button
              onClick={() => setMode('legacy')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-500 hover:text-slate-300 transition-all backdrop-blur"
            >
              Proctoring Dashboard ↗
            </button>
          </div>
        )}

        {examPage === 'welcome' && (
          <WelcomePage onProceed={handleWelcomeProceed} />
        )}

        {examPage === 'instructions' && (
          <InstructionsPage
            studentInfo={studentInfo}
            onStartExam={handleStartExam}
          />
        )}

        {examPage === 'exam' && (
          <ExamPage
            studentInfo={studentInfo}
            onSubmit={handleExamSubmit}
          />
        )}

        {examPage === 'results' && examResult && (
          <ResultsPage
            result={examResult}
            onRetake={handleRetake}
          />
        )}
      </div>
    );
  }

  // ── Legacy Proctoring Dashboard ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        activeSessionId={activeSessionId}
        isAudioMuted={isAudioMuted}
        setIsAudioMuted={setIsAudioMuted}
      />

      {/* Back-to-exam button */}
      <div className="px-4 pt-2">
        <button
          onClick={() => setMode('exam')}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-500 hover:text-slate-300 transition-all"
        >
          ← Back to Exam
        </button>
      </div>

      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            onStartMonitoring={() => setActivePage('setup')}
            onViewAnalytics={() => setActivePage('analytics')}
          />
        )}
        {activePage === 'setup' && (
          <PreExamSetup
            onProceedToMonitor={() => setActivePage('monitor')}
            isDemoMode={isDemoMode}
          />
        )}
        {activePage === 'monitor' && (
          <MonitoringDashboard
            isDemoMode={isDemoMode}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
          />
        )}
        {activePage === 'analytics' && (
          <AnalyticsDashboard activeSessionId={activeSessionId} />
        )}
      </main>
    </div>
  );
}
