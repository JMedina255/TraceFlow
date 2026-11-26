import { spawnSync } from 'node:child_process';

/**
 * TraceFlow SCM — Script de Ejecución Controlada hacia Supabase (INIT-H02-VF)
 *
 * Exige ejecución explícita y provee autorización controlada de pruebas remotas
 * sin autorizar operaciones destructivas (DROP DATABASE).
 */
const env = {
  ...process.env,
  ALLOW_REMOTE_TEST_DML: 'true',
};

const result = spawnSync(
  'npx',
  ['vitest', 'run', 'test/real-postgres-integration.spec.ts', 'test/real-postgres-vertical-flow.spec.ts'],
  {
    stdio: 'inherit',
    shell: true,
    env,
  }
);

process.exit(result.status ?? 1);
