import { defineConfig } from 'vitest/config';

const isExplicitRealPostgres =
  process.env.RUN_REAL_POSTGRES_CERT === 'true' ||
  process.argv.some((arg) => arg.includes('real-postgres-certification'));

const isExplicitRemote =
  process.env.ALLOW_REMOTE_TEST_DML === 'true' ||
  process.argv.some(
    (arg) =>
      arg.includes('real-postgres-integration') ||
      arg.includes('real-postgres-vertical-flow')
  );

export default defineConfig({
  test: {
    include: ['test/**/*.{spec,e2e-spec,test}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Aislamiento de pruebas destructivas (INIT-H02-VF): Excluidas de `npm test` estándar
      ...(!isExplicitRealPostgres ? ['test/real-postgres-certification.spec.ts'] : []),
      // Aislamiento de pruebas remotas de Supabase: Excluidas por defecto de npm test
      ...(!isExplicitRemote
        ? ['test/real-postgres-integration.spec.ts', 'test/real-postgres-vertical-flow.spec.ts']
        : []),
    ],
    globals: true,
    fileParallelism: false,
  },
});
