import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * TraceFlow SCM — Script de Ejecución Controlada de Certificación en PostgreSQL Real (INIT-H02-VF / MVP-H01)
 *
 * Configura las variables deliberadas e independientes necesarias para certificar
 * migraciones físicas y recrear la base de datos descartable local (traceflow_cert).
 */
const certEnvPath = path.resolve(process.cwd(), '.env.cert');
if (fs.existsSync(certEnvPath)) {
  dotenv.config({ path: certEnvPath, override: false });
}

const env = {
  ...process.env,
  RUN_REAL_POSTGRES_CERT: 'true',
  ALLOW_DESTRUCTIVE_DATABASE_RESET: 'true',
  ALLOW_REMOTE_TEST_DML: 'false',
};

const result = spawnSync(
  'npx',
  [
    'vitest',
    'run',
    '--fileParallelism=false',
    'test/real-postgres-certification.spec.ts',
    'test/real-postgres-h03-certification.spec.ts',
    'test/real-postgres-h04a-certification.spec.ts',
    'test/real-postgres-h04b-certification.spec.ts',
    'test/real-postgres-mvp-h01-certification.spec.ts',
  ],
  {
    stdio: 'inherit',
    shell: true,
    env,
  }
);

process.exit(result.status ?? 1);
