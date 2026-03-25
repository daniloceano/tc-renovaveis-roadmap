'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Pencil, Plus, X, Check, Trash2 } from 'lucide-react';
import { Module, Task, TaskType } from '@/data/roadmap';
import { StatusIcon } from './StatusIcon';
import { TaskTypeBadge } from './TaskTypeBadge';
import { ProgressBar } from './ProgressBar';
import { SaveToCodePanel, SaveToCodePanelProps } from './SaveToCodePanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EditableLink {
  id: string;
  label: string;
  url: string;
}

type PanelState = Omit<SaveToCodePanelProps, 'onClose'> | null;

const ALL_TYPES: TaskType[] = ['software', 'results', 'article', 'patent', 'planning'];

function mkLinkId() {
  return 'lnk-' + Math.random().toString(36).slice(2, 8);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ModuleDetailClient({ module }: { module: Module }) {
  // ── Description ─────────────────────────────────────────────────────────
  const [descEditing, setDescEditing] = useState(false);
  const [descDraft, setDescDraft] = useState(module.description);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (descEditing && descRef.current) {
      descRef.current.focus();
      descRef.current.setSelectionRange(descDraft.length, descDraft.length);
    }
  }, [descEditing, descDraft.length]);

  // ── Links ────────────────────────────────────────────────────────────────
  const [links, setLinks] = useState<EditableLink[]>(
    (module.links ?? []).map((l) => ({ ...l, id: mkLinkId() }))
  );
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [addingLink, setAddingLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ label: '', url: '' });
  const [pendingDeleteLinkId, setPendingDeleteLinkId] = useState<string | null>(null);
  const deleteLinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linksAsCode = useCallback(
    (ls: EditableLink[]) =>
      JSON.stringify(
        ls.map(({ label, url }) => ({ label, url })),
        null,
        2
      ),
    []
  );

  const openLinkEdit = (link: EditableLink) => {
    setAddingLink(false);
    setEditingLinkId(link.id);
    setLinkForm({ label: link.label, url: link.url });
  };

  const confirmLinkEdit = (showPanel: (p: PanelState) => void) => {
    if (!linkForm.label.trim() || !linkForm.url.trim()) return;
    const next = links.map((l) =>
      l.id === editingLinkId
        ? { ...l, label: linkForm.label.trim(), url: linkForm.url.trim() }
        : l
    );
    setLinks(next);
    setEditingLinkId(null);
    showPanel({
      title: 'Atualizar links do módulo',
      instructions: `Cole este array no campo \`links\` do módulo "${module.title}" em src/data/roadmap.ts:`,
      code: linksAsCode(next),
    });
  };

  const confirmLinkAdd = (showPanel: (p: PanelState) => void) => {
    if (!linkForm.label.trim() || !linkForm.url.trim()) return;
    const next = [...links, { id: mkLinkId(), label: linkForm.label.trim(), url: linkForm.url.trim() }];
    setLinks(next);
    setAddingLink(false);
    setLinkForm({ label: '', url: '' });
    showPanel({
      title: 'Atualizar links do módulo',
      instructions: `Cole este array no campo \`links\` do módulo "${module.title}" em src/data/roadmap.ts:`,
      code: linksAsCode(next),
    });
  };

  const handleDeleteLink = (id: string, showPanel: (p: PanelState) => void) => {
    if (pendingDeleteLinkId === id) {
      if (deleteLinkTimer.current) clearTimeout(deleteLinkTimer.current);
      setPendingDeleteLinkId(null);
      const next = links.filter((l) => l.id !== id);
      setLinks(next);
      showPanel({
        title: 'Atualizar links do módulo',
        instructions: `Cole este array no campo \`links\` do módulo "${module.title}" em src/data/roadmap.ts:`,
        code: linksAsCode(next),
      });
    } else {
      if (deleteLinkTimer.current) clearTimeout(deleteLinkTimer.current);
      setPendingDeleteLinkId(id);
      deleteLinkTimer.current = setTimeout(() => setPendingDeleteLinkId(null), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (deleteLinkTimer.current) clearTimeout(deleteLinkTimer.current);
    };
  }, []);

  // ── Task ephemeral overrides ─────────────────────────────────────────────
  const [taskTitleDrafts, setTaskTitleDrafts] = useState<Record<string, string>>({});
  const [taskTypeDrafts, setTaskTypeDrafts] = useState<Record<string, TaskType>>({});
  const [taskTagDrafts, setTaskTagDrafts] = useState<Record<string, string[]>>({});

  const getTitle = (t: Task) => taskTitleDrafts[t.id] ?? t.title;
  const getType = (t: Task) => taskTypeDrafts[t.id] ?? t.type;
  const getTags = (t: Task) => taskTagDrafts[t.id] ?? (t.tags ?? []);

  // ── Task title editing ───────────────────────────────────────────────────
  const [editingTitleFor, setEditingTitleFor] = useState<string | null>(null);
  const [titleInputValue, setTitleInputValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitleFor && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleFor]);

  const startTitleEdit = (task: Task) => {
    setEditingTitleFor(task.id);
    setTitleInputValue(getTitle(task));
  };

  const confirmTitleEdit = (task: Task, showPanel: (p: PanelState) => void) => {
    const trimmed = titleInputValue.trim();
    setEditingTitleFor(null);
    if (!trimmed || trimmed === getTitle(task)) return;
    setTaskTitleDrafts((prev) => ({ ...prev, [task.id]: trimmed }));
    showPanel({
      title: 'Atualizar nome da tarefa',
      instructions: `Cole este valor no campo \`title\` da tarefa "${task.title}" em src/data/roadmap.ts:`,
      code: JSON.stringify(trimmed),
    });
  };

  // ── Task type cycling ────────────────────────────────────────────────────
  const cycleType = (task: Task, showPanel: (p: PanelState) => void) => {
    const current = getType(task);
    const idx = ALL_TYPES.indexOf(current);
    const next = ALL_TYPES[(idx + 1) % ALL_TYPES.length];
    setTaskTypeDrafts((prev) => ({ ...prev, [task.id]: next }));
    showPanel({
      title: 'Atualizar tipo da tarefa',
      instructions: `Cole este valor no campo \`type\` da tarefa "${getTitle(task)}" em src/data/roadmap.ts:`,
      code: `'${next}'`,
    });
  };

  // ── Task tag editing ─────────────────────────────────────────────────────
  const [editingTagFor, setEditingTagFor] = useState<{ taskId: string; index: number; value: string } | null>(null);
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTagFor && tagInputRef.current) tagInputRef.current.focus();
  }, [editingTagFor]);

  useEffect(() => {
    if (addingTagFor && newTagInputRef.current) newTagInputRef.current.focus();
  }, [addingTagFor]);

  const confirmTagEdit = (task: Task, showPanel: (p: PanelState) => void) => {
    if (!editingTagFor) return;
    const tags = [...getTags(task)];
    const trimmed = editingTagFor.value.trim();
    if (trimmed) {
      tags[editingTagFor.index] = trimmed;
    } else {
      tags.splice(editingTagFor.index, 1);
    }
    setTaskTagDrafts((prev) => ({ ...prev, [task.id]: tags }));
    setEditingTagFor(null);
    showPanel({
      title: 'Atualizar tags da tarefa',
      instructions: `Cole este array no campo \`tags\` da tarefa "${getTitle(task)}" em src/data/roadmap.ts:`,
      code: JSON.stringify(tags, null, 2),
    });
  };

  const deleteTag = (task: Task, index: number, showPanel: (p: PanelState) => void) => {
    const tags = getTags(task).filter((_, i) => i !== index);
    setTaskTagDrafts((prev) => ({ ...prev, [task.id]: tags }));
    setEditingTagFor(null);
    showPanel({
      title: 'Atualizar tags da tarefa',
      instructions: `Cole este array no campo \`tags\` da tarefa "${getTitle(task)}" em src/data/roadmap.ts:`,
      code: JSON.stringify(tags, null, 2),
    });
  };

  const confirmAddTag = (task: Task, showPanel: (p: PanelState) => void) => {
    const trimmed = newTagValue.trim();
    setAddingTagFor(null);
    setNewTagValue('');
    if (!trimmed) return;
    const tags = [...getTags(task), trimmed];
    setTaskTagDrafts((prev) => ({ ...prev, [task.id]: tags }));
    showPanel({
      title: 'Atualizar tags da tarefa',
      instructions: `Cole este array no campo \`tags\` da tarefa "${getTitle(task)}" em src/data/roadmap.ts:`,
      code: JSON.stringify(tags, null, 2),
    });
  };

  // ── SaveToCodePanel ───────────────────────────────────────────────────────
  const [panel, setPanel] = useState<PanelState>(null);
  const showPanel = useCallback((p: PanelState) => setPanel(p), []);

  const doneTasks = module.tasks.filter((t) => t.status === 'done').length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 pb-32">
      {/* Barra superior */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao roadmap
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            Início
          </Link>
          <span>/</span>
          <span className="text-slate-300">
            {module.icon} {module.title}
          </span>
        </nav>

        {/* Título do módulo */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{module.icon}</span>
          <h1 className="text-2xl font-bold text-white leading-tight">{module.title}</h1>
        </div>

        {/* ── Descrição editável ─────────────────────────────────────────── */}
        <div className="mb-6">
          {descEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={descRef}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setDescDraft(module.description);
                    setDescEditing(false);
                  }
                }}
                rows={5}
                className="w-full bg-slate-900 border border-blue-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 leading-relaxed outline-none resize-y placeholder:text-slate-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDescEditing(false);
                    showPanel({
                      title: 'Atualizar descrição do módulo',
                      instructions: `Cole este valor no campo \`description\` do módulo "${module.title}" em src/data/roadmap.ts:`,
                      code: JSON.stringify(descDraft.trim(), null, 2),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                >
                  <Check size={12} />
                  Salvar no código
                </button>
                <button
                  onClick={() => {
                    setDescDraft(module.description);
                    setDescEditing(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={12} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              className="group flex items-start gap-2 cursor-pointer"
              onClick={() => setDescEditing(true)}
              title="Clique para editar a descrição"
            >
              <p className="text-slate-400 leading-relaxed text-sm flex-1">{descDraft}</p>
              <Pencil
                size={13}
                className="flex-shrink-0 mt-0.5 text-slate-600 group-hover:text-slate-400 transition-colors"
              />
            </div>
          )}
        </div>

        {/* ── Links externos editáveis ───────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">
            Links externos
          </p>
          <div className="flex flex-wrap gap-2 items-start">
            {links.map((link) =>
              editingLinkId === link.id ? (
                /* Formulário de edição inline */
                <div
                  key={link.id}
                  className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-72 bg-slate-900 border border-blue-800 rounded-lg px-3 py-2.5"
                >
                  <input
                    autoFocus
                    value={linkForm.label}
                    onChange={(e) => setLinkForm((f) => ({ ...f, label: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmLinkEdit(showPanel);
                      if (e.key === 'Escape') setEditingLinkId(null);
                    }}
                    placeholder="Rótulo"
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-600 placeholder:text-slate-500"
                  />
                  <input
                    value={linkForm.url}
                    onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmLinkEdit(showPanel);
                      if (e.key === 'Escape') setEditingLinkId(null);
                    }}
                    placeholder="URL"
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-600 placeholder:text-slate-500"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => confirmLinkEdit(showPanel)}
                      disabled={!linkForm.label.trim() || !linkForm.url.trim()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check size={10} />
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingLinkId(null)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <X size={10} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Chip de link */
                <div
                  key={link.id}
                  className="group/chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                >
                  <ExternalLink size={11} className="text-slate-500 flex-shrink-0" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                  <button
                    onClick={() => openLinkEdit(link)}
                    title="Editar link"
                    className="ml-1 text-slate-600 hover:text-slate-300 opacity-0 group-hover/chip:opacity-100 transition-all"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => handleDeleteLink(link.id, showPanel)}
                    title={pendingDeleteLinkId === link.id ? 'Confirmar exclusão' : 'Excluir link'}
                    className={`transition-all ${
                      pendingDeleteLinkId === link.id
                        ? 'text-red-400'
                        : 'text-slate-600 hover:text-red-400 opacity-0 group-hover/chip:opacity-100'
                    }`}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )
            )}

            {/* Formulário de adicionar link */}
            {addingLink ? (
              <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-72 bg-slate-900 border border-blue-800 rounded-lg px-3 py-2.5">
                <input
                  autoFocus
                  value={linkForm.label}
                  onChange={(e) => setLinkForm((f) => ({ ...f, label: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmLinkAdd(showPanel);
                    if (e.key === 'Escape') {
                      setAddingLink(false);
                      setLinkForm({ label: '', url: '' });
                    }
                  }}
                  placeholder="Rótulo"
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-600 placeholder:text-slate-500"
                />
                <input
                  value={linkForm.url}
                  onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmLinkAdd(showPanel);
                    if (e.key === 'Escape') {
                      setAddingLink(false);
                      setLinkForm({ label: '', url: '' });
                    }
                  }}
                  placeholder="URL"
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-600 placeholder:text-slate-500"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => confirmLinkAdd(showPanel)}
                    disabled={!linkForm.label.trim() || !linkForm.url.trim()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check size={10} />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setAddingLink(false);
                      setLinkForm({ label: '', url: '' });
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X size={10} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingLinkId(null);
                  setLinkForm({ label: '', url: '' });
                  setAddingLink(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 bg-slate-900 border border-dashed border-slate-700 hover:border-slate-500 transition-colors"
              >
                <Plus size={11} />
                Adicionar link
              </button>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progresso</span>
            <span>
              {doneTasks}/{module.tasks.length} tarefas concluídas
            </span>
          </div>
          <ProgressBar done={doneTasks} total={module.tasks.length} showLabel={false} height="h-2" />
        </div>

        {/* ── Lista de tarefas ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {module.tasks.map((task) => {
            const currentType = getType(task);
            const currentTags = getTags(task);
            const currentTitle = getTitle(task);

            return (
              <div
                key={task.id}
                className="px-3 py-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                {/* Linha 1: status + título + tipo */}
                <div className="flex items-center gap-2.5">
                  {/* Status (somente leitura — edite o arquivo para alterar) */}
                  <div className="flex-shrink-0" title={`Status: ${task.status} — edite roadmap.ts para alterar`}>
                    <StatusIcon status={task.status} size={16} />
                  </div>

                  {/* Título editável */}
                  {editingTitleFor === task.id ? (
                    <input
                      ref={titleInputRef}
                      value={titleInputValue}
                      onChange={(e) => setTitleInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmTitleEdit(task, showPanel);
                        if (e.key === 'Escape') setEditingTitleFor(null);
                      }}
                      onBlur={() => confirmTitleEdit(task, showPanel)}
                      className="flex-1 bg-slate-800 border border-blue-600 rounded px-2 py-0.5 text-sm text-white outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => startTitleEdit(task)}
                      title="Clique para editar o nome"
                      className="flex-1 text-sm text-slate-200 cursor-text hover:text-white transition-colors leading-snug"
                    >
                      {currentTitle}
                    </span>
                  )}

                  {/* Badge de tipo — clique para ciclar */}
                  <button
                    onClick={() => cycleType(task, showPanel)}
                    title="Clique para alterar o tipo"
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <TaskTypeBadge type={currentType} />
                  </button>
                </div>

                {/* Linha 2: tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-7">
                  {currentTags.map((tag, idx) =>
                    editingTagFor?.taskId === task.id && editingTagFor.index === idx ? (
                      /* Chip de tag em modo edição */
                      <span key={idx} className="inline-flex items-center gap-1">
                        <input
                          ref={tagInputRef}
                          value={editingTagFor.value}
                          onChange={(e) =>
                            setEditingTagFor((prev) => prev && { ...prev, value: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmTagEdit(task, showPanel);
                            if (e.key === 'Escape') setEditingTagFor(null);
                          }}
                          onBlur={() => confirmTagEdit(task, showPanel)}
                          className="bg-slate-800 border border-blue-600 rounded px-1.5 py-0.5 text-[11px] text-white outline-none w-24"
                        />
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent blur first
                            deleteTag(task, idx, showPanel);
                          }}
                          title="Remover tag"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ) : (
                      /* Chip de tag normal */
                      <button
                        key={idx}
                        onClick={() =>
                          setEditingTagFor({ taskId: task.id, index: idx, value: tag })
                        }
                        title="Clique para editar"
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 transition-colors"
                      >
                        {tag}
                      </button>
                    )
                  )}

                  {/* Adicionar tag */}
                  {addingTagFor === task.id ? (
                    <input
                      ref={newTagInputRef}
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmAddTag(task, showPanel);
                        if (e.key === 'Escape') {
                          setAddingTagFor(null);
                          setNewTagValue('');
                        }
                      }}
                      onBlur={() => {
                        if (newTagValue.trim()) confirmAddTag(task, showPanel);
                        else {
                          setAddingTagFor(null);
                          setNewTagValue('');
                        }
                      }}
                      placeholder="nova tag"
                      className="bg-slate-800 border border-blue-600 rounded px-1.5 py-0.5 text-[11px] text-white outline-none w-20 placeholder:text-slate-500"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTagFor(null);
                        setAddingTagFor(task.id);
                        setNewTagValue('');
                      }}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] text-slate-600 hover:text-slate-400 border border-dashed border-slate-800 hover:border-slate-600 transition-colors"
                    >
                      <Plus size={9} />
                      tag
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota sobre status */}
        <p className="mt-6 text-xs text-slate-600 italic">
          Para alterar status das tarefas, edite <code className="text-slate-500">src/data/roadmap.ts</code> e faça push.
        </p>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-slate-800 px-6 py-5 mt-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-600">
            TC No. 050.0125966.23.9 · PETROBRAS/CENPES × IAG-USP · 2025
          </p>
        </div>
      </footer>

      {/* SaveToCodePanel */}
      {panel && <SaveToCodePanel {...panel} onClose={() => setPanel(null)} />}
    </div>
  );
}
