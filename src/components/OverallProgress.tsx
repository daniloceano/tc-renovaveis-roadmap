import { modules } from '@/data/roadmap';
import { ProgressBar } from './ProgressBar';

export function OverallProgress() {
  const totalTasks = modules.reduce((sum, m) => sum + m.tasks.length, 0);
  const doneTasks = modules.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.status === 'done').length,
    0
  );

  return (
    <div className="max-w-xl">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Progresso geral</span>
        <span>
          {doneTasks} de {totalTasks} tarefas concluídas
        </span>
      </div>
      <ProgressBar done={doneTasks} total={totalTasks} showLabel={false} height="h-2.5" />
    </div>
  );
}
