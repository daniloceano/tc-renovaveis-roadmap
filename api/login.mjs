/*
 * POST /api/login — { "password": "..." } → cookie de sessão HttpOnly (8 h).
 * A senha é comparada com o hash scrypt de ROADMAP_PASSWORD_HASH. Respostas de erro são
 * genéricas e levam um tempo mínimo fixo. O limite de tentativas por IP é aplicado antes,
 * na borda, por uma regra do Firewall da Vercel (ver README).
 */
import { HttpError, config, createSession, handle, json, readJson, sleepUntil, verifyPassword } from './_lib/core.mjs';

const FAILED_LOGIN_MIN_MS = 1200;

export const POST = handle(async (request) => {
  const started = Date.now();
  const body = await readJson(request);
  const cfg = config();
  if (!cfg.ok) throw new HttpError(503, 'O salvamento não está configurado neste ambiente.', 'not_configured');
  const pw = body.password;
  const valid = Object.keys(body).length === 1 && typeof pw === 'string' && pw.length >= 1 && pw.length <= 256
    && (await verifyPassword(pw, cfg.passwordHash));
  if (!valid) {
    await sleepUntil(started + FAILED_LOGIN_MIN_MS);
    throw new HttpError(401, 'Senha incorreta.', 'bad_password');
  }
  const { cookie, expiresAt } = createSession(cfg);
  return json(200, { authenticated: true, expiresAt, writeBranch: cfg.branch }, cookie);
});
