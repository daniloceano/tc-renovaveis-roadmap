/*
 * TC-Renováveis Roadmap — aplicação estática (HTML + CSS + JS, sem build).
 *
 * Fonte de verdade: o arquivo tasks.json no repositório GitHub (público).
 *   Leitura: direto da API REST do GitHub, sem autenticação
 *            (GET /repos/{owner}/{repo}/contents/tasks.json?ref={branch} → conteúdo + SHA).
 *            Se a cota anônima (60 req/h por IP) acabar, recorre a raw.githubusercontent.com.
 *   Escrita: POST /api/save (função serverless na Vercel), que exige a sessão aberta com a
 *            senha de edição (POST /api/login) e grava no GitHub com o SHA anterior.
 *            Se o arquivo mudou no GitHub, a resposta é 409 e nada é sobrescrito.
 *
 * Esta página nunca vê o token do GitHub nem guarda a senha: a sessão é um cookie HttpOnly.
 */
'use strict';

(() => {
  // ── Configuração ─────────────────────────────────────────────────────────
  // ?branch=<nome> permite consultar outro branch. O branch de gravação é decidido pelo servidor.
  const branchParam = new URLSearchParams(location.search).get('branch');
  const CONFIG = {
    apiBase: 'https://api.github.com',
    rawBase: 'https://raw.githubusercontent.com',
    owner: 'daniloceano',
    repo: 'tc-renovaveis-roadmap',
    branch: branchParam && /^[\w./-]{1,100}$/.test(branchParam) ? branchParam : 'main',
    path: 'tasks.json',
  };

  const STATUSES = [
    ['done', 'Concluído'],
    ['in-progress', 'Em andamento'],
    ['planned', 'Planejado'],
    ['on-hold', 'Em espera'],
    ['uncertain', 'Incerto'],
    ['discontinued', 'Descontinuado'],
  ];
  const TYPES = [
    ['software', 'Software / Rotinas'],
    ['results', 'Especificação Técnica'],
    ['article', 'Artigo'],
    ['patent', 'Patente'],
    ['planning', 'Planejamento'],
  ];
  const STATUS_LABEL = Object.fromEntries(STATUSES);
  const TYPE_LABEL = Object.fromEntries(TYPES);

  // ── Ícones (SVG em linha, traços no estilo lucide) ────────────────────────
  const svg = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const CIRCLE = '<circle cx="12" cy="12" r="10"/>';
  const STATUS_ICON = {
    done: svg(CIRCLE + '<path d="m9 12 2 2 4-4"/>'),
    'in-progress': svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
    planned: svg(CIRCLE + '<path d="M12 6v6l4 2"/>'),
    'on-hold': svg(CIRCLE + '<path d="M10 15V9M14 15V9"/>'),
    uncertain: svg(CIRCLE + '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>'),
    discontinued: svg('<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>'),
  };
  const I = {
    up: svg('<path d="m18 15-6-6-6 6"/>'),
    down: svg('<path d="m6 9 6 6 6-6"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    trash: svg('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    ext: svg('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    left: svg('<path d="m12 19-7-7 7-7M19 12H5"/>'),
    right: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  };

  // ── Estado ────────────────────────────────────────────────────────────────
  let server = null;       // estado de /api/session: { configured, writeBranch, authenticated, expiresAt }
  let data = null;         // estado editável (o que a interface mostra)
  let baseText = null;     // serialização da última versão carregada/salva no GitHub
  let remoteSha = null;    // SHA (blob git) do tasks.json correspondente a baseText
  let syncedAt = null;     // horário da última leitura/gravação bem-sucedida
  let busy = null;         // null | 'loading' | 'saving'
  let lastError = null;    // mensagem do último erro de sincronização
  let loadError = null;    // erro do primeiro carregamento (sem dados para mostrar)
  let conflict = false;    // o GitHub recusou a gravação por versão desatualizada
  let justSaved = false;   // exibe "Salvo" por alguns segundos
  let viaCdn = false;      // última leitura veio do CDN (cota da API esgotada)
  const ui = { editTask: null, editTaskModule: null, editModule: null, formError: '' };

  const $ = (id) => document.getElementById(id);
  const app = $('app');

  // ── Utilidades ────────────────────────────────────────────────────────────
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isHttpUrl = (u) => /^https?:\/\/\S+$/i.test(String(u || '').trim());
  const serialize = (d) => JSON.stringify(d, null, 2) + '\n';
  const isDirty = () => data !== null && baseText !== null && serialize(data) !== baseText;
  const hhmm = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    return new TextDecoder('utf-8').decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  function slugify(s, fallback) {
    const slug = String(s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/, '');
    return slug || fallback;
  }
  function uniqueId(base, taken) {
    let id = base, n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    return id;
  }
  const allTaskIds = () => new Set(data.modules.flatMap((m) => m.tasks.map((t) => t.id)));

  // Ordem canônica dos campos (mantém o tasks.json previsível e com diffs limpos)
  // `prev` é a versão anterior do item: campos opcionais que já existiam (mesmo vazios) são mantidos,
  // para que editar uma tarefa não altere outras partes do arquivo.
  function normTask(t, prev = {}) {
    const o = { id: t.id, title: t.title, status: t.status, type: t.type, description: t.description ?? '' };
    if ((t.links && t.links.length) || Array.isArray(prev.links)) o.links = t.links || [];
    if ((t.tags && t.tags.length) || Array.isArray(prev.tags)) o.tags = t.tags || [];
    return o;
  }
  function normModule(m, prev = {}) {
    const o = { id: m.id, title: m.title, icon: m.icon, description: m.description ?? '' };
    if (m.discontinued || prev.discontinued !== undefined) o.discontinued = !!m.discontinued;
    if ((m.links && m.links.length) || Array.isArray(prev.links)) o.links = m.links || [];
    o.tasks = m.tasks;
    return o;
  }

  // ── Validação ─────────────────────────────────────────────────────────────
  function validate(d) {
    const errs = [];
    if (!d || !Array.isArray(d.modules)) return ['o arquivo deve conter { "modules": [ ... ] }'];
    const modIds = new Set(), taskIds = new Set();
    const checkLinks = (links, where) => {
      if (links === undefined) return;
      if (!Array.isArray(links)) return errs.push(`${where}: "links" deve ser uma lista`);
      links.forEach((l, i) => {
        if (!l || typeof l.label !== 'string' || !l.label.trim() || typeof l.url !== 'string' || !l.url.trim())
          errs.push(`${where}: link ${i + 1} sem rótulo ou URL`);
      });
    };
    d.modules.forEach((m, mi) => {
      const where = `etapa ${mi + 1}${m && m.id ? ` (${m.id})` : ''}`;
      if (!m || typeof m.id !== 'string' || !m.id.trim()) return errs.push(`${where}: sem "id"`);
      if (modIds.has(m.id)) errs.push(`${where}: id de etapa duplicado`);
      modIds.add(m.id);
      if (typeof m.title !== 'string' || !m.title.trim()) errs.push(`${where}: sem título`);
      checkLinks(m.links, where);
      if (!Array.isArray(m.tasks)) return errs.push(`${where}: "tasks" deve ser uma lista`);
      m.tasks.forEach((t, ti) => {
        const tw = `tarefa ${ti + 1} de ${m.id}${t && t.id ? ` (${t.id})` : ''}`;
        if (!t || typeof t.id !== 'string' || !t.id.trim()) return errs.push(`${tw}: sem "id"`);
        if (taskIds.has(t.id)) errs.push(`${tw}: id de tarefa duplicado`);
        taskIds.add(t.id);
        if (typeof t.title !== 'string' || !t.title.trim()) errs.push(`${tw}: sem título`);
        if (!STATUS_LABEL[t.status]) errs.push(`${tw}: status inválido "${t.status}"`);
        if (!TYPE_LABEL[t.type]) errs.push(`${tw}: tipo inválido "${t.type}"`);
        if (t.description !== undefined && typeof t.description !== 'string') errs.push(`${tw}: descrição deve ser texto`);
        if (t.tags !== undefined && (!Array.isArray(t.tags) || t.tags.some((g) => typeof g !== 'string')))
          errs.push(`${tw}: "tags" deve ser uma lista de textos`);
        checkLinks(t.links, tw);
      });
    });
    return errs;
  }

  // ── Progresso ─────────────────────────────────────────────────────────────
  // Tarefas "Descontinuado" e etapas descontinuadas não entram no denominador.
  function progressOf(tasks) {
    const active = tasks.filter((t) => t.status !== 'discontinued');
    return { done: active.filter((t) => t.status === 'done').length, total: active.length };
  }
  function overallProgress() {
    return progressOf(data.modules.filter((m) => !m.discontinued).flatMap((m) => m.tasks));
  }
  function progressBar({ done, total }, cls = '') {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div class="progress ${cls}">
      <span class="num">${done}/${total}</span>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      <span class="num pct">${total ? pct + '%' : '—'}</span></div>`;
  }

  // ── Resumo das alterações (mensagem de commit e indicador) ─────────────────
  function changeSummary() {
    const base = JSON.parse(baseText);
    const tasksMap = (d) => {
      const m = new Map();
      d.modules.forEach((mod) => mod.tasks.forEach((t) => m.set(t.id, JSON.stringify(t) + '@' + mod.id)));
      return m;
    };
    const modsMap = (d) => new Map(d.modules.map((m) => [m.id, JSON.stringify({ ...m, tasks: undefined })]));
    const diff = (a, b) => {
      let created = 0, edited = 0, deleted = 0;
      for (const [id, v] of b) { if (!a.has(id)) created++; else if (a.get(id) !== v) edited++; }
      for (const id of a.keys()) if (!b.has(id)) deleted++;
      return { created, edited, deleted };
    };
    const t = diff(tasksMap(base), tasksMap(data));
    const m = diff(modsMap(base), modsMap(data));
    const parts = [];
    if (t.created) parts.push(pl(t.created, 'tarefa criada', 'tarefas criadas'));
    if (t.edited) parts.push(pl(t.edited, 'tarefa editada', 'tarefas editadas'));
    if (t.deleted) parts.push(pl(t.deleted, 'tarefa excluída', 'tarefas excluídas'));
    if (m.created) parts.push(pl(m.created, 'etapa criada', 'etapas criadas'));
    if (m.edited) parts.push(pl(m.edited, 'etapa editada', 'etapas editadas'));
    if (m.deleted) parts.push(pl(m.deleted, 'etapa excluída', 'etapas excluídas'));
    return parts.length ? parts.join(', ') : 'reordenação';
  }

  // ── Leitura pública (API do GitHub, sem autenticação) ─────────────────────
  class SyncError extends Error {
    constructor(message, kind) { super(message); this.kind = kind; }
  }

  const repoName = `${CONFIG.owner}/${CONFIG.repo}`;

  async function request(url, init) {
    try {
      return await fetch(url, { cache: 'no-store', ...init });
    } catch {
      throw new SyncError('Falha de rede: não foi possível contatar o GitHub. Verifique a conexão e tente novamente.', 'network');
    }
  }

  const isRateLimited = (res) =>
    (res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0';
  function rateLimitMsg(res) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    return `Cota da API do GitHub esgotada${reset ? ` (renova às ${hhmm(new Date(reset * 1000))})` : ''}.`;
  }

  async function githubGet() {
    // `_` evita o cache do CDN do GitHub nas leituras anônimas (sem ele, medimos até ~20 s de atraso).
    const url = `${CONFIG.apiBase}/repos/${repoName}/contents/${CONFIG.path}?ref=${encodeURIComponent(CONFIG.branch)}&_=${Date.now()}`;
    const res = await request(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (res.ok) return res;
    if (isRateLimited(res)) throw new SyncError(`${rateLimitMsg(res)} Tente novamente mais tarde.`, 'rate');
    if (res.status === 404)
      throw new SyncError(`${CONFIG.path} não encontrado no branch "${CONFIG.branch}" de ${repoName} (GitHub 404).`, 'notfound');
    throw new SyncError(`Erro do GitHub ao ler os dados (HTTP ${res.status}).`, 'http');
  }

  function parseRemote(text, sha) {
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) {
      throw new SyncError(`${CONFIG.path} no GitHub não é um JSON válido (${e.message}). Corrija o arquivo no GitHub.`, 'data');
    }
    const errs = validate(parsed);
    if (errs.length) throw new SyncError(`${CONFIG.path} no GitHub tem problemas: ${errs.slice(0, 5).join('; ')}.`, 'data');
    return { parsed, sha };
  }

  // SHA do blob git (o mesmo que a API devolve), para gravar com segurança após ler pelo CDN.
  async function gitBlobSha(text) {
    const body = new TextEncoder().encode(text);
    const head = new TextEncoder().encode(`blob ${body.length}\0`);
    const buf = new Uint8Array(head.length + body.length);
    buf.set(head);
    buf.set(body, head.length);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
    return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function fetchRemote() {
    let res;
    try {
      res = await githubGet();
    } catch (e) {
      if (e.kind !== 'rate') throw e;
      return fetchFromCdn(e.message); // cota anônima esgotada: lê pelo raw.githubusercontent.com
    }
    const j = await res.json();
    if (j.encoding !== 'base64' || typeof j.content !== 'string')
      throw new SyncError(`${CONFIG.path} é grande demais para a API de conteúdo do GitHub (limite de 1 MB).`, 'data');
    viaCdn = false;
    return parseRemote(b64decode(j.content), j.sha);
  }

  async function fetchFromCdn(why) {
    const branch = CONFIG.branch.split('/').map(encodeURIComponent).join('/');
    const res = await request(`${CONFIG.rawBase}/${repoName}/${branch}/${CONFIG.path}`, {});
    if (!res.ok) throw new SyncError(`${why} A leitura alternativa pelo CDN do GitHub também falhou (HTTP ${res.status}).`, 'rate');
    const text = await res.text();
    viaCdn = true;
    return parseRemote(text, await gitBlobSha(text));
  }

  // ── Servidor do roadmap (/api): sessão e gravação ─────────────────────────
  // A senha só vai para /api/login; a sessão fica num cookie HttpOnly que esta página não lê.
  async function apiCall(path, method, body) {
    let res;
    try {
      res = await fetch(path, {
        method,
        cache: 'no-store',
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new SyncError('Falha de rede: não foi possível contatar o servidor do roadmap.', 'network');
    }
    let j = {};
    try { j = await res.json(); } catch { /* resposta sem JSON (ex.: bloqueio do firewall) */ }
    if (res.ok) return j;
    if (res.status === 429) throw new SyncError('Muitas tentativas. Aguarde alguns minutos e tente novamente.', 'rate');
    const kind = res.status === 401 ? (j.code === 'bad_password' ? 'bad_password' : 'auth')
      : res.status === 409 && j.code === 'conflict' ? 'conflict'
      : res.status === 503 ? 'not_configured' : 'server';
    throw new SyncError(j.error || `Erro do servidor (HTTP ${res.status}).`, kind);
  }

  async function fetchServer() {
    try { server = await apiCall('/api/session', 'GET'); } catch { server = null; }
  }
  const sessionValid = () => !!(server && server.authenticated && server.expiresAt > Date.now());

  // ── Ações de sincronização ────────────────────────────────────────────────
  async function loadRemote() {
    busy = 'loading';
    render();
    try {
      const { parsed, sha } = await fetchRemote();
      data = parsed;
      baseText = serialize(parsed);
      remoteSha = sha;
      syncedAt = new Date();
      lastError = loadError = null;
      conflict = false;
      closeForms();
      if (viaCdn) toast('Cota da API do GitHub esgotada: dados lidos do CDN do GitHub, que pode ter alguns minutos de atraso.');
      return true;
    } catch (e) {
      handleError(e);
      return false;
    } finally {
      busy = null;
      render();
    }
  }

  async function save() {
    if (!data || busy) return;
    if (!isDirty()) return toast('Não há alterações para salvar.');
    const errs = validate(data);
    if (errs.length) {
      lastError = `Os dados têm problemas e não foram enviados: ${errs.join('; ')}.`;
      return render();
    }
    if (!server || !server.configured) {
      lastError = 'O salvamento não está disponível neste endereço (servidor não configurado).';
      return render();
    }
    if (server.writeBranch !== CONFIG.branch) {
      lastError = `Este endereço grava somente no branch "${server.writeBranch}", mas a página mostra "${CONFIG.branch}". Abra o roadmap sem "?branch=" para salvar.`;
      return render();
    }
    if (!sessionValid()) return openAuth();
    const sent = serialize(data);
    let authFailure = null;
    busy = 'saving';
    render();
    try {
      const r = await apiCall('/api/save', 'POST', { data, sha: remoteSha, branch: CONFIG.branch, summary: changeSummary() });
      remoteSha = r.sha;
      baseText = sent;
      syncedAt = new Date();
      lastError = null;
      conflict = false;
      justSaved = true;
      setTimeout(() => { justSaved = false; updateSyncBar(); }, 5000);
      toast(`Salvo no GitHub — commit ${String(r.commit.sha).slice(0, 7)}`, r.commit.url);
    } catch (e) {
      if (e.kind === 'auth') {
        server.authenticated = false;
        authFailure = e.message;
      } else {
        handleError(e);
      }
    } finally {
      busy = null;
      render();
    }
    if (authFailure) openAuth(authFailure);
  }

  async function pull() {
    if (busy) return;
    if (isDirty() && !confirm(
      'Existem alterações locais não salvas.\n\nPuxar a versão do GitHub vai DESCARTÁ-LAS. Deseja continuar?'
    )) return;
    if (await loadRemote() && !viaCdn) toast('Versão mais recente carregada do GitHub.');
  }

  function reset() {
    if (!data || busy) return;
    if (!isDirty()) return toast('Não há alterações locais para descartar.');
    if (!confirm('Descartar todas as alterações locais não salvas?\n\nNada será alterado no GitHub.')) return;
    data = JSON.parse(baseText);
    closeForms();
    render();
    toast('Alterações locais descartadas.');
  }

  function handleError(e) {
    if (!(e instanceof SyncError)) e = new SyncError(`Erro inesperado: ${e && e.message}`, 'other');
    if (!data) loadError = e.message;
    else if (e.kind === 'conflict') conflict = true;
    else lastError = e.message;
  }

  // ── Autorização para edição (senha) ───────────────────────────────────────
  function openAuth(msg) {
    const err = $('auth-error');
    err.textContent = msg || '';
    err.hidden = !msg;
    $('auth-form').elements.password.value = '';
    $('auth-dialog').showModal();
  }

  async function login(form) {
    const password = form.elements.password.value;
    if (!password) return;
    const button = form.querySelector('button[type=submit]');
    const err = $('auth-error');
    button.disabled = true;
    err.hidden = true;
    try {
      const r = await apiCall('/api/login', 'POST', { password });
      server = { ...server, authenticated: true, expiresAt: r.expiresAt };
      form.elements.password.value = '';
      $('auth-dialog').close();
      await save();
    } catch (e) {
      form.elements.password.value = '';
      err.textContent = e.message;
      err.hidden = false;
      form.elements.password.focus();
    } finally {
      button.disabled = false;
    }
  }

  async function logout() {
    try {
      await apiCall('/api/logout', 'POST', {});
    } catch (e) {
      return toast(e.message);
    }
    if (server) server.authenticated = false;
    render();
    toast('Sessão de edição encerrada.');
  }

  function downloadLocal() {
    const blob = new Blob([serialize(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tasks-local-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ── Barra de sincronização e avisos ───────────────────────────────────────
  function updateSyncBar() {
    const dirty = isDirty();
    let state, text, title = '';
    if (busy === 'loading') [state, text] = ['loading', 'Sincronizando…'];
    else if (busy === 'saving') [state, text] = ['saving', 'Salvando…'];
    else if (!data) [state, text] = loadError ? ['error', 'Erro de sincronização'] : ['loading', 'Sincronizando…'];
    else if (conflict) [state, text] = ['conflict', 'Conflito detectado'];
    else if (lastError) [state, text] = ['error', 'Erro de sincronização'];
    else if (dirty) { state = 'dirty'; text = 'Alterações não salvas'; title = changeSummary(); }
    else if (justSaved) [state, text] = ['saved', 'Salvo no GitHub ✓'];
    else { state = 'synced'; text = viaCdn ? 'Sincronizado (via CDN)' : 'Sincronizado com o GitHub'; }
    if (!title && syncedAt) title = `Última sincronização: ${hhmm(syncedAt)}`;
    const pill = $('sync-pill');
    pill.dataset.state = state;
    pill.title = title;
    $('sync-text').textContent = text;
    $('btn-save').disabled = !data || !!busy || !dirty;
    $('btn-pull').disabled = !!busy;
    $('btn-reset').disabled = !data || !!busy || !dirty;
    $('btn-logout').hidden = !sessionValid();
    const badge = $('branch-badge');
    badge.hidden = CONFIG.branch === 'main';
    badge.textContent = `branch: ${CONFIG.branch}`;

    const banner = $('banner');
    const keep = dirty ? ' Suas alterações locais foram preservadas.' : '';
    if (data && conflict) {
      banner.hidden = false;
      banner.innerHTML = `<p><strong>Conflito:</strong> o tasks.json no GitHub foi alterado depois que esta página o carregou
        (por exemplo, em outro computador). Nada foi sobrescrito.${keep}
        Para continuar, baixe uma cópia das suas alterações (opcional) e puxe a versão atual; depois reaplique o que faltar.</p>
        ${dirty ? '<button class="btn" data-act="download-local">Baixar minhas alterações (.json)</button>' : ''}
        <button class="btn btn-primary" data-act="pull">Puxar versão atual</button>`;
    } else if (data && lastError) {
      banner.hidden = false;
      banner.innerHTML = `<p><strong>Erro de sincronização:</strong> ${esc(lastError)}${keep}</p>
        <button class="btn btn-ghost" data-act="dismiss">Fechar</button>`;
    } else {
      banner.hidden = true;
      banner.innerHTML = '';
    }
  }

  let toastTimer = null;
  function toast(msg, href) {
    const el = $('toast');
    el.textContent = msg;
    if (href) {
      const a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = ' ver commit';
      el.append(' ·', a);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, href ? 8000 : 4000);
  }

  // ── Roteamento (#/ e #/module/<id>) ───────────────────────────────────────
  function route() {
    const m = location.hash.match(/^#\/module\/(.+)$/);
    return m ? { module: decodeURIComponent(m[1]) } : {};
  }

  // ── Renderização ──────────────────────────────────────────────────────────
  const statusIcon = (s) => `<span class="st st-${esc(s)}" title="${esc(STATUS_LABEL[s] || s)}">${STATUS_ICON[s] || STATUS_ICON.planned}</span>`;
  const typeBadge = (t) => `<span class="badge ty-${esc(t)}">${esc(TYPE_LABEL[t] || t)}</span>`;
  const options = (pairs, sel) => pairs.map(([v, l]) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join('');
  const linkChips = (links) => (links || []).map((l) => isHttpUrl(l.url)
    ? `<a class="chip" href="${esc(l.url.trim())}" target="_blank" rel="noopener noreferrer">${I.ext}${esc(l.label)}</a>`
    : `<span class="chip" title="URL inválida">${esc(l.label)}</span>`).join('');
  const linksToText = (links) => (links || []).map((l) => `${l.label} | ${l.url}`).join('\n');
  const LOGOS = `<div class="logos">
      <img class="logo-master" src="assets/logo-master.png" width="402" height="237" alt="MASTER — Meteorologia Aplicada a Sistemas de Tempo Regionais">
      <span class="sep" data-optional-sep></span>
      <img class="logo-meteo" src="assets/logo-meteo-oceanografia.jpg" width="1254" height="1254" alt="Metodologias em Meteo-Oceanografia Aplicadas à Indústria de O&amp;G e Energias Renováveis" data-optional>
    </div>`;

  function render() {
    // Preserva o que estiver digitado em um formulário aberto durante a re-renderização
    // (apenas se o mesmo formulário continuar aberto depois dela).
    const formKey = (f) => `${f.dataset.form}:${f.dataset.id}:${f.dataset.module || ''}`;
    const draft = {};
    app.querySelectorAll('form[data-form]').forEach((form) => {
      const d = (draft[formKey(form)] = {});
      for (const f of form.querySelectorAll('[name]')) d[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    });
    const scroll = window.scrollY;

    updateSyncBar();
    const r = route();
    if (!data) app.innerHTML = viewStatus();
    else if (r.module) app.innerHTML = viewModule(r.module);
    else app.innerHTML = viewHome();

    app.querySelectorAll('form[data-form]').forEach((form) => {
      const d = draft[formKey(form)];
      if (!d) return;
      for (const f of form.querySelectorAll('[name]')) {
        if (!(f.name in d)) continue;
        if (f.type === 'checkbox') f.checked = d[f.name]; else f.value = d[f.name];
      }
    });
    window.scrollTo(0, scroll);
    hideMissingLogos();
  }

  function hideMissingLogos() {
    app.querySelectorAll('img[data-optional]').forEach((img) => {
      const hide = () => {
        img.hidden = true;
        const sep = img.parentElement.querySelector('[data-optional-sep]');
        if (sep) sep.hidden = true;
      };
      if (img.complete && img.naturalWidth === 0) hide();
      else img.addEventListener('error', hide, { once: true });
    });
  }

  function viewStatus() {
    return `<div class="connect">
      ${LOGOS}
      <div class="connect-card">
        <p class="kicker">PETROBRAS/CENPES × IAG-USP</p>
        <h1>TC-Renováveis Roadmap</h1>
        ${loadError
          ? `<p class="msg">${esc(loadError)}</p><button class="btn btn-primary" data-act="pull">Tentar novamente</button>`
          : '<p>Carregando dados do GitHub…</p>'}
      </div>
    </div>`;
  }

  function viewHome() {
    const cards = data.modules.map((m) => {
      const tasks = m.tasks.map((t) => `<li>${statusIcon(t.status)}<span class="t">${esc(t.title)}</span>${typeBadge(t.type)}</li>`).join('');
      return `<div class="card${m.discontinued ? ' discontinued' : ''}">
        <a class="card-title" href="#/module/${encodeURIComponent(m.id)}">
          <span class="icon">${esc(m.icon)}</span><h2>${esc(m.title)}</h2>
          ${m.discontinued ? '<span class="badge badge-off">Descontinuado</span>' : ''}
          <span class="arrow">${I.right.replace('<svg', '<svg width="13" height="13"')}</span>
        </a>
        ${progressBar(progressOf(m.tasks))}
        ${tasks ? `<ul class="task-mini">${tasks}</ul>` : '<p class="empty">Nenhuma tarefa.</p>'}
      </div>`;
    }).join('');
    const op = overallProgress();
    const addCard = ui.editModule === '__new__'
      ? `<div class="card">${formModule(null)}</div>`
      : `<button class="card-add" data-act="new-module">+ Nova etapa</button>`;
    const legend = STATUSES.filter(([s]) => s !== 'discontinued')
      .map(([s, l]) => `<span>${statusIcon(s)} ${esc(l)}</span>`).join('');
    return `<header class="header"><div class="wrap">
        ${LOGOS}
        <p class="kicker">PETROBRAS/CENPES × IAG-USP</p>
        <h1 class="title">TC-Renováveis <span>Roadmap</span></h1>
        <p class="subtitle">Pesquisa em Vento &amp; Ondas — Acordo de Cooperação TC No. 050.0125966.23.9</p>
        <div class="overall">
          <div class="progress-head"><span>Progresso geral</span><span>${op.done} de ${op.total} tarefas concluídas</span></div>
          ${progressBar(op, 'progress-lg')}
        </div>
      </div></header>
      <section class="section"><div class="wrap">
        <div class="grid">${cards}${addCard}</div>
        <div class="legend">${legend}<span class="hint">Clique no título da etapa para ver detalhes e editar</span></div>
      </div></section>`;
  }

  function viewModule(id) {
    const idx = data.modules.findIndex((m) => m.id === id);
    if (idx < 0) {
      return `<div class="wrap-narrow"><a class="back" href="#/">${I.left.replace('<svg', '<svg width="14" height="14"')} Voltar ao roadmap</a>
        <p class="empty">Etapa "${esc(id)}" não encontrada.</p></div>`;
    }
    const m = data.modules[idx];
    const p = progressOf(m.tasks);
    const head = ui.editModule === m.id ? formModule(m, idx) : `
      <div class="mod-head">
        <span class="icon">${esc(m.icon)}</span>
        <h1>${esc(m.title)}</h1>
        ${m.discontinued ? '<span class="badge badge-off">Descontinuado</span>' : ''}
        <button class="btn btn-sm" data-act="edit-module" data-id="${esc(m.id)}">${I.edit.replace('<svg', '<svg width="12" height="12"')} Editar etapa</button>
      </div>
      ${m.description ? `<p class="mod-desc">${esc(m.description)}</p>` : ''}
      ${m.links && m.links.length ? `<p class="label">Links externos</p><div class="chips">${linkChips(m.links)}</div>` : ''}`;

    const tasks = m.tasks.map((t, ti) => {
      if (ui.editTask === t.id) return formTask(t, m.id);
      return `<div class="task${t.status === 'discontinued' ? ' is-discontinued' : ''}">
        <div class="task-row">
          ${statusIcon(t.status)}
          <span class="task-title">${esc(t.title)}</span>
          <select class="status-select" data-act="status" data-id="${esc(t.id)}" aria-label="Status">${options(STATUSES, t.status)}</select>
          ${typeBadge(t.type)}
          <span class="task-actions">
            <button class="icon-btn" data-act="task-up" data-id="${esc(t.id)}" title="Mover para cima" ${ti === 0 ? 'disabled' : ''}>${I.up}</button>
            <button class="icon-btn" data-act="task-down" data-id="${esc(t.id)}" title="Mover para baixo" ${ti === m.tasks.length - 1 ? 'disabled' : ''}>${I.down}</button>
            <button class="icon-btn" data-act="edit-task" data-id="${esc(t.id)}" title="Editar tarefa">${I.edit}</button>
            <button class="icon-btn danger" data-act="delete-task" data-id="${esc(t.id)}" title="Excluir tarefa">${I.trash}</button>
          </span>
        </div>
        ${t.description || (t.tags && t.tags.length) || (t.links && t.links.length) ? `<div class="task-body">
          ${t.description ? `<p class="task-desc">${esc(t.description)}</p>` : ''}
          ${t.links && t.links.length ? `<div class="chips">${linkChips(t.links)}</div>` : ''}
          ${t.tags && t.tags.length ? `<div class="tags">${t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div>` : ''}
        </div>` : ''}
      </div>`;
    }).join('');

    const adding = ui.editTask === '__new__' && ui.editTaskModule === m.id;
    return `<div class="wrap-narrow">
      <a class="back" href="#/">${I.left.replace('<svg', '<svg width="14" height="14"')} Voltar ao roadmap</a>
      ${head}
      <div class="progress-head"><span>Progresso</span><span>${p.done}/${p.total} tarefas concluídas</span></div>
      ${progressBar(p)}
      <div class="tasks">${tasks || (adding ? '' : '<p class="empty">Nenhuma tarefa nesta etapa.</p>')}</div>
      <div class="add-row">${adding ? formTask(null, m.id)
        : `<button class="btn" data-act="new-task" data-module="${esc(m.id)}">+ Nova tarefa</button>`}</div>
      <p class="note">Alterações feitas aqui ficam locais até você clicar em “Salvar no GitHub”.</p>
    </div>`;
  }

  function formTask(t, moduleId) {
    const isNew = !t;
    t = t || { title: '', status: 'planned', type: 'software', description: '', tags: [], links: [] };
    return `<form class="form" data-form="task" data-id="${isNew ? '' : esc(t.id)}" data-module="${esc(moduleId)}" autocomplete="off">
      <label class="field full"><span>Título</span><input name="title" value="${esc(t.title)}" required></label>
      <label class="field"><span>Status</span><select name="status">${options(STATUSES, t.status)}</select></label>
      <label class="field"><span>Tipo</span><select name="type">${options(TYPES, t.type)}</select></label>
      <label class="field full"><span>Etapa</span><select name="module">${options(data.modules.map((m) => [m.id, `${m.icon} ${m.title}`]), moduleId)}</select></label>
      <label class="field full"><span>Descrição</span><textarea name="description" rows="4">${esc(t.description)}</textarea></label>
      <label class="field full"><span>Tags</span><input name="tags" value="${esc((t.tags || []).join(', '))}"><small>Separadas por vírgula.</small></label>
      <label class="field full"><span>Links</span><textarea name="links" rows="2" placeholder="Rótulo | https://…">${esc(linksToText(t.links))}</textarea><small>Um por linha, no formato “Rótulo | URL”.</small></label>
      ${ui.formError ? `<p class="form-error full">${esc(ui.formError)}</p>` : ''}
      <div class="form-actions full">
        <button class="btn btn-primary" type="submit">${isNew ? 'Criar tarefa' : 'Aplicar'}</button>
        <button class="btn" type="button" data-act="cancel-form">Cancelar</button>
        ${isNew ? '' : `<span class="spacer"></span><small style="color:var(--dim)">ID: ${esc(t.id)}</small>`}
      </div>
    </form>`;
  }

  function formModule(m, idx) {
    const isNew = !m;
    m = m || { title: '', icon: '📌', description: '', links: [] };
    const last = data.modules.length - 1;
    return `<form class="form" data-form="module" data-id="${isNew ? '' : esc(m.id)}" autocomplete="off">
      <label class="field full"><span>Título da etapa</span><input name="title" value="${esc(m.title)}" required></label>
      <label class="field"><span>Ícone (emoji)</span><input name="icon" value="${esc(m.icon)}" maxlength="8"></label>
      <label class="check" style="align-self:end"><input type="checkbox" name="discontinued"${m.discontinued ? ' checked' : ''}> Etapa descontinuada</label>
      <label class="field full"><span>Descrição</span><textarea name="description" rows="5">${esc(m.description)}</textarea></label>
      <label class="field full"><span>Links externos</span><textarea name="links" rows="3" placeholder="Rótulo | https://…">${esc(linksToText(m.links))}</textarea><small>Um por linha, no formato “Rótulo | URL”.</small></label>
      ${ui.formError ? `<p class="form-error full">${esc(ui.formError)}</p>` : ''}
      <div class="form-actions full">
        <button class="btn btn-primary" type="submit">${isNew ? 'Criar etapa' : 'Aplicar'}</button>
        <button class="btn" type="button" data-act="cancel-form">Cancelar</button>
        ${isNew ? '' : `<span class="spacer"></span>
          <button class="btn btn-sm" type="button" data-act="module-up" data-id="${esc(m.id)}" ${idx === 0 ? 'disabled' : ''}>↑ Mover etapa</button>
          <button class="btn btn-sm" type="button" data-act="module-down" data-id="${esc(m.id)}" ${idx === last ? 'disabled' : ''}>↓ Mover etapa</button>
          <button class="btn btn-sm btn-danger" type="button" data-act="delete-module" data-id="${esc(m.id)}">Excluir etapa</button>`}
      </div>
    </form>`;
  }

  // ── Edição local ──────────────────────────────────────────────────────────
  function closeForms() {
    ui.editTask = ui.editTaskModule = ui.editModule = null;
    ui.formError = '';
  }
  function findTask(id) {
    for (const m of data.modules) {
      const i = m.tasks.findIndex((t) => t.id === id);
      if (i >= 0) return { mod: m, i, task: m.tasks[i] };
    }
    return null;
  }
  function swap(arr, i, j) {
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  function parseLinks(text) {
    const links = [];
    for (const line of String(text).split('\n').map((l) => l.trim()).filter(Boolean)) {
      const k = line.indexOf('|');
      const label = k >= 0 ? line.slice(0, k).trim() : '';
      const url = k >= 0 ? line.slice(k + 1).trim() : line;
      if (!label || !isHttpUrl(url)) throw new Error(`Link inválido: “${line}”. Use “Rótulo | https://…”.`);
      links.push({ label, url });
    }
    return links;
  }

  function submitTask(form) {
    const f = new FormData(form);
    const title = String(f.get('title')).trim();
    if (!title) throw new Error('O título é obrigatório.');
    const target = data.modules.find((m) => m.id === f.get('module'));
    const fields = {
      title,
      status: f.get('status'),
      type: f.get('type'),
      description: String(f.get('description')).trim(),
      tags: String(f.get('tags')).split(',').map((s) => s.trim()).filter(Boolean),
      links: parseLinks(f.get('links')),
    };
    const id = form.dataset.id;
    if (!id) {
      const task = normTask({ id: uniqueId(slugify(title, 'tarefa'), allTaskIds()), ...fields });
      target.tasks.push(task);
      return;
    }
    const found = findTask(id);
    const task = normTask({ ...found.task, ...fields }, found.task);
    if (found.mod === target) found.mod.tasks[found.i] = task;
    else { found.mod.tasks.splice(found.i, 1); target.tasks.push(task); }
  }

  function submitModule(form) {
    const f = new FormData(form);
    const title = String(f.get('title')).trim();
    if (!title) throw new Error('O título é obrigatório.');
    const fields = {
      title,
      icon: String(f.get('icon')).trim() || '📌',
      description: String(f.get('description')).trim(),
      discontinued: f.get('discontinued') === 'on',
      links: parseLinks(f.get('links')),
    };
    const id = form.dataset.id;
    if (!id) {
      const newId = uniqueId(slugify(title, 'etapa'), new Set(data.modules.map((m) => m.id)));
      data.modules.push(normModule({ id: newId, ...fields, tasks: [] }));
      return newId;
    }
    const i = data.modules.findIndex((m) => m.id === id);
    data.modules[i] = normModule({ ...data.modules[i], ...fields }, data.modules[i]);
    return id;
  }

  // ── Eventos ───────────────────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'SELECT') return;
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case 'pull': return pull();
      case 'download-local': return downloadLocal();
      case 'dismiss': lastError = null; return updateSyncBar();
    }
    if (!data) return;
    switch (el.dataset.act) {
      case 'new-module': closeForms(); ui.editModule = '__new__'; break;
      case 'edit-module': closeForms(); ui.editModule = id; break;
      case 'new-task': closeForms(); ui.editTask = '__new__'; ui.editTaskModule = el.dataset.module; break;
      case 'edit-task': closeForms(); ui.editTask = id; break;
      case 'cancel-form': closeForms(); break;
      case 'task-up': case 'task-down': {
        const f = findTask(id);
        swap(f.mod.tasks, f.i, f.i + (el.dataset.act === 'task-up' ? -1 : 1));
        break;
      }
      case 'delete-task': {
        const f = findTask(id);
        if (!confirm(`Excluir a tarefa “${f.task.title}”?\n\nA exclusão só vai para o GitHub quando você clicar em “Salvar no GitHub”.`)) return;
        f.mod.tasks.splice(f.i, 1);
        break;
      }
      case 'module-up': case 'module-down': {
        const i = data.modules.findIndex((m) => m.id === id);
        swap(data.modules, i, i + (el.dataset.act === 'module-up' ? -1 : 1));
        break;
      }
      case 'delete-module': {
        const m = data.modules.find((x) => x.id === id);
        if (!confirm(`Excluir a etapa “${m.title}” e suas ${m.tasks.length} tarefa(s)?\n\nA exclusão só vai para o GitHub quando você clicar em “Salvar no GitHub”.`)) return;
        data.modules = data.modules.filter((x) => x !== m);
        closeForms();
        location.hash = '#/';
        break;
      }
      default: return;
    }
    render();
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.act === 'status' && data) {
      const f = findTask(el.dataset.id);
      if (f) { f.task.status = el.value; render(); }
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    try {
      if (kind === 'task') submitTask(form);
      if (kind === 'module') {
        const wasNew = !form.dataset.id;
        const id = submitModule(form);
        if (wasNew) { closeForms(); location.hash = `#/module/${encodeURIComponent(id)}`; return; }
      }
      closeForms();
    } catch (err) {
      ui.formError = err.message;
    }
    render();
  });

  $('btn-save').addEventListener('click', save);
  $('btn-pull').addEventListener('click', pull);
  $('btn-reset').addEventListener('click', reset);
  $('btn-logout').addEventListener('click', logout);
  $('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    login(e.target);
  });
  $('auth-cancel').addEventListener('click', () => $('auth-dialog').close());

  window.addEventListener('hashchange', () => { closeForms(); render(); window.scrollTo(0, 0); });
  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  // Links antigos da versão Next.js (/module/<id>) chegam aqui como ?modulo=<id> (ver vercel.json).
  const legacy = new URLSearchParams(location.search).get('modulo');
  if (legacy) history.replaceState(null, '', `${location.pathname}#/module/${encodeURIComponent(legacy)}`);

  // Início: descobre em qual branch este endereço grava (produção: main; preview: branch de teste)
  // e carrega os dados desse branch, salvo se ?branch= pedir outro para consulta.
  render();
  fetchServer().then(() => {
    if (!branchParam && server && server.writeBranch) CONFIG.branch = server.writeBranch;
    return loadRemote();
  });
})();
