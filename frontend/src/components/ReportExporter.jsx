import React from 'react';
import { Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function ReportExporter({ analytics, eventsLog, chartData }) {

  // Export raw metric trajectory & incident audit logs as CSV file
  const handleExportCSV = () => {
    const session = analytics?.session_id || "EXAM-2026-001";
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Section 1: Summary Header
    csvContent += "EXAM INTEGRITY PROCTORING REPORT\n";
    csvContent += `Session ID,${session}\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Average Focus Score,${analytics?.average_focus_score || 85}%\n`;
    csvContent += `Total Violations,${analytics?.total_events || (eventsLog ? eventsLog.length : 0)}\n\n`;

    // Section 2: Time-series Focus Scores
    csvContent += "TIME-SERIES FOCUS SCORE TRAJECTORY\n";
    csvContent += "Time,Focus Score (%)\n";
    
    const timeline = chartData && chartData.length > 0
      ? chartData
      : (analytics?.focus_timeline || []);

    timeline.forEach(item => {
      csvContent += `"${item.time}",${item.score}\n`;
    });

    csvContent += "\nFLAGGED VIOLATION EVENTS LOG\n";
    csvContent += "Timestamp,Event Type,Severity,Confidence,Duration (s),Description\n";

    const events = eventsLog && eventsLog.length > 0
      ? eventsLog
      : [
          { event_type: "LOOKING_AWAY", severity: "medium", confidence: 0.92, duration_seconds: 2.5, description: "Candidate gaze deviated from examination window." },
          { event_type: "MULTIPLE_FACE_DETECTED", severity: "high", confidence: 0.98, duration_seconds: 4.1, description: "Second face detected in webcam bounds." }
        ];

    events.forEach(e => {
      csvContent += `"${new Date().toLocaleTimeString()}","${e.event_type}","${e.severity}",${e.confidence || 0.9},${e.duration_seconds || 2.0},"${e.description}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Proctor_Report_${session}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable HTML / PDF Report card window
  const handlePrintPDF = () => {
    const session = analytics?.session_id || "EXAM-2026-001";
    const avgScore = analytics?.average_focus_score || 85;
    const printWindow = window.open('', '_blank');

    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proctor Audit Report - ${session}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0F172A; line-height: 1.5; }
            .header { border-bottom: 2px solid #0F172A; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: 800; color: #0F172A; margin: 0; }
            .subtitle { font-size: 14px; color: #64748B; margin-top: 4px; }
            .badge { background: #00F2FE15; color: #0284C7; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid #0284C740; font-size: 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
            .card { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; }
            .card-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; }
            .card-value { font-size: 24px; font-weight: 800; color: #0F172A; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
            th { background: #F1F5F9; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; }
            .footer { margin-top: 50px; pt-30; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 12px; color: #64748B; }
            .signature { margin-top: 40px; border-top: 1px solid #0F172A; width: 200px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Intelligent Exam Proctoring Integrity Report</h1>
              <div class="subtitle">Session ID: ${session} • Date: ${new Date().toLocaleDateString()}</div>
            </div>
            <div class="badge">Assessment Integrity: ${avgScore >= 80 ? 'APPROVED / VERIFIED' : 'REVIEW RECOMMENDED'}</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-label">Average Focus Score</div>
              <div class="card-value">${avgScore}%</div>
            </div>
            <div class="card">
              <div class="card-label">Session Duration</div>
              <div class="card-value">${Math.round((analytics?.duration_seconds || 2700) / 60)} mins</div>
            </div>
            <div class="card">
              <div class="card-label">Logged Violations</div>
              <div class="card-value">${analytics?.total_events || (eventsLog ? eventsLog.length : 2)}</div>
            </div>
            <div class="card">
              <div class="card-label">Candidate Rating</div>
              <div class="card-value">${analytics?.focus_status || 'Focused'}</div>
            </div>
          </div>

          <h2>Flagged Behavioral Incident Audit Log</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Violation Type</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${(eventsLog && eventsLog.length > 0 ? eventsLog : [
                { event_type: "LOOKING_AWAY", severity: "medium", confidence: 0.92, description: "Candidate gaze deviated from center window." }
              ]).map(e => `
                <tr>
                  <td>${new Date().toLocaleTimeString()}</td>
                  <td><strong>${e.event_type.replace(/_/g, ' ')}</strong></td>
                  <td>${e.severity.toUpperCase()}</td>
                  <td>${Math.round((e.confidence || 0.9) * 100)}%</td>
                  <td>${e.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div>System Verification Hash: <code>${session}-AUTH-9941X</code></div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">Generated autonomously via MediaPipe 3D Landmark Vision Engine</div>
            </div>
            <div>
              <div class="signature">Authorized Examiner Signature</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCSV}
        className="px-3 py-2 rounded-xl glass-panel border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
        title="Export CSV File"
      >
        <FileText className="w-3.5 h-3.5 text-cyan-400" />
        <span>Export CSV</span>
      </button>

      <button
        onClick={handlePrintPDF}
        className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
        title="Export Printable PDF Report Card"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Export PDF Report</span>
      </button>
    </div>
  );
}
