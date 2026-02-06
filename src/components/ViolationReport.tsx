
import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert, ArrowRight, RefreshCw, Lock, ShieldCheck, X } from 'lucide-react';
import { Violation } from '../types';

interface ViolationReportProps {
  violations: Violation[];
  onOverride?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
  isBlocking?: boolean;
}

export const ViolationReport: React.FC<ViolationReportProps> = ({ 
  violations, 
  onOverride, 
  onRetry, 
  onClose,
  isBlocking = true 
}) => {
  const hardViolations = violations.filter(v => v.severity === 'hard');
  const softViolations = violations.filter(v => v.severity === 'soft');
  const isClean = violations.length === 0;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };
  
  // Container logic: if blocking, full screen fixed. If not blocking (modal), fixed overlay with backdrop.
  const containerClasses = isBlocking 
    ? "h-full min-h-[600px] flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300"
    : "fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200";

  return (
    <div className={containerClasses} onClick={!isBlocking ? handleBackdropClick : undefined}>
      <div className={`max-w-md w-full bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border ${isClean ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
        
        {/* Background Mesh */}
        <div className={`absolute inset-0 pointer-events-none ${isClean ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}></div>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isClean ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-orange-500'}`}></div>

        {/* Close Button for Modal Mode */}
        {!isBlocking && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${isClean ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            {isClean ? <ShieldCheck size={32} /> : <AlertOctagon size={32} />}
          </div>

          <h3 className="text-2xl font-black text-white text-center mb-2">
            {isClean ? 'Compliance Certified' : (isBlocking ? 'Synthesis Blocked' : 'Compliance Report')}
          </h3>
          
          <p className="text-slate-400 text-center text-sm mb-8">
            {isClean 
              ? "The generated blueprint satisfies all active constraints."
              : `Found ${violations.length} constraint violation${violations.length !== 1 ? 's' : ''}. ${isBlocking ? 'Production standards enforcement is active.' : 'Review these items before deployment.'}`
            }
          </p>

          {!isClean && (
            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {hardViolations.map((v, i) => (
                <div key={`h-${i}`} className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 flex gap-3">
                  <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-400">{v.label}</h4>
                    <p className="text-xs text-red-300/70 mt-1 font-mono bg-red-950/50 p-1.5 rounded border border-red-500/10">
                      {v.evidence}
                    </p>
                  </div>
                </div>
              ))}
              {softViolations.map((v, i) => (
                <div key={`s-${i}`} className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">{v.label} (Soft)</h4>
                    <p className="text-xs text-amber-300/70 mt-1 font-mono bg-amber-950/50 p-1.5 rounded border border-amber-500/10">
                      {v.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isBlocking ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onRetry}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button 
                onClick={onOverride}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                 Override <ArrowRight size={16} />
              </button>
            </div>
          ) : (
             !isClean && (
               <div className="text-center">
                 <p className="text-[10px] text-amber-500 font-bold bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
                   Soft violations do not block export.
                 </p>
               </div>
             )
          )}
          
          {isBlocking && (
            <div className="mt-4 text-center">
              <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Lock size={10} /> Admin override logged
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
