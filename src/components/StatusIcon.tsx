'use client';

import { CheckCircle2, Circle, Clock, PauseCircle, HelpCircle, Loader2, Archive } from 'lucide-react';
import { TaskStatus } from '@/data/roadmap';

interface StatusIconProps {
  status: TaskStatus;
  size?: number;
}

export function StatusIcon({ status, size = 16 }: StatusIconProps) {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={size} className="text-emerald-400" />;
    case 'in-progress':
      return <Loader2 size={size} className="text-blue-400 animate-spin" />;
    case 'planned':
      return <Clock size={size} className="text-slate-400" />;
    case 'on-hold':
      return <PauseCircle size={size} className="text-amber-400" />;
    case 'uncertain':
      return <HelpCircle size={size} className="text-orange-400" />;
    case 'discontinued':
      return <Archive size={size} className="text-slate-500" />;
    default:
      return <Circle size={size} className="text-slate-500" />;
  }
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    done: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
    'in-progress': 'bg-blue-900/60 text-blue-300 border-blue-700',
    planned: 'bg-slate-800/60 text-slate-400 border-slate-600',
    'on-hold': 'bg-amber-900/60 text-amber-300 border-amber-700',
    uncertain: 'bg-orange-900/60 text-orange-300 border-orange-700',
    discontinued: 'bg-slate-900/60 text-slate-500 border-slate-700',
  };

  const labels: Record<TaskStatus, string> = {
    done: 'Concluído',
    'in-progress': 'Em andamento',
    planned: 'Planejado',
    'on-hold': 'Em espera',
    uncertain: 'Incerto',
    discontinued: 'Descontinuado',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      <StatusIcon status={status} size={12} />
      {labels[status]}
    </span>
  );
}
