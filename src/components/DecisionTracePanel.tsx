import React, { useState } from 'react';
import { AlertTriangle, BrainCircuit, Check, ChevronDown, ChevronRight, Edit2, ShieldAlert, X } from 'lucide-react';
import { DecisionTrace } from '../types';

interface DecisionTracePanelProps {
  trace: DecisionTrace[];
  onClose: () => void;
  onOverride: (item: DecisionTrace) => void;
}

export const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({ trace, onClose, onOverride }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!trace || trace.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Decision Trace (AEDT)</h3>
              <p className="text-slate-400 text-xs">Exposing ambiguous interpretations & logic</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm mb-6 flex gap-3">
             <ShieldAlert size={18} className="shrink-0 mt-0.5" />
             <p>These are elements where the AI had to make a semantic choice based on incomplete information. Review low-confidence items carefully.</p>
          </div>

          {trace.map((item, idx) => {
            const isLowConfidence = item.confidence < 0.7;
            const isExpanded = expandedId === item.element_id;

            return (
              <div 
                key={idx} 
                className={`
                  border rounded-xl transition-all duration-300
                  ${isLowConfidence ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-slate-950/50'}
                  ${isExpanded ? 'ring-1 ring-white/10' : 'hover:border-white/10'}
                `}
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.element_id)}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-slate-500">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded text-slate-400 uppercase">
                          {item.element_type}
                        </span>
                        <h4 className="font-bold text-white text-sm">{item.chosen_interpretation}</h4>
                      </div>
                      {item.raw_label && (
                        <p className="text-xs text-slate-500 mt-1">
                          Source label: <span className="text-slate-400 italic">"{item.raw_label}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400 mb-1">Confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono ${isLowConfidence ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    {isLowConfidence && <AlertTriangle size={16} className="text-amber-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 pl-12">
                    <div className="border-t border-white/5 pt-4 mt-2 grid gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Reasoning</h5>
                        <p className="text-slate-300 text-sm leading-relaxed">{item.reasoning}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interpretations Considered</h5>
                            <div className="flex flex-wrap gap-2">
                              {item.possible_interpretations.map((opt, i) => (
                                <span key={i} className={`text-xs px-2 py-1 rounded border ${opt === item.chosen_interpretation ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-transparent text-slate-400'}`}>
                                  {opt}
                                  {opt === item.chosen_interpretation && <Check size={10} className="inline ml-1" />}
                                </span>
                              ))}
                            </div>
                         </div>
                         
                         <div className="flex items-end justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onOverride(item);
                              }}
                              className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 transition-all"
                            >
                              <Edit2 size={12} />
                              Override Decision
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};