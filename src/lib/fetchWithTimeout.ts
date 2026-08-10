/**
 * Fetch com prazo explícito para impedir que uma tela fique aguardando a rede
 * indefinidamente. Preserva um AbortSignal externo quando ele existir.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<Response> {
  const safeTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.max(1_000, Math.round(timeoutMs)) : 20_000;

  if (typeof AbortController === 'undefined') {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        fetch(input, init),
        new Promise<Response>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Tempo limite ao acessar o serviço online.')), safeTimeout);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const controller = new AbortController();
  const sourceSignal = init.signal;
  let timedOut = false;
  const propagateAbort = () => controller.abort();

  if (sourceSignal?.aborted) controller.abort();
  else sourceSignal?.addEventListener('abort', propagateAbort, { once: true });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, safeTimeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new Error('Tempo limite ao acessar o serviço online.');
    throw error;
  } finally {
    clearTimeout(timer);
    sourceSignal?.removeEventListener('abort', propagateAbort);
  }
}
