'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export interface SaveToCodePanelProps {
  title: string;
  instructions: string;
  code: string;
  onClose: () => void;
}

export function SaveToCodePanel({ title, instructions, code, onClose }: SaveToCodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select all text in the pre block
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-950 border-t border-slate-700 px-6 py-4 max-h-64 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{instructions}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Bloco de código com botão copiar */}
          <div className="relative">
            <pre className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-words pr-20">
              {code}
            </pre>
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
