import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AlertPanel({ alertInfo }) {
  const isNormal = !alertInfo || alertInfo.status === 'NORMAL';

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
      isNormal
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
    }`}>
      <div className="flex items-center gap-3">
        {isNormal ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        <div>
          <h4 className="text-xs font-bold uppercase">{alertInfo?.label || 'Normal Status'}</h4>
          <p className="text-[11px] opacity-80">{alertInfo?.message || 'Candidate actively focused.'}</p>
        </div>
      </div>
    </div>
  );
}
