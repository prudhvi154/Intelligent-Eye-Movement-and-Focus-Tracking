const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";

export function createMonitoringWebSocket(sessionId = "EXAM-2026-001", isDemoMode = false) {
  const path = isDemoMode ? `/ws/demo/${sessionId}` : `/ws/monitor/${sessionId}`;
  return new WebSocket(`${WS_BASE_URL}${path}`);
}

export async function startSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/start`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { session_id: `EXAM-2026-${Math.floor(100 + Math.random() * 900)}` };
}

export async function endSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/end/${sessionId}`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: "ended" };
}

export async function fetchAnalytics(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/${sessionId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}
