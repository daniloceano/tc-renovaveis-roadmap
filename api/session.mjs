/*
 * GET /api/session — informa à interface se o salvamento está configurado neste ambiente,
 * em qual branch ele grava e se há sessão válida. Não exige autenticação e não revela segredos.
 */
import { config, handle, json, readSession } from './_lib/core.mjs';

export const GET = handle(async (request) => {
  const cfg = config();
  const session = cfg.ok ? readSession(request, cfg) : null;
  return json(200, {
    configured: cfg.ok,
    writeBranch: cfg.ok ? cfg.branch : null,
    authenticated: !!session,
    expiresAt: session ? session.expiresAt : null,
  });
});
