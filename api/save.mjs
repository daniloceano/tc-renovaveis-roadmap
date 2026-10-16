/*
 * POST /api/save — grava tasks.json no GitHub em nome do administrador.
 *
 * Corpo: { "data": {modules:[...]}, "sha": "<sha do blob carregado>", "branch": "<branch>", "summary": "..." }
 *   - exige sessão válida (cookie) e requisição da própria origem;
 *   - o arquivo (tasks.json) e o branch são definidos pelo servidor; "branch" só confirma
 *     que a interface está vendo o mesmo branch em que este ambiente grava;
 *   - o conteúdo é validado e reescrito em forma canônica antes de ir ao GitHub;
 *   - o SHA anterior é obrigatório: se o arquivo mudou no GitHub, a resposta é 409 e nada é sobrescrito.
 */
import { HttpError, canonicalRoadmap, commitMessage, config, handle, json, putTasksJson, readJson, readSession } from './_lib/core.mjs';

const FIELDS = ['data', 'sha', 'branch', 'summary'];

export const POST = handle(async (request) => {
  const body = await readJson(request, 'save');
  const cfg = config();
  if (!cfg.ok) throw new HttpError(503, 'O salvamento não está configurado neste ambiente.', 'not_configured');
  if (!readSession(request, cfg)) throw new HttpError(401, 'Sessão ausente ou expirada. Informe a senha novamente.', 'auth');
  if (Object.keys(body).some((k) => !FIELDS.includes(k))) throw new HttpError(400, 'Campo não permitido na requisição.', 'bad_request');
  if (typeof body.sha !== 'string' || !/^[0-9a-f]{40}$/.test(body.sha)) throw new HttpError(400, 'Versão (SHA) inválida.', 'bad_request');
  if (body.summary !== undefined && (typeof body.summary !== 'string' || body.summary.length > 300))
    throw new HttpError(400, 'Resumo inválido.', 'bad_request');
  if (body.branch !== cfg.branch)
    throw new HttpError(409, `Este ambiente grava somente no branch "${cfg.branch}".`, 'branch_mismatch');

  const content = JSON.stringify(canonicalRoadmap(body.data), null, 2) + '\n';
  const result = await putTasksJson(cfg, content, body.sha, commitMessage(body.summary));
  return json(200, { ok: true, branch: cfg.branch, ...result });
});
