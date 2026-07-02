import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Module } from '@/data/roadmap';
import { StatusIcon } from './StatusIcon';
import { ProgressBar } from './ProgressBar';
import { TaskTypeBadge } from './TaskTypeBadge';

interface ModuleCardProps {
  module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const doneTasks = module.tasks.filter((t) => t.status === 'done').length;
  const isDiscontinued = module.discontinued === true;

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-4 transition-colors ${isDiscontinued ? 'bg-slate-950 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700/60 hover:border-slate-600'}`}>
      {/* Título clicável → /module/[id] */}
      <Link
        href={`/module/${module.id}`}
        className="flex items-center gap-2 group/title"
      >
        <span className={`text-2xl leading-none flex-shrink-0 ${isDiscontinued ? 'grayscale' : ''}`}>{module.icon}</span>
        <h2 className={`text-sm font-semibold leading-tight flex-1 min-w-0 transition-colors ${isDiscontinued ? 'text-slate-500 line-through' : 'text-slate-100 group-hover/title:underline group-hover/title:text-white'}`}>
          {module.title}
        </h2>
        {isDiscontinued && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex-shrink-0">
            Descontinuado
          </span>
        )}
        <ArrowRight
          size={13}
          className="text-slate-600 group-hover/title:text-slate-300 transition-colors flex-shrink-0"
        />
      </Link>

      {/* Barra de progresso */}
      <ProgressBar done={doneTasks} total={module.tasks.length} height="h-1.5" />

      {/* Lista de tarefas — somente leitura */}
      <ul className="flex flex-col gap-2">
        {module.tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2">
            <StatusIcon status={task.status} size={15} />
            <span className="text-xs text-slate-300 leading-snug flex-1 line-clamp-2">
              {task.title}
            </span>
            <TaskTypeBadge type={task.type} />
          </li>
        ))}
      </ul>
    </div>
  );
}
