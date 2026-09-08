/**
 * Serializa mutações do Cofre na nuvem. Sem isso, dois cliques rápidos podem iniciar
 * uploads concorrentes e um snapshot antigo terminar por último, sobrescrevendo o novo.
 */
let cloudMutationQueue: Promise<unknown> = Promise.resolve();

export function runSerializedVaultCloudMutationR128<T>(task: () => Promise<T>): Promise<T> {
  const run = cloudMutationQueue.then(task, task);
  cloudMutationQueue = run.then(() => undefined, () => undefined);
  return run;
}
