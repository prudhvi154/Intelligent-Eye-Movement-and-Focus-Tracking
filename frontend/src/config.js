// ─── Exam Configuration ───────────────────────────────────────────────────────
export const EXAM_DURATION_MINUTES = 10;

// ─── Eye-Tracking / Monitoring Thresholds ─────────────────────────────────────
export const DISTRACTION_THRESHOLD_SECONDS = 2.0;   // seconds looking away before flagging
export const SUSPICIOUS_THRESHOLD_SECONDS  = 4.0;   // seconds for suspicious event
export const FACE_MISSING_ALERT_DELAY_MS   = 1500;  // ms before "no face" alert triggers

// ─── Focus Score Smoothing ────────────────────────────────────────────────────
// score = ALPHA * prev_score + (1-ALPHA) * current_score
export const FOCUS_SMOOTH_ALPHA = 0.82;

// ─── Focus Status Thresholds ──────────────────────────────────────────────────
export const FOCUS_HIGHLY_FOCUSED  = 80;
export const FOCUS_FOCUSED         = 60;
export const FOCUS_DISTRACTED      = 40;
// Below FOCUS_DISTRACTED → HIGHLY DISTRACTED

// ─── Gaze Classification ──────────────────────────────────────────────────────
export const GAZE_SCREEN_X_LEFT    = 0.38;
export const GAZE_SCREEN_X_RIGHT   = 0.62;
export const GAZE_SCREEN_Y_UP      = 0.38;
export const GAZE_SCREEN_Y_DOWN    = 0.62;
