import { modules } from '@/data/roadmap';
import { ModuleCard } from '@/components/ModuleCard';
import { OverallProgress } from '@/components/OverallProgress';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">
              PETROBRAS/CENPES × IAG-USP
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              TC-Renováveis
              <span className="text-slate-400 font-light ml-2">Roadmap</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pesquisa em Vento &amp; Ondas — Acordo de Cooperação TC No. 050.0125966.23.9
            </p>
          </div>
          <OverallProgress />
        </div>
      </header>

      {/* Grade de módulos */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Concluído
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Em andamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" /> Planejado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Em espera
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Incerto
          </span>
          <span className="ml-auto text-slate-600">
            Clique no título do módulo para ver detalhes e editar
          </span>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-slate-800 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-slate-600 text-center sm:text-left">
            TC No. 050.0125966.23.9 · PETROBRAS/CENPES × IAG-USP · 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
