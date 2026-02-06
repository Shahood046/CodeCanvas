
import React from 'react';
import { ShieldCheck, Shield, AlertTriangle } from 'lucide-react';
import { AVAILABLE_CONSTRAINTS } from '../services/constraintService';
import { AppMode } from '../types';

interface ConstraintSelectorProps {
  mode: AppMode;
  selectedConstraints: string[];
  onChange: (constraints: string[]) => void;
  disabled?: boolean;
}

export const ConstraintSelector: React.FC<ConstraintSelectorProps> = ({ 
  mode, 
  selectedConstraints, 
  onChange,
  disabled 
}) => {
  const constraints = AVAILABLE_CONSTRAINTS.filter(c => c.mode === mode);

  const toggleConstraint = (id: string) => {
    if (selectedConstraints.includes(id)) {
      onChange(selectedConstraints.filter(c => c !== id));
    } else {
      onChange([...selectedConstraints, id]);
    }
  };

  return (
    <div className="glass p-6 rounded-[2rem] border border-white/10">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <ShieldCheck size={18} className={mode === 'ui' ? 'text-sky-400' : 'text-indigo-400'} />
        <label className="text-[10px] font-black uppercase tracking-[0.2em]">Constraint-Driven Synthesis (CSC)</label>
      </div>
      
      <div className="space-y-3">
        {constraints.map(constraint => {
          const isActive = selectedConstraints.includes(constraint.id);
          const isHard = constraint.severity === 'hard';

          return (
            <div 
              key={constraint.id}
              onClick={() => !disabled && toggleConstraint(constraint.id)}
              className={`
                group relative p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3
                ${isActive 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-slate-950/30 border-white/5 hover:border-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isActive ? (isHard ? 'bg-red-500 border-red-500' : 'bg-sky-500 border-sky-500') : 'border-slate-600 bg-slate-900'}`}>
                {isActive && <Shield size={12} className="text-white" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{constraint.label}</span>
                  {isHard && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">Hard</span>
                  )}
                  {!isHard && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/20">Soft</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-tight group-hover:text-slate-400 transition-colors">
                  {constraint.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
