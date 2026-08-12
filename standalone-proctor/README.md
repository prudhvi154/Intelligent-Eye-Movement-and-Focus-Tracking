# Acuity Proctor — Intelligent Eye-Tracking & Focus Analytics

> **Secure, Privacy-First Webcam Eye-Tracking, Head Rotation & Proctoring Integrity System**

Acuity Proctor is a client-side AI proctoring dashboard designed for online assessments. Utilizing MediaPipe's high-precision 3D Face Mesh and refined iris tracking models, Acuity Proctor monitors attention levels, head orientation, gaze deviations, eye aspect ratio (EAR), and multi-person violations—all processed locally inside the browser.

---

## 🌟 Key Features

* **🔒 100% Privacy-Preserving Architecture:** All video frames are processed locally in real-time using WASM & WebGL. No video streams or biometric data are transmitted off the device.
* **👁️ Refined Iris Gaze Tracking:** Leverages 478 3D facial landmarks and specialized iris contour points (`468–477`) to track gaze movements across display bounds.
* **🎯 5-Point Calibration Wizard:** Interactive on-screen calibration (`Center`, `Top-Left`, `Top-Right`, `Bottom-Left`, `Bottom-Right`) that maps personalized iris vectors to physical screen geometry.
* **📐 Vector Metrics & Head Pose Analysis:** Trigonometric calculation of Head Yaw (rotation), Pitch (tilt), and Roll to detect when a candidate looks away from the exam window.
* **⚠️ Real-time Violation Auditing:** Automated incident logger that flags:
  * **Off-Screen Gaze Deviation**
  * **Head Yaw / Pitch Excursions**
  * **Drowsiness & Prolonged Eye Closure (EAR Thresholds)**
  * **Multiple Face Detection (Third-Party Assistance)**
  * **Face Absence / Disappearance**
* **📊 Analytics & Post-Exam Diagnostics:** Includes dynamic focus timelines, violation distribution pie charts via **Chart.js**, integrity rating scoring (`EXCELLENT FOCUS`, `MODERATE WARNINGS`, etc.), and a printable proctoring report card.
* **📝 Interactive Exam Simulator:** Built-in test sandbox to evaluate proctoring logic under simulated exam conditions.

---

## 🏗️ Tech Stack & Dependencies

* **Frontend:** HTML5, Modern Vanilla CSS3 (Glassmorphism design tokens), ES Modules Javascript
* **Computer Vision Model:** Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision` v0.10.3)
* **Data Visualization:** Chart.js
* **Backend / Server:** Node.js (Zero-dependency native `http` server)

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v14 or higher recommended)
* A modern web browser with camera permissions enabled (Chrome, Edge, Firefox, Safari).

### Running the Application

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kotakondavamsidhar777-blip/Eye-Tracking-Assessment-Proctor.git
   cd Eye-Tracking-Assessment-Proctor
   ```

2. **Start the local server:**
   ```bash
   node server.js
   ```

3. **Open in browser:**
   Navigate to:
   ```text
   http://localhost:3000/
   ```

4. **Grant Camera Permission:**
   Click **"Start Session"** or **"Activate Session Stream"** and grant webcam permissions to begin real-time proctoring.

---

## 🎯 How Calibration Works

1. Click **"Calibrate Eye Tracker"** in the sidebar control panel.
2. Follow the 5-step wizard.
3. Look directly at each target dot and **click-and-hold** until progress reaches 100%.
4. The system calculates personalized regression bounds (`minX`, `maxX`, `minY`, `maxY`) for higher gaze estimation accuracy.

---

## 📂 Project Structure

```text
├── index.html       # Primary application layout & view containers
├── styles.css       # Design system, glassmorphism UI & responsive styles
├── app.js           # Main application state, UI controller & analytics logic
├── tracker.js       # MediaPipe FaceLandmarker initialization & vector math
├── server.js        # Lightweight HTTP static file server
└── .gitignore       # Version control exclusions
```

---

## 🛡️ Privacy Guarantee

Acuity Proctor never records, stores, or transmits video footage or raw facial biometrics to external servers. All neural network inference occurs client-side inside the user's browser runtime.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
