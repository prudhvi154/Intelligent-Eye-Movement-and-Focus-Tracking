import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function EventTimeline({ events = [] }) {
  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col h-full justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Event Audit Log</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{events.length} INCIDENTS</span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-56 pr-1 font-mono text-xs">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-sans text-xs">
            No violation events logged. Session clean.
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{ev.event_type || ev.type}</span>
                  <span className="text-[10px] text-slate-500">{ev.severity}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">{ev.description || ev.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
