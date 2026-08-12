import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import PreExamSetup from './pages/PreExamSetup';
import MonitoringDashboard from './pages/MonitoringDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

export default function App() {
  const [activePage, setActivePage] = useState('landing'); // landing, setup, monitor, analytics
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('EXAM-2026-001');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

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
          <AnalyticsDashboard
            activeSessionId={activeSessionId}
          />
        )}
      </main>
    </div>
  );
}
