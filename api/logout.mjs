/*
 * POST /api/logout — encerra a sessão apagando o cookie.
 */
import { clearSessionCookie, handle, json, readJson } from './_lib/core.mjs';

export const POST = handle(async (request) => {
  await readJson(request); // mesma verificação de origem das demais rotas
  return json(200, { authenticated: false }, clearSessionCookie());
});
