#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import path from 'node:path';

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_BACKOFF_MS = 1_500;

export function classifySupabaseHealthStatus(status) {
  if (status === 200) return 'success';
  if (status === 408 || status === 425 || status === 429 || status >= 500) return 'transient';
  return 'fatal';
}

export function isValidSupabaseHealthPayload(payload) {
  return Boolean(
    payload
    && payload.name === 'GoTrue'
    && typeof payload.version === 'string'
    && payload.version.trim(),
  );
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function annotate(level, message) {
  console.log(`::${level}::${message}`);
}

export async function verifySupabaseBuildHealth({
  baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  attempts = parsePositiveInteger(process.env.SUPABASE_HEALTH_ATTEMPTS, DEFAULT_ATTEMPTS),
  timeoutMs = parsePositiveInteger(process.env.SUPABASE_HEALTH_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  backoffMs = parsePositiveInteger(process.env.SUPABASE_HEALTH_BACKOFF_MS, DEFAULT_BACKOFF_MS),
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!baseUrl || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Runtime Node sem fetch disponível para verificar o Supabase.');
  }

  const endpoint = `${String(baseUrl).replace(/\/+$/, '')}/auth/v1/health`;
  let lastTransientReason = 'sem resposta';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

    try {
      const response = await fetchImpl(endpoint, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      const classification = classifySupabaseHealthStatus(response.status);

      if (classification === 'success') {
        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new Error('O endpoint de saúde do Supabase respondeu 200, mas não retornou JSON válido.');
        }
        if (!isValidSupabaseHealthPayload(payload)) {
          throw new Error('A URL respondeu, mas não corresponde a um servidor Supabase Auth válido.');
        }
        console.log(`Supabase Auth confirmado na tentativa ${attempt}/${attempts}.`);
        return { status: 'healthy', attempt, httpStatus: 200 };
      }

      if (classification === 'fatal') {
        throw new Error(
          `O Supabase respondeu HTTP ${response.status}. Confira se URL e chave pública pertencem ao mesmo projeto.`,
        );
      }

      lastTransientReason = `HTTP ${response.status}`;
      if (attempt < attempts) {
        annotate('warning', `Supabase temporariamente indisponível (${lastTransientReason}); nova tentativa ${attempt + 1}/${attempts}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isAbort = controller.signal.aborted || error?.name === 'AbortError';
      const isExplicitValidationError = message.includes('respondeu 200')
        || message.includes('não corresponde a um servidor Supabase Auth válido')
        || message.includes('Confira se URL e chave pública pertencem ao mesmo projeto');

      if (isExplicitValidationError) throw error;

      lastTransientReason = isAbort ? `timeout após ${timeoutMs} ms` : message;
      if (attempt < attempts) {
        annotate('warning', `Não foi possível alcançar o Supabase (${lastTransientReason}); nova tentativa ${attempt + 1}/${attempts}.`);
      }
    } finally {
      clearTimeout(timer);
    }

    if (attempt < attempts) {
      await sleep(backoffMs * attempt);
    }
  }

  annotate(
    'warning',
    `Não foi possível confirmar o Supabase após ${attempts} tentativas (${lastTransientReason}). `
      + 'A configuração estática já foi validada; o build continuará para não confundir indisponibilidade externa com código inválido.',
  );
  return { status: 'transient-unreachable', attempt: attempts, httpStatus: null };
}

async function main() {
  try {
    await verifySupabaseBuildHealth();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    annotate('error', message);
    process.exitCode = 1;
  }
}

const cliPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (cliPath === import.meta.url) {
  await main();
}
