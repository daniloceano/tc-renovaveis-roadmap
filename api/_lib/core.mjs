/*
 * Núcleo das funções serverless do roadmap (Vercel, runtime Node.js, sem dependências).
 *
 * Responsabilidades:
 *   - Verificar a senha de edição (hash scrypt guardado em ROADMAP_PASSWORD_HASH).
 *   - Emitir e validar o cookie de sessão (HMAC-SHA256 com ROADMAP_SESSION_SECRET).
 *   - Bloquear requisições de outras origens (CSRF), corpos grandes e JSON inválido.
 *   - Validar o conteúdo do roadmap e gravar SOMENTE tasks.json, no branch definido pelo servidor.
 *
 * Arquivos em api/_lib não viram rotas (prefixo "_"). Nenhum segredo é registrado em log
 * ou devolvido em resposta.
 */
import { createHmac, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

// Alvo fixo da gravação: não vem do navegador.
const REPO = { owner: 'daniloceano', repo: 'tc-renovaveis-roadmap', path: 'tasks.json' };
const COOKIE = '__Host-roadmap_session';
export const SESSION_TTL_S = 8 * 60 * 60; // 8 horas
const MAX_BODY = { small: 2 * 1024, save: 512 * 1024 };

// ── Erros e respostas ──────────────────────────────────────────────────────
export class HttpError extends Error {
  constructor(status, message, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(status, body, setCookie) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(JSON.stringify(body), { status, headers });
}

// Envolve um handler: erros conhecidos viram respostas JSON; os demais, uma mensagem genérica.
export function handle(fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { error: e.message, code: e.code });
      console.error('roadmap api: erro inesperado', e && e.name);
      return json(500, { error: 'Erro interno do servidor.', code: 'internal' });
    }
  };
}

// ── Configuração (variáveis de ambiente da Vercel) ─────────────────────────
// Produção grava sempre em "main". Fora dela, só no branch de teste declarado em
// ROADMAP_PREVIEW_BRANCH, e nunca em main/master. Sem essa variável, o salvamento fica desligado.
export function writeBranch(env = process.env) {
  if (env.VERCEL_ENV === 'production') return 'main';
  const b = (env.ROADMAP_PREVIEW_BRANCH || '').trim();
  if (!/^[A-Za-z0-9._/-]{1,100}$/.test(b) || b.includes('..') || /^(main|master)$/i.test(b)) return null;
  return b;
}

export function config(env = process.env) {
  const cfg = {
    passwordHash: env.ROADMAP_PASSWORD_HASH || '',
    secret: env.ROADMAP_SESSION_SECRET || '',
    token: env.ROADMAP_GITHUB_TOKEN || '',
    branch: writeBranch(env),
  };
  cfg.ok = cfg.passwordHash.startsWith('scrypt$') && cfg.secret.length >= 32 && cfg.token.length > 0 && !!cfg.branch;
  return cfg;
}

// ── Proteções da requisição ────────────────────────────────────────────────
// Aceita apenas POST JSON vindo da própria origem (o cookie também é SameSite=Strict).
export async function readJson(request, size = 'small') {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = (request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.slice(0, -1)).split(',')[0].trim();
  if (!origin || !host || origin !== `${proto}://${host}`) throw new HttpError(403, 'Origem não autorizada.', 'origin');
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') throw new HttpError(403, 'Origem não autorizada.', 'origin');
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json'))
    throw new HttpError(415, 'Formato de requisição não suportado.', 'content_type');

  const max = MAX_BODY[size];
  if (Number(request.headers.get('content-length') || 0) > max) throw new HttpError(413, 'Requisição grande demais.', 'too_large');
  const chunks = [];
  let total = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel().catch(() => {});
        throw new HttpError(413, 'Requisição grande demais.', 'too_large');
      }
      chunks.push(value);
    }
  }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new HttpError(400, 'Corpo da requisição inválido.', 'bad_request');
  }
}

export const sleepUntil = (t) => new Promise((r) => setTimeout(r, Math.max(0, t - Date.now())));

// ── Senha (scrypt) ─────────────────────────────────────────────────────────
// Formato: scrypt$N$r$p$<sal base64url>$<hash base64url>  (gerado por scripts/gerar-hash-senha.mjs)
export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  if (!(N >= 16384 && N <= 1048576 && (N & (N - 1)) === 0 && r >= 8 && r <= 32 && p >= 1 && p <= 4)) return false;
  const salt = Buffer.from(parts[4], 'base64url');
  const expected = Buffer.from(parts[5], 'base64url');
  if (salt.length < 16 || expected.length < 32) return false;
  const got = await scrypt(password.normalize('NFC'), salt, expected.length, { N, r, p, maxmem: 256 * N * r });
  return timingSafeEqual(got, expected);
}

// ── Sessão (cookie assinado) ───────────────────────────────────────────────
const sign = (secret, data) => createHmac('sha256', secret).update(data).digest('base64url');
// Muda quando o hash da senha muda: trocar a senha na Vercel invalida as sessões abertas.
const passwordFingerprint = (cfg) => sign(cfg.secret, `pw:${cfg.passwordHash}`).slice(0, 22);

export function createSession(cfg, now = Date.now()) {
  const exp = Math.floor(now / 1000) + SESSION_TTL_S;
  const payload = Buffer.from(JSON.stringify({ v: 1, exp, b: cfg.branch, pw: passwordFingerprint(cfg) })).toString('base64url');
  return {
    cookie: `${COOKIE}=${payload}.${sign(cfg.secret, payload)}; Path=/; Max-Age=${SESSION_TTL_S}; HttpOnly; Secure; SameSite=Strict`,
    expiresAt: exp * 1000,
  };
}

export const clearSessionCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export function readSession(request, cfg) {
  if (!cfg.secret) return null;
  const header = request.headers.get('cookie') || '';
  const raw = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [payload, sig, extra] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig || extra !== undefined) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(cfg.secret, payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!p || p.v !== 1 || typeof p.exp !== 'number' || p.exp * 1000 <= Date.now()) return null;
  if (p.b !== cfg.branch || p.pw !== passwordFingerprint(cfg)) return null;
  return { expiresAt: p.exp * 1000 };
}

// ── Validação estrita do roadmap ───────────────────────────────────────────
const STATUSES = new Set(['done', 'in-progress', 'planned', 'on-hold', 'uncertain', 'discontinued']);
const TYPES = new Set(['software', 'results', 'article', 'patent', 'planning']);
const LIM = { modules: 200, tasks: 3000, title: 300, icon: 16, description: 20000, tags: 50, tag: 80, links: 50, label: 200, url: 2000 };
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const invalid = (msg) => new HttpError(422, `Dados inválidos: ${msg}.`, 'invalid_data');

function obj(v, allowed, where) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw invalid(`${where} deve ser um objeto`);
  for (const k of Object.keys(v)) if (!allowed.includes(k)) throw invalid(`${where} tem um campo não permitido`);
  return v;
}
function text(v, max, where, required = true) {
  if (typeof v !== 'string') throw invalid(`${where} deve ser texto`);
  if (required && !v.trim()) throw invalid(`${where} está vazio`);
  if (v.length > max) throw invalid(`${where} é longo demais`);
  if (CONTROL_RE.test(v)) throw invalid(`${where} contém caracteres de controle`);
  return v;
}
function list(v, max, where) {
  if (!Array.isArray(v)) throw invalid(`${where} deve ser uma lista`);
  if (v.length > max) throw invalid(`${where} tem itens demais`);
  return v;
}
function links(v, where) {
  if (v === undefined) return undefined;
  const out = list(v, LIM.links, `${where}: links`).map((l, i) => {
    obj(l, ['label', 'url'], `${where}: link ${i + 1}`);
    const url = text(l.url, LIM.url, `${where}: URL do link ${i + 1}`).trim();
    let ok = false;
    try { ok = ['http:', 'https:'].includes(new URL(url).protocol); } catch { /* inválida */ }
    if (!ok) throw invalid(`${where}: URL do link ${i + 1} deve começar com http(s)://`);
    return { label: text(l.label, LIM.label, `${where}: rótulo do link ${i + 1}`), url };
  });
  return out;
}

// Devolve uma cópia canônica (ordem de campos fixa) ou lança HttpError 422.
// Campos opcionais presentes são mantidos como vieram (inclusive listas vazias), para não
// alterar o arquivo além do que foi editado.
export function canonicalRoadmap(d) {
  obj(d, ['modules'], 'o roadmap');
  const modIds = new Set();
  const taskIds = new Set();
  let nTasks = 0;
  const modules = list(d.modules, LIM.modules, 'modules').map((m, mi) => {
    const where = `etapa ${mi + 1}`;
    obj(m, ['id', 'title', 'icon', 'description', 'discontinued', 'links', 'tasks'], where);
    if (typeof m.id !== 'string' || !ID_RE.test(m.id)) throw invalid(`${where}: id inválido`);
    if (modIds.has(m.id)) throw invalid(`${where}: id repetido`);
    modIds.add(m.id);
    if (m.discontinued !== undefined && typeof m.discontinued !== 'boolean') throw invalid(`${where}: "discontinued" deve ser true/false`);
    const tasks = list(m.tasks, LIM.tasks, `${where}: tasks`).map((t, ti) => {
      const tw = `tarefa ${ti + 1} da etapa ${m.id}`;
      obj(t, ['id', 'title', 'status', 'type', 'description', 'links', 'tags'], tw);
      if (typeof t.id !== 'string' || !ID_RE.test(t.id)) throw invalid(`${tw}: id inválido`);
      if (taskIds.has(t.id)) throw invalid(`${tw}: id repetido`);
      taskIds.add(t.id);
      if (!STATUSES.has(t.status)) throw invalid(`${tw}: status inválido`);
      if (!TYPES.has(t.type)) throw invalid(`${tw}: tipo inválido`);
      const task = {
        id: t.id,
        title: text(t.title, LIM.title, `${tw}: título`),
        status: t.status,
        type: t.type,
        description: t.description === undefined ? '' : text(t.description, LIM.description, `${tw}: descrição`, false),
      };
      if (t.links !== undefined) task.links = links(t.links, tw);
      if (t.tags !== undefined)
        task.tags = list(t.tags, LIM.tags, `${tw}: tags`).map((g, i) => text(g, LIM.tag, `${tw}: tag ${i + 1}`));
      return task;
    });
    nTasks += tasks.length;
    if (nTasks > LIM.tasks) throw invalid('tarefas demais');
    const mod = {
      id: m.id,
      title: text(m.title, LIM.title, `${where}: título`),
      icon: text(m.icon, LIM.icon, `${where}: ícone`),
      description: m.description === undefined ? '' : text(m.description, LIM.description, `${where}: descrição`, false),
    };
    if (m.discontinued !== undefined) mod.discontinued = m.discontinued;
    if (m.links !== undefined) mod.links = links(m.links, where);
    mod.tasks = tasks;
    return mod;
  });
  return { modules };
}

// Mensagem de commit montada no servidor; do navegador só aproveita um resumo higienizado.
export function commitMessage(summary) {
  const clean = typeof summary === 'string'
    ? summary.replace(/[^\p{L}\p{N} ,.;:()-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 200)
    : '';
  return `Atualiza tarefas do roadmap: ${clean || 'atualização'}`;
}

// ── GitHub ─────────────────────────────────────────────────────────────────
export async function putTasksJson(cfg, content, sha, message) {
  const url = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'tc-renovaveis-roadmap',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, content: Buffer.from(content, 'utf8').toString('base64'), sha, branch: cfg.branch }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, 'Não foi possível contatar o GitHub. Tente novamente.', 'github_unreachable');
  }
  if (res.ok) {
    const j = await res.json();
    return { sha: j.content.sha, commit: { sha: j.commit.sha, url: j.commit.html_url } };
  }
  let msg = '';
  try { msg = (await res.json()).message || ''; } catch { /* corpo vazio */ }
  if (res.status === 409 || (res.status === 422 && /sha/i.test(msg)))
    throw new HttpError(409, 'O tasks.json foi alterado no GitHub depois que você o carregou.', 'conflict');
  if ([401, 403, 404].includes(res.status)) {
    console.error('roadmap api: GitHub recusou a credencial do servidor', res.status);
    throw new HttpError(502, 'O servidor não conseguiu gravar no GitHub (token ausente, expirado, sem permissão ou branch inexistente). Avise o administrador.', 'github_auth');
  }
  console.error('roadmap api: falha do GitHub', res.status);
  throw new HttpError(502, `O GitHub recusou a gravação (HTTP ${res.status}). Tente novamente.`, 'github');
}
