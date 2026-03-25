'use client';

interface ProgressBarProps {
  done: number;
  total: number;
  showLabel?: boolean;
  height?: string;
}

export function ProgressBar({ done, total, showLabel = true, height = 'h-2' }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {done}/{total}
        </span>
      )}
      <div className={`flex-1 bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>}
    </div>
  );
}
