#!/usr/bin/env node
/*
 * Gera o valor de ROADMAP_PASSWORD_HASH (scrypt com sal aleatório) a partir da sua senha de edição,
 * e, opcionalmente, um ROADMAP_SESSION_SECRET aleatório.
 *
 * Uso (no seu computador, na pasta do repositório; requer Node.js 18+):
 *   node scripts/gerar-hash-senha.mjs            → pede a senha (sem mostrar) e imprime o hash
 *   node scripts/gerar-hash-senha.mjs --segredo  → imprime um segredo de sessão aleatório
 *
 * A senha não é gravada em lugar nenhum nem enviada pela rede. Copie apenas a linha impressa
 * para a variável correspondente no painel da Vercel.
 */
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const N = 32768, R = 8, P = 1, KEYLEN = 32;
const MIN_LENGTH = 12;

if (process.argv.includes('--segredo')) {
  console.log(randomBytes(32).toString('base64url'));
  process.exit(0);
}

if (!process.stdin.isTTY) {
  console.error('Execute este script diretamente em um terminal (a senha é digitada de forma oculta).');
  process.exit(1);
}

// Lê uma linha sem ecoar os caracteres digitados.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = '';
    stdin.setRawMode(true); // desliga o eco antes de mostrar a pergunta
    process.stdout.write(question);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); } // Ctrl+C
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const pw1 = await askHidden('Nova senha de edição: ');
if (pw1.length < MIN_LENGTH) {
  console.error(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres. Prefira uma frase longa.`);
  process.exit(1);
}
const pw2 = await askHidden('Repita a senha: ');
if (pw1 !== pw2) {
  console.error('As senhas não coincidem. Nada foi gerado.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await scrypt(pw1.normalize('NFC'), salt, KEYLEN, { N, r: R, p: P, maxmem: 256 * N * R });
console.log('\nValor para ROADMAP_PASSWORD_HASH (copie a linha inteira):\n');
console.log(`scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${hash.toString('base64url')}`);
