import { spawnSync } from 'node:child_process';

/**
 * TraceFlow SCM — Script de Ejecución Explícita de Certificación en PostgreSQL Real (INIT-H02-VF)
 *
 * Configura las variables deliberadas e independientes necesarias para certificar
 * migraciones físicas y recrear la base de datos descartable local (traceflow_cert).
 */
const env = {
  ...process.env,
  RUN_REAL_POSTGRES_CERT: 'true',
  ALLOW_DESTRUCTIVE_DATABASE_RESET: 'true',
};

const result = spawnSync('npx', ['vitest', 'run', 'test/real-postgres-certification.spec.ts'], {
  stdio: 'inherit',
  shell: true,
  env,
});

process.exit(result.status ?? 1);
