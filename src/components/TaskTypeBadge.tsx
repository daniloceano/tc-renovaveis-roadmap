'use client';

import { TaskType } from '@/data/roadmap';

interface TaskTypeBadgeProps {
  type: TaskType;
}

const TYPE_CONFIG: Record<TaskType, { label: string; className: string }> = {
  software: {
    label: 'Software / Rotinas',
    className: 'bg-blue-950/60 text-blue-400 border-blue-800',
  },
  results: {
    label: 'Especificação Técnica',
    className: 'bg-teal-950/60 text-teal-400 border-teal-800',
  },
  article: {
    label: 'Artigo',
    className: 'bg-purple-950/60 text-purple-400 border-purple-800',
  },
  patent: {
    label: 'Patente',
    className: 'bg-amber-950/60 text-amber-400 border-amber-800',
  },
  planning: {
    label: 'Planejamento',
    className: 'bg-slate-800/60 text-slate-400 border-slate-700',
  },
};

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export { TYPE_CONFIG };
