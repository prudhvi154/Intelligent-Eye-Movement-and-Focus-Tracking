// app.js
// Handles state management, UI controller events, webcam stream, 
// canvas overlay drawing, calibration sequence, and analytics rendering.

import { EyeTracker } from "./tracker.js";

// Global variables
let tracker = null;
let localStream = null;
let currentView = "dashboard"; // dashboard, analytics
let sessionActive = false;
let sessionStartTime = null;
let sessionTimerInterval = null;

// Session records
let sessionLogs = [];
let focusScoresHistory = []; // array of { time: seconds, score: number }
let distractionCategoriesCount = {
  GAZE_AWAY: 0,
  HEAD_TURNED: 0,
  HEAD_TILTED: 0,
  EYES_CLOSED: 0,
  MULTIPLE_FACES: 0,
  FACE_MISSING: 0
};
let totalAlerts = 0;
let suspicionScore = 0;
let currentFocusScore = 100;

// Temporal alert tracking to prevent duplicates and false positives
let alertStates = {
  faceMissingSince: null,
  multipleFacesSince: null,
  gazeAwaySince: null,
  headTurnedSince: null,
  eyesClosedSince: null
};

// Calibration wizard variables
let calibrationActive = false;
let calibrationStep = 0;
const calibrationSteps = ["center", "top_left", "top_right", "bottom_left", "bottom_right"];
const calibrationCoords = {
  center: { x: 50, y: 50 },
  top_left: { x: 10, y: 10 },
  top_right: { x: 90, y: 10 },
  bottom_left: { x: 10, y: 90 },
  bottom_right: { x: 90, y: 90 }
};
let calibrationSamplesCount = 0;
const SAMPLES_REQUIRED = 25;
let calibrationInterval = null;
let currentCalibrationKey = "";

// Chart instances
let focusTimelineChart = null;
let distractionTypeChart = null;

// Simulator state
let currentQuestionIndex = 0;
const quizQuestions = [
  {
    question: "What is the primary function of eye-tracking calibration?",
    options: [
      "To map the unique offset of a user's iris coordinates to physical screen pixels.",
      "To adjust webcam brightness and color correction based on ambient light.",
      "To measure facial symmetry and calculate head height parameters.",
      "To increase the webcam framerate and resolution dynamically."
    ],
    answer: 0
  },
  {
    question: "Which landmark group in the MediaPipe Face Mesh model provides the refined iris position?",
    options: [
      "Indices 0 through 17 (Jawline mapping)",
      "Indices 33 and 263 (Outer eye corners)",
      "Indices 468 through 477 (Refined iris contour points)",
      "Indices 159 and 386 (Eyelid peak thresholds)"
    ],
    answer: 2
  },
  {
    question: "In online examinations, detecting multiple faces is typically classified as:",
    options: [
      "A standard calibration error caused by screen glare.",
      "A high suspicion incident indicating potential third-party assistance.",
      "An lighting optimization recommendation for the user.",
      "An increase in the candidate's average attention span."
    ],
    answer: 1
  },
  {
    question: "What does the abbreviation EAR represent in eye-tracking algorithms?",
    options: [
      "Eye Aspect Ratio, a metric measuring relative eye opening and closure.",
      "Estimated Attention Rating, a neural network classification score.",
      "External Angular Rotation, describing horizontal chin movement.",
      "Eye Active Range, calculating screen boundary margins."
    ],
    answer: 0
  }
];

// Document elements
const dom = {};

// Cache DOM elements
function cacheElements() {
  dom.webcamVideo = document.getElementById("webcam-video");
  dom.trackerCanvas = document.getElementById("tracker-canvas");
  dom.navDashboard = document.getElementById("nav-dashboard");
  dom.navAnalytics = document.getElementById("nav-analytics");
  dom.viewDashboard = document.getElementById("view-dashboard");
  dom.viewAnalytics = document.getElementById("view-analytics");
  
  dom.btnToggleSession = document.getElementById("btn-toggle-session");
  dom.btnCalibrate = document.getElementById("btn-calibrate");
  dom.btnResetCalib = document.getElementById("btn-reset-calib");
  
  dom.timerDisplay = document.getElementById("timer-display");
  dom.timerDot = document.getElementById("timer-dot");
  dom.cameraStatusLabel = document.getElementById("camera-status-label");
  dom.cameraIndicator = document.getElementById("camera-indicator");
  
  // Dynamic stats
  dom.circularProgress = document.getElementById("circular-progress");
  dom.focusScoreNumber = document.getElementById("focus-score-number");
  dom.metricFillGaze = document.getElementById("metric-fill-gaze");
  dom.metricValueGaze = document.getElementById("metric-value-gaze");
  dom.metricFillHead = document.getElementById("metric-fill-head");
  dom.metricValueHead = document.getElementById("metric-value-head");
  dom.metricFillBlink = document.getElementById("metric-fill-blink");
  dom.metricValueBlink = document.getElementById("metric-value-blink");
  dom.statusBadgeText = document.getElementById("status-badge-text");
  
  // Calibration overlay
  dom.calibOverlay = document.getElementById("calib-overlay");
  dom.calibIntro = document.getElementById("calib-intro");
  dom.btnStartCalibSeq = document.getElementById("btn-start-calib-seq");
  dom.calibDot = document.getElementById("calib-dot");
  dom.calibProgressText = document.getElementById("calib-progress-text");
  dom.calibIndicatorLabel = document.getElementById("calib-indicator-label");
  
  // Logs
  dom.logsContainer = document.getElementById("logs-container");
  
  // Simulator
  dom.quizStartState = document.getElementById("quiz-start-state");
  dom.quizContainer = document.getElementById("quiz-container");
  dom.quizQuestionNum = document.getElementById("quiz-question-num");
  dom.quizQuestion = document.getElementById("quiz-question");
  dom.quizOptions = document.getElementById("quiz-options");
  dom.btnQuizNext = document.getElementById("btn-quiz-next");
  
  // Analytics screen
  dom.analFocusRate = document.getElementById("anal-focus-rate");
  dom.analRating = document.getElementById("anal-rating");
  dom.analRatingDesc = document.getElementById("anal-rating-desc");
  dom.analAlertsCount = document.getElementById("anal-alerts-count");
  dom.analTimeCount = document.getElementById("anal-time-count");
  dom.analViolationsList = document.getElementById("anal-violations-list");
  dom.btnRestartFromAnalytics = document.getElementById("btn-restart-from-analytics");
  dom.btnPrintReport = document.getElementById("btn-print-report");
}

// Initialize Application
window.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  setupNavigation();
  setupClickEvents();
  setupQuiz();

  // Create EyeTracker instance
  tracker = new EyeTracker();
  updateCameraIndicator("loading", "Initializing AI Model...");

  try {
    await tracker.initialize((progressMsg) => {
      updateCameraIndicator("loading", progressMsg);
    });
    updateCameraIndicator("disconnected", "Camera Standby (Start Session)");
    dom.btnToggleSession.disabled = false;
    dom.btnCalibrate.disabled = false;
  } catch (err) {
    updateCameraIndicator("error", "Failed loading tracker: " + err.message);
    addLogEntry("System Error", "Could not load artificial intelligence tracker models.", "danger");
  }
});

// Setup click handlers
function setupClickEvents() {
  dom.btnToggleSession.addEventListener("click", toggleSession);
  dom.btnCalibrate.addEventListener("click", openCalibrationWizard);
  dom.btnResetCalib.addEventListener("click", resetCalibration);
  
  dom.btnStartCalibSeq.addEventListener("click", startCalibrationSequence);
  dom.calibDot.addEventListener("mousedown", triggerCalibrationCapture);
  
  dom.btnRestartFromAnalytics.addEventListener("click", () => {
    switchView("dashboard");
    if (!sessionActive) toggleSession();
  });

  dom.btnPrintReport.addEventListener("click", () => {
    window.print();
  });

  const themeSelect = document.getElementById("theme-select");
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      document.documentElement.setAttribute("data-theme", e.target.value);
    });
  }

  const btnManualFlag = document.getElementById("btn-manual-flag");
  if (btnManualFlag) {
    btnManualFlag.addEventListener("click", () => {
      addLogEntry("MANUAL_FLAG", "Proctor logged manual observation flag.", "warning");
    });
  }

  const btnExportCSV = document.getElementById("btn-export-csv");
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => {
      let csv = "data:text/csv;charset=utf-8,Time,Event Type,Description,Category\n";
      sessionLogs.forEach(l => {
        csv += `"${l.time}","${l.type}","${l.message}","${l.category}"\n`;
      });
      const uri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", `Proctor_Audit_Logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showTopToast("CSV EXPORT", "Session audit log downloaded as CSV.", "info");
    });
  }

  const btnToggleSound = document.getElementById("btn-toggle-sound");
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      isSoundMuted = !isSoundMuted;
      btnToggleSound.textContent = isSoundMuted ? "🔕 Muted" : "🔔 Audio Active";
      showTopToast("AUDIO TOGGLE", isSoundMuted ? "Alert sound chimes muted." : "Alert sound chimes active.", "info");
    });
  }
}

// Navigation Tabs
function setupNavigation() {
  dom.navDashboard.addEventListener("click", () => switchView("dashboard"));
  dom.navAnalytics.addEventListener("click", () => {
    if (focusScoresHistory.length > 0) {
      switchView("analytics");
    } else {
      alert("Please record some study session data first by running a test session.");
    }
  });
}

function switchView(viewName) {
  currentView = viewName;
  if (viewName === "dashboard") {
    dom.navDashboard.classList.add("active");
    dom.navAnalytics.classList.remove("active");
    dom.viewDashboard.classList.add("active");
    dom.viewAnalytics.classList.remove("active");
  } else if (viewName === "analytics") {
    dom.navDashboard.classList.remove("active");
    dom.navAnalytics.classList.add("active");
    dom.viewDashboard.classList.remove("active");
    dom.viewAnalytics.classList.add("active");
    
    // Load graphs and summaries
    renderAnalyticsDashboard();
  }
}

// Camera Indicator Helper
function updateCameraIndicator(state, message) {
  dom.cameraStatusLabel.textContent = message;
  dom.cameraIndicator.className = "cam-indicator-dot";
  
  if (state === "loading") {
    dom.cameraIndicator.classList.add("active");
    dom.cameraIndicator.style.backgroundColor = "var(--amber-500)";
  } else if (state === "active") {
    dom.cameraIndicator.classList.add("active");
    dom.cameraIndicator.style.backgroundColor = "var(--emerald-500)";
  } else if (state === "error") {
    dom.cameraIndicator.classList.add("error");
    dom.cameraIndicator.style.backgroundColor = "var(--crimson-500)";
  } else {
    dom.cameraIndicator.classList.remove("active");
    dom.cameraIndicator.style.backgroundColor = "var(--text-dark)";
  }
}

// Session Toggle Start/Stop
async function toggleSession() {
  if (sessionActive) {
    // End session
    stopSession();
  } else {
    // Start session
    await startSession();
  }
}

async function startSession() {
  try {
    updateCameraIndicator("loading", "Requesting camera stream...");
    addLogEntry("System Action", "Requesting secure camera permissions...", "info");

    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 30 }
    });

    dom.webcamVideo.srcObject = localStream;
    dom.webcamVideo.play();
    
    updateCameraIndicator("active", "Webcam Connected");
    addLogEntry("System Info", "Webcam access secured. Starting detection engine...", "info");
    
    // Start tracker
    tracker.startTracking(dom.webcamVideo, onTrackingFrame, (err) => {
      console.error(err);
      addLogEntry("Tracker Error", err.message, "danger");
    });

    // Start Session state
    sessionActive = true;
    sessionStartTime = new Date();
    dom.btnToggleSession.textContent = "End Session";
    dom.btnToggleSession.className = "btn btn-danger";
    dom.timerDot.classList.add("active");
    
    // Reset indicators
    resetTrackingMetrics();
    
    // Show quiz container
    dom.quizStartState.style.display = "none";
    dom.quizContainer.style.display = "flex";
    resetQuizState();

    // Start timer interval
    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    
    // Check if calibrated
    if (tracker.isCalibrated) {
      addLogEntry("System Info", "Eye tracking calibration profile loaded successfully.", "info");
    } else {
      addLogEntry("System Warning", "Running with default calibration. Gaze coordinates may be offset.", "warning");
    }
  } catch (err) {
    console.error("Camera access failed:", err);
    updateCameraIndicator("error", "Webcam Access Failed");
    addLogEntry("System Error", "Failed to access webcam. Check camera connection.", "danger");
  }
}

function stopSession() {
  // Stop camera tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  // Stop tracker loop
  tracker.stopTracking();
  
  // Clear timer
  clearInterval(sessionTimerInterval);
  dom.timerDot.classList.remove("active");
  
  sessionActive = false;
  dom.btnToggleSession.textContent = "Start Session";
  dom.btnToggleSession.className = "btn btn-primary";
  updateCameraIndicator("disconnected", "Camera Standby (Start Session)");
  
  addLogEntry("System Action", "Session ended. Compiling report...", "info");
  
  // Clear canvas overlay
  const ctx = dom.trackerCanvas.getContext("2d");
  ctx.clearRect(0, 0, dom.trackerCanvas.width, dom.trackerCanvas.height);
  
  // Switch to report
  switchView("analytics");
}

function resetTrackingMetrics() {
  focusScoresHistory = [];
  sessionLogs = [];
  dom.logsContainer.innerHTML = "";
  distractionCategoriesCount = {
    GAZE_AWAY: 0,
    HEAD_TURNED: 0,
    HEAD_TILTED: 0,
    EYES_CLOSED: 0,
    MULTIPLE_FACES: 0,
    FACE_MISSING: 0
  };
  totalAlerts = 0;
  suspicionScore = 0;
  currentFocusScore = 100;
  alertStates = {
    faceMissingSince: null,
    multipleFacesSince: null,
    gazeAwaySince: null,
    headTurnedSince: null,
    eyesClosedSince: null
  };
  
  updateFocusScoreCircle(100);
}

// Timer update
function updateSessionTimer() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");
  dom.timerDisplay.textContent = `${minutes}:${seconds}`;
  
  // Push focus score to timeline log every second
  if (sessionActive) {
    focusScoresHistory.push({
      time: elapsed,
      score: Math.round(currentFocusScore)
    });
  }
}

// Real-time circular metric update
function updateFocusScoreCircle(score) {
  dom.circularProgress.style.setProperty("--progress", score);
  dom.focusScoreNumber.textContent = Math.round(score);
  
  // Adjust colors dynamically based on score
  if (score >= 80) {
    dom.circularProgress.style.backgroundImage = `radial-gradient(closest-side, var(--bg-slate) 82%, transparent 83% 100%), conic-gradient(var(--emerald-500) calc(var(--progress) * 1%), var(--border-color) 0)`;
  } else if (score >= 50) {
    dom.circularProgress.style.backgroundImage = `radial-gradient(closest-side, var(--bg-slate) 82%, transparent 83% 100%), conic-gradient(var(--amber-500) calc(var(--progress) * 1%), var(--border-color) 0)`;
  } else {
    dom.circularProgress.style.backgroundImage = `radial-gradient(closest-side, var(--bg-slate) 82%, transparent 83% 100%), conic-gradient(var(--crimson-500) calc(var(--progress) * 1%), var(--border-color) 0)`;
  }
}

// Audio Alert Sound Chime
let isSoundMuted = false;

function playAudioWarningChime() {
  if (isSoundMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

// Top Floating Toast Warning Popup
function showTopToast(type, message, category = "warn") {
  const container = document.getElementById("top-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-notification ${category}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-badge">${type.replace(/_/g, ' ')}</span>
      <span class="toast-text">${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
  });

  container.appendChild(toast);

  if (category === "danger" || category === "warn" || category === "warning") {
    playAudioWarningChime();
  }

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4500);
}

function updateIntegrityMeter() {
  const logBadge = document.getElementById("log-counter-badge");
  if (logBadge) logBadge.textContent = `${sessionLogs.length} EVENTS`;

  const integrityPct = document.getElementById("integrity-percentage");
  const integrityFill = document.getElementById("integrity-bar-fill");
  
  if (integrityPct && integrityFill) {
    const riskLevel = Math.max(0, Math.min(100, Math.round(currentFocusScore)));
    integrityFill.style.width = `${riskLevel}%`;
    
    if (riskLevel >= 80) {
      integrityPct.textContent = `${riskLevel}% CLEAN`;
      integrityPct.style.color = "var(--emerald-400)";
      integrityFill.style.background = "linear-gradient(90deg, var(--emerald-400), var(--cyan-500))";
    } else if (riskLevel >= 50) {
      integrityPct.textContent = `${riskLevel}% MODERATE RISK`;
      integrityPct.style.color = "var(--amber-400)";
      integrityFill.style.background = "linear-gradient(90deg, var(--amber-400), var(--crimson-400))";
    } else {
      integrityPct.textContent = `${riskLevel}% HIGH SUSPICION`;
      integrityPct.style.color = "var(--crimson-400)";
      integrityFill.style.background = "linear-gradient(90deg, var(--crimson-400), var(--crimson-500))";
    }
  }
}

// Log writer
function addLogEntry(type, message, category = "info") {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Record internally
  sessionLogs.push({ time: timestamp, type, message, category });
  
  // Show top floating toast warning popup
  if (category === "danger" || category === "warn" || category === "warning") {
    showTopToast(type, message, category);
  }

  updateIntegrityMeter();
  
  if (!dom.logsContainer) return;

  // Clear "empty" state if present
  const emptyElement = dom.logsContainer.querySelector(".logs-empty");
  if (emptyElement) {
    dom.logsContainer.innerHTML = "";
  }

  const item = document.createElement("div");
  item.className = `log-item ${category}`;
  
  // Icon picker
  let iconSvg = "";
  if (category === "danger") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
  } else if (category === "warning") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.008v.008H12V15.75z" /></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02-.086.041a.25.25 0 00-.115.1l-.115.229c-.141.282-.51.282-.651 0l-.115-.229a.25.25 0 00-.115-.1l-.086-.041a.75.75 0 011.085-1.085l.04.02zm1.25 7.75a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" /></svg>`;
  }

  item.innerHTML = `
    <div class="log-icon-wrapper">${iconSvg}</div>
    <div class="log-details">
      <span class="log-time">${timestamp}</span>
      <span class="log-msg"><strong>[${type}]</strong> ${message}</span>
    </div>
  `;
  
  dom.logsContainer.insertBefore(item, dom.logsContainer.firstChild);
  
  // Caps at 50 logs visibly
  if (dom.logsContainer.children.length > 50) {
    dom.logsContainer.removeChild(dom.logsContainer.lastChild);
  }
}

// CORE TRACKING FRAME PROCESSING
function onTrackingFrame(data) {
  // Sync canvas size
  if (dom.trackerCanvas.width !== dom.webcamVideo.videoWidth) {
    dom.trackerCanvas.width = dom.webcamVideo.videoWidth;
    dom.trackerCanvas.height = dom.webcamVideo.videoHeight;
  }

  const ctx = dom.trackerCanvas.getContext("2d");
  ctx.clearRect(0, 0, dom.trackerCanvas.width, dom.trackerCanvas.height);

  const now = performance.now();

  // 1. Process Face Missing Warning
  if (data.numFaces === 0) {
    if (!alertStates.faceMissingSince) {
      alertStates.faceMissingSince = now;
    } else if (now - alertStates.faceMissingSince > tracker.thresholds.blinkDurationMs) {
      triggerDistractionAlert("FACE_MISSING", "Candidate stepped away or camera blocked.", "danger");
      alertStates.faceMissingSince = now; // reset interval
    }
    
    // Decay focus score rapidly
    currentFocusScore = Math.max(0, currentFocusScore - 1.5);
    updateFocusScoreCircle(currentFocusScore);
    updateRealtimeHUD(null);
    return;
  } else {
    alertStates.faceMissingSince = null;
  }

  const face = data.faces[0]; // Primary face
  
  // 2. Process Multiple Faces Warning
  if (data.numFaces > 1) {
    if (!alertStates.multipleFacesSince) {
      alertStates.multipleFacesSince = now;
    } else if (now - alertStates.multipleFacesSince > 1000) {
      triggerDistractionAlert("MULTIPLE_FACES", "Second individual detected in screen range.", "danger");
      alertStates.multipleFacesSince = now;
    }
    currentFocusScore = Math.max(0, currentFocusScore - 2.5);
  } else {
    alertStates.multipleFacesSince = null;
  }

  // Draw face contours
  drawFaceMesh(ctx, face.landmarks);

  // 3. Process Gaze Off-Screen Alert
  const isOffScreen = face.gaze.screenX < -0.1 || face.gaze.screenX > 1.1 || face.gaze.screenY < -0.1 || face.gaze.screenY > 1.1;
  if (isOffScreen && face.focus.code === "GAZE_AWAY") {
    if (!alertStates.gazeAwaySince) {
      alertStates.gazeAwaySince = now;
    } else if (now - alertStates.gazeAwaySince > 1200) {
      triggerDistractionAlert("GAZE_AWAY", `Looking away off-screen: ${face.focus.reason}`, "warning");
      alertStates.gazeAwaySince = now;
    }
  } else {
    alertStates.gazeAwaySince = null;
  }

  // 4. Process Head Turn Alert
  if (face.focus.code === "HEAD_TURNED" || face.focus.code === "HEAD_TILTED") {
    if (!alertStates.headTurnedSince) {
      alertStates.headTurnedSince = now;
    } else if (now - alertStates.headTurnedSince > 1200) {
      triggerDistractionAlert(face.focus.code, `Head rotation detected: ${face.focus.reason}`, "warning");
      alertStates.headTurnedSince = now;
    }
  } else {
    alertStates.headTurnedSince = null;
  }

  // 5. Process Drowsiness / Eyes Closed
  if (face.blink.closed) {
    if (!alertStates.eyesClosedSince) {
      alertStates.eyesClosedSince = now;
    } else if (now - alertStates.eyesClosedSince > tracker.thresholds.blinkDurationMs) {
      triggerDistractionAlert("EYES_CLOSED", "Eyes closed or looking straight down for too long.", "danger");
      alertStates.eyesClosedSince = now;
    }
  } else {
    alertStates.eyesClosedSince = null;
  }

  // Calculate real-time instantaneous focus
  let targetFocus = face.focus.focused ? 100 : 0;
  
  // If multiple faces, hard cap focus score to suspicious
  if (data.numFaces > 1) {
    targetFocus = Math.min(targetFocus, 30);
  }

  // Exponential filter smoothing
  currentFocusScore = currentFocusScore * 0.95 + targetFocus * 0.05;
  updateFocusScoreCircle(currentFocusScore);

  // Update HUD
  updateRealtimeHUD(face);

  // Draw Gaze pointer (high-tech target indicator)
  drawGazeIndicator(ctx, face.gaze.screenX, face.gaze.screenY, face.focus.focused);
}

// Trigger alert log and update metrics
function triggerDistractionAlert(code, message, severity) {
  if (!sessionActive) return;
  
  totalAlerts++;
  distractionCategoriesCount[code]++;
  
  let suspicionDelta = 5;
  if (code === "MULTIPLE_FACES") suspicionDelta = 25;
  else if (code === "FACE_MISSING") suspicionDelta = 15;
  else if (code === "HEAD_TURNED") suspicionDelta = 8;
  else if (code === "EYES_CLOSED") suspicionDelta = 10;
  
  suspicionScore = Math.min(100, suspicionScore + suspicionDelta);
  
  addLogEntry(code.replace("_", " "), message, severity);

  // Sound cue or screen border flash could go here. Let's make it alert visibly.
  const videoWrapper = dom.webcamVideo.parentElement;
  videoWrapper.style.boxShadow = `0 0 25px ${severity === "danger" ? "var(--crimson-500)" : "var(--amber-500)"}`;
  videoWrapper.style.borderColor = severity === "danger" ? "var(--crimson-500)" : "var(--amber-500)";
  
  setTimeout(() => {
    if (sessionActive) {
      videoWrapper.style.boxShadow = suspicionScore > 60 ? "0 0 25px var(--crimson-glow)" : "inset 0 0 20px rgba(0, 0, 0, 0.8)";
      videoWrapper.style.borderColor = suspicionScore > 60 ? "var(--crimson-500)" : "var(--border-color)";
    } else {
      videoWrapper.style.boxShadow = "none";
      videoWrapper.style.borderColor = "var(--border-color)";
    }
  }, 1000);
}

// Draw gaze vector point on camera overlay
function drawGazeIndicator(ctx, screenX, screenY, isFocused) {
  // Convert screen coordinates to canvas pixels
  // screenX is 0 to 1, where 0 is left, 1 is right. Canvas is mirrored horizontally, so match it.
  const px = screenX * ctx.canvas.width;
  const py = screenY * ctx.canvas.height;
  
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = isFocused ? "var(--cyan-500)" : "var(--crimson-500)";
  
  // Draw dotted outer ring
  ctx.strokeStyle = isFocused ? "rgba(6, 182, 212, 0.6)" : "rgba(239, 68, 68, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 14, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw inner dot
  ctx.fillStyle = isFocused ? "var(--cyan-400)" : "var(--crimson-400)";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.restore();
}

// Draw simplified eye and facial loops on canvas
function drawFaceMesh(ctx, landmarks) {
  ctx.save();
  ctx.lineWidth = 1;
  
  // Set glow effect
  ctx.shadowBlur = 4;
  ctx.shadowColor = "rgba(6, 182, 212, 0.4)";
  ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
  
  const drawLoop = (indices) => {
    ctx.beginPath();
    for (let i = 0; i < indices.length; i++) {
      const pt = landmarks[indices[i]];
      if (!pt) continue;
      // Map normal coords to canvas pixels
      const x = pt.x * ctx.canvas.width;
      const y = pt.y * ctx.canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawPath = (indices) => {
    ctx.beginPath();
    for (let i = 0; i < indices.length; i++) {
      const pt = landmarks[indices[i]];
      if (!pt) continue;
      const x = pt.x * ctx.canvas.width;
      const y = pt.y * ctx.canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  // Right Eye Contour
  drawLoop([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]);
  // Left Eye Contour
  drawLoop([362, 382, 381, 380, 374, 373, 372, 390, 263, 466, 388, 387, 386, 385, 384, 398]);

  // Eyebrows
  drawPath([46, 53, 52, 65, 55]);
  drawPath([276, 283, 282, 295, 285]);
  
  // Nose Bridge & Base
  drawPath([8, 168, 6, 197, 195, 5]);
  drawPath([98, 97, 2, 327, 326]);
  
  // Lips Outer
  drawLoop([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 95]);

  // Irises
  ctx.strokeStyle = "var(--cyan-400)";
  ctx.lineWidth = 1.5;
  // Right Iris center is 468, draw a small circle enclosing the 4 iris edge landmarks
  const rIris = landmarks[468];
  if (rIris) {
    ctx.beginPath();
    ctx.arc(rIris.x * ctx.canvas.width, rIris.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
  const lIris = landmarks[473];
  if (lIris) {
    ctx.beginPath();
    ctx.arc(lIris.x * ctx.canvas.width, lIris.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
  ctx.restore();
}

// Update Realtime HUD widgets
function updateRealtimeHUD(face) {
  if (!face) {
    dom.statusBadgeText.textContent = "NO FACE DETECTED";
    dom.statusBadgeText.parentElement.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
    dom.statusBadgeText.parentElement.style.borderColor = "var(--crimson-500)";
    dom.statusBadgeText.parentElement.style.color = "var(--crimson-400)";
    
    dom.metricFillGaze.style.width = "0%";
    dom.metricValueGaze.textContent = "0.00";
    dom.metricFillHead.style.width = "0%";
    dom.metricValueHead.textContent = "0.00";
    dom.metricFillBlink.style.width = "0%";
    dom.metricValueBlink.textContent = "0%";
    return;
  }

  // Gaze Status Indicator
  dom.statusBadgeText.textContent = face.focus.status.toUpperCase();
  const focused = face.focus.focused;
  
  dom.statusBadgeText.parentElement.style.backgroundColor = focused ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)";
  dom.statusBadgeText.parentElement.style.borderColor = focused ? "var(--emerald-500)" : "var(--amber-500)";
  dom.statusBadgeText.parentElement.style.color = focused ? "var(--emerald-400)" : "var(--amber-400)";

  if (face.focus.code === "MULTIPLE_FACES") {
    dom.statusBadgeText.parentElement.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
    dom.statusBadgeText.parentElement.style.borderColor = "var(--crimson-500)";
    dom.statusBadgeText.parentElement.style.color = "var(--crimson-400)";
  }

  // 1. Gaze Deviation Bar
  // raw screenX, screenY delta from center (0.5, 0.5)
  const gazeDelta = Math.sqrt(Math.pow(face.gaze.screenX - 0.5, 2) + Math.pow(face.gaze.screenY - 0.5, 2));
  // Map delta of 0-0.7 to 0-100%
  const gazeDevPercent = Math.min(100, Math.round((gazeDelta / 0.6) * 100));
  dom.metricFillGaze.style.width = `${gazeDevPercent}%`;
  dom.metricValueGaze.textContent = gazeDelta.toFixed(2);
  
  if (gazeDevPercent > 70) dom.metricFillGaze.style.backgroundColor = "var(--crimson-500)";
  else if (gazeDevPercent > 40) dom.metricFillGaze.style.backgroundColor = "var(--amber-500)";
  else dom.metricFillGaze.style.backgroundColor = "var(--cyan-500)";

  // 2. Head Orientation Bar
  // combine yaw and pitch absolute offsets
  const headOffset = Math.sqrt(Math.pow(face.headPose.yaw, 2) + Math.pow(face.headPose.pitch, 2));
  const headDevPercent = Math.min(100, Math.round((headOffset / 0.4) * 100));
  dom.metricFillHead.style.width = `${headDevPercent}%`;
  dom.metricValueHead.textContent = headOffset.toFixed(2);
  
  if (headDevPercent > 70) dom.metricFillHead.style.backgroundColor = "var(--crimson-500)";
  else if (headDevPercent > 45) dom.metricFillHead.style.backgroundColor = "var(--amber-500)";
  else dom.metricFillHead.style.backgroundColor = "var(--cyan-500)";

  // 3. Eye Aspect Ratio / Blink Bar
  const blinkPercent = Math.round(face.blink.average * 100);
  dom.metricFillBlink.style.width = `${blinkPercent}%`;
  dom.metricValueBlink.textContent = `${blinkPercent}%`;
  
  if (face.blink.closed) dom.metricFillBlink.style.backgroundColor = "var(--crimson-500)";
  else if (blinkPercent > 45) dom.metricFillBlink.style.backgroundColor = "var(--amber-500)";
  else dom.metricFillBlink.style.backgroundColor = "var(--cyan-500)";
}

// CALIBRATION WIZARD CONTROLLER
function openCalibrationWizard() {
  if (sessionActive) {
    alert("Please stop the active session before starting calibration.");
    return;
  }
  
  calibrationActive = true;
  dom.calibOverlay.classList.add("active");
  dom.calibIntro.style.display = "flex";
  dom.calibDot.classList.remove("active");
  dom.calibProgressText.style.display = "none";
  
  // Enable camera stream inside calibration backdrop
  initializeCalibrationCamera();
}

async function initializeCalibrationCamera() {
  try {
    updateCameraIndicator("loading", "Starting calibration view...");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 30 }
    });
    dom.webcamVideo.srcObject = localStream;
    dom.webcamVideo.play();
    
    tracker.startTracking(dom.webcamVideo, (data) => {
      // Draw facial contours on canvas to guide user positioning
      if (dom.trackerCanvas.width !== dom.webcamVideo.videoWidth) {
        dom.trackerCanvas.width = dom.webcamVideo.videoWidth;
        dom.trackerCanvas.height = dom.webcamVideo.videoHeight;
      }
      const ctx = dom.trackerCanvas.getContext("2d");
      ctx.clearRect(0, 0, dom.trackerCanvas.width, dom.trackerCanvas.height);
      if (data.numFaces > 0) {
        drawFaceMesh(ctx, data.faces[0].landmarks);
      }
    });
    
    updateCameraIndicator("active", "Calibration stream ready");
  } catch (err) {
    console.error("Calibration camera startup failed:", err);
    alert("Could not start camera for calibration. Check camera permission settings.");
    closeCalibrationWizard();
  }
}

function startCalibrationSequence() {
  dom.calibIntro.style.display = "none";
  dom.calibDot.classList.add("active");
  dom.calibProgressText.style.display = "block";
  tracker.resetCalibration();
  
  calibrationStep = 0;
  runNextCalibrationPoint();
}

function runNextCalibrationPoint() {
  if (calibrationStep >= calibrationSteps.length) {
    // Finished all calibration points
    finishCalibration();
    return;
  }

  currentCalibrationKey = calibrationSteps[calibrationStep];
  const pos = calibrationCoords[currentCalibrationKey];
  
  // Position the dot
  dom.calibDot.style.left = `${pos.x}vw`;
  dom.calibDot.style.top = `${pos.y}vh`;
  
  calibrationSamplesCount = 0;
  dom.calibDot.classList.remove("clicking");
  dom.calibProgressText.textContent = `Point ${calibrationStep + 1} of 5: Look directly at the blue circle, then click on it.`;
}

function triggerCalibrationCapture() {
  if (!calibrationActive || calibrationSamplesCount > 0) return;
  
  dom.calibDot.classList.add("clicking");
  let samplesCollected = 0;
  
  // Clear any existing interval
  clearInterval(calibrationInterval);
  
  calibrationInterval = setInterval(() => {
    // Capture tracking details from the running stream
    // Since tracker is running frame-by-frame, we grab the current processed frame data
    const timestamp = performance.now();
    try {
      if (dom.webcamVideo.readyState >= 2) {
        const results = tracker.faceLandmarker.detectForVideo(dom.webcamVideo, timestamp);
        const data = tracker.processFaceResults(results);
        
        if (data.numFaces > 0) {
          tracker.recordCalibrationSample(currentCalibrationKey, data.faces[0]);
          samplesCollected++;
          dom.calibProgressText.textContent = `Calibrating ${currentCalibrationKey.replace("_", " ")}: ${Math.round((samplesCollected/SAMPLES_REQUIRED)*100)}%`;
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    if (samplesCollected >= SAMPLES_REQUIRED) {
      clearInterval(calibrationInterval);
      calibrationStep++;
      
      // Mini audio beep or haptic success feel
      dom.calibDot.classList.remove("clicking");
      setTimeout(runNextCalibrationPoint, 300);
    }
  }, 40);
}

function finishCalibration() {
  const success = tracker.compileCalibration();
  
  if (success) {
    dom.calibDot.classList.remove("active");
    dom.calibProgressText.textContent = "Calibration Successful! Closing in 1.5 seconds...";
    dom.btnCalibrate.textContent = "Calibrated";
    dom.btnCalibrate.classList.remove("btn-secondary");
    dom.btnCalibrate.classList.add("btn-primary");
    dom.btnCalibrate.style.border = "1px solid var(--emerald-500)";
  } else {
    alert("Calibration failed. Please look directly at each dot and hold still.");
    tracker.resetCalibration();
  }
  
  setTimeout(closeCalibrationWizard, 1500);
}

function closeCalibrationWizard() {
  clearInterval(calibrationInterval);
  calibrationActive = false;
  
  // Stop webcam tracks if session is not active
  if (localStream && !sessionActive) {
    localStream.getTracks().forEach(track => track.stop());
    tracker.stopTracking();
  }
  
  dom.calibOverlay.classList.remove("active");
  updateCameraIndicator("disconnected", "Camera Standby (Start Session)");
}

function resetCalibration() {
  tracker.resetCalibration();
  dom.btnCalibrate.textContent = "Calibrate Eye Tracker";
  dom.btnCalibrate.className = "btn btn-secondary";
  dom.btnCalibrate.style.border = "";
  addLogEntry("System Info", "Eye tracker calibration profile deleted. Reverting to default bounds.", "info");
}

// SIMULATOR QUIZ CONTROLLER
function setupQuiz() {
  dom.btnQuizNext.addEventListener("click", () => {
    const selected = dom.quizOptions.querySelector(".quiz-option.selected");
    if (!selected) {
      alert("Please select an answer choice before moving to the next question.");
      return;
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      renderQuizQuestion();
    } else {
      // Quiz complete!
      dom.quizContainer.innerHTML = `
        <div class="sim-start-state" style="max-width: 100%; text-align: center;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color: var(--emerald-500);">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <h3>Quiz Simulator Completed</h3>
          <p>You have finished the simulated proctor test. You can now press <strong>End Session</strong> on the top right to analyze your eye-movement history, focus scores, and distraction warnings in the Analytics report.</p>
        </div>
      `;
    }
  });
}

function resetQuizState() {
  currentQuestionIndex = 0;
  dom.quizContainer.innerHTML = `
    <div class="quiz-header">
      <span>Question <span id="quiz-question-num">1</span> of 4</span>
      <span>Topic: AI & Proctoring Tech</span>
    </div>
    <h3 class="quiz-question" id="quiz-question"></h3>
    <div class="quiz-options" id="quiz-options"></div>
    <div class="quiz-footer">
      <button class="btn btn-primary" id="btn-quiz-next">Next Question</button>
    </div>
  `;
  // Re-cache dynamic quiz elements
  dom.quizQuestionNum = document.getElementById("quiz-question-num");
  dom.quizQuestion = document.getElementById("quiz-question");
  dom.quizOptions = document.getElementById("quiz-options");
  dom.btnQuizNext = document.getElementById("btn-quiz-next");
  setupQuiz();
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = quizQuestions[currentQuestionIndex];
  dom.quizQuestionNum.textContent = currentQuestionIndex + 1;
  dom.quizQuestion.textContent = q.question;
  dom.quizOptions.innerHTML = "";
  
  const alphabet = ["A", "B", "C", "D"];
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("div");
    btn.className = "quiz-option";
    btn.innerHTML = `
      <div class="option-letter">${alphabet[idx]}</div>
      <span>${opt}</span>
    `;
    btn.addEventListener("click", () => {
      // Clear selections
      dom.quizOptions.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
      btn.classList.add("selected");
    });
    dom.quizOptions.appendChild(btn);
  });
}

// ANALYTICS SCREEN RENDERING
function renderAnalyticsDashboard() {
  if (focusScoresHistory.length === 0) return;

  // Calculate metrics
  const avgFocus = focusScoresHistory.reduce((sum, item) => sum + item.score, 0) / focusScoresHistory.length;
  dom.analFocusRate.textContent = `${Math.round(avgFocus)}%`;
  
  // Total alerts count
  dom.analAlertsCount.textContent = totalAlerts;
  
  // Total duration time
  const elapsedSeconds = focusScoresHistory[focusScoresHistory.length - 1].time;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  dom.analTimeCount.textContent = `${minutes}m ${seconds}s`;

  // Focus rating classification
  let ratingText = "EXCELLENT FOCUS";
  let ratingDesc = "Exceptional eye alignment and posture. Zero cheating indications.";
  dom.analRating.className = "summary-value success";
  
  if (suspicionScore > 65) {
    ratingText = "HIGH SUSPICION";
    ratingDesc = "Multiple proctor violations and off-screen gazes flagged. Cheating likely.";
    dom.analRating.className = "summary-value danger";
  } else if (suspicionScore > 35) {
    ratingText = "SUSPICIOUS";
    ratingDesc = "Regular gaze shifts and movements away from the active screen.";
    dom.analRating.className = "summary-value warning";
  } else if (avgFocus < 60) {
    ratingText = "LOW ATTENTION";
    ratingDesc = "Frequent blinking, eyes closed, or fatigue indicated during session.";
    dom.analRating.className = "summary-value warning";
  } else if (avgFocus < 80) {
    ratingText = "AVERAGE FOCUS";
    ratingDesc = "Normal gaze movements. Minimal warnings triggered.";
    dom.analRating.className = "summary-value success";
  }
  
  dom.analRating.textContent = ratingText;
  dom.analRatingDesc.textContent = ratingDesc;

  // Render violations list
  renderViolationsList();

  // Draw Chart.js Graphs
  setTimeout(() => {
    drawTimelineChart(avgFocus);
    drawCategoryChart();
  }, 100);
}

function renderViolationsList() {
  dom.analViolationsList.innerHTML = "";
  
  const violationsMap = [
    { code: "FACE_MISSING", label: "Face Out of Frame", desc: "No facial presence detected in lens." },
    { code: "MULTIPLE_FACES", label: "Multiple People Detected", desc: "More than one face tracked by model." },
    { code: "GAZE_AWAY", label: "Off-screen Eye Drift", desc: "Iris gaze ratio out of calibrated bounds." },
    { code: "HEAD_TURNED", label: "Lateral Head Rotation", desc: "Head yaw angle turned past limit." },
    { code: "HEAD_TILTED", label: "Vertical Head Tilt", desc: "Head pitch angle tilted past limit." },
    { code: "EYES_CLOSED", label: "Prolonged Eye Closure", desc: "Eyelid closure representing drowsiness." }
  ];
  
  let totalViolationsRendered = 0;

  violationsMap.forEach(v => {
    const count = distractionCategoriesCount[v.code] || 0;
    if (count > 0) {
      totalViolationsRendered++;
      const row = document.createElement("div");
      row.className = "violation-row";
      row.innerHTML = `
        <div class="violation-name">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <strong>${v.label}</strong>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 400; margin-top: 0.1rem;">${v.desc}</div>
          </div>
        </div>
        <div class="violation-count">${count}</div>
      `;
      dom.analViolationsList.appendChild(row);
    }
  });

  if (totalViolationsRendered === 0) {
    dom.analViolationsList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0; font-style: italic;">
        No major exam rules violated. Clear session profile!
      </div>
    `;
  }
}

// Chart.js - Timeline Line Chart
function drawTimelineChart(averageScore) {
  if (focusTimelineChart) {
    focusTimelineChart.destroy();
  }
  
  const ctx = document.getElementById("timeline-chart").getContext("2d");
  
  const labels = focusScoresHistory.map(h => `${h.time}s`);
  const data = focusScoresHistory.map(h => h.score);

  // Gradient background for focus timeline
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

  focusTimelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Focus Score %",
          data: data,
          borderColor: "#22d3ee",
          borderWidth: 2,
          pointRadius: labels.length > 60 ? 0 : 2,
          pointBackgroundColor: "#06b6d4",
          backgroundColor: gradient,
          fill: true,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#94a3b8", font: { size: 10 } }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#94a3b8", font: { size: 10 } }
        }
      }
    }
  });
}

// Chart.js - Distraction categories donut chart
function drawCategoryChart() {
  if (distractionTypeChart) {
    distractionTypeChart.destroy();
  }
  
  const ctx = document.getElementById("category-chart").getContext("2d");
  
  const labels = ["Gaze Away", "Head Turned", "Head Tilted", "Eyes Closed", "Multiple Faces", "Face Missing"];
  const data = [
    distractionCategoriesCount.GAZE_AWAY,
    distractionCategoriesCount.HEAD_TURNED,
    distractionCategoriesCount.HEAD_TILTED,
    distractionCategoriesCount.EYES_CLOSED,
    distractionCategoriesCount.MULTIPLE_FACES,
    distractionCategoriesCount.FACE_MISSING
  ];

  // Only display non-zero events if possible, else default empty structure
  const totalVal = data.reduce((s, val) => s + val, 0);
  
  if (totalVal === 0) {
    // Empty data template
    distractionTypeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["No Alerts"],
        datasets: [{
          data: [1],
          backgroundColor: ["rgba(255,255,255,0.05)"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "right", labels: { color: "#94a3b8", boxWidth: 12 } }
        }
      }
    });
    return;
  }

  distractionTypeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels.filter((l, i) => data[i] > 0),
      datasets: [
        {
          data: data.filter(d => d > 0),
          backgroundColor: [
            "#38bdf8", // Gaze Away (Sky)
            "#f59e0b", // Head Turned (Amber)
            "#fb923c", // Head Tilted (Orange)
            "#f87171", // Eyes Closed (Red)
            "#ef4444", // Multiple Faces (Crimson)
            "#ec4899"  // Face Missing (Pink)
          ],
          borderColor: "rgba(15, 23, 42, 0.8)",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            color: "#94a3b8",
            font: { size: 10 },
            boxWidth: 10
          }
        }
      },
      cutout: "70%"
    }
  });
}
