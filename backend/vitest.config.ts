import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.{spec,e2e-spec,test}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Aislamiento obligatorio (INIT-H02-V): Evitar que npm test ejecute escrituras sobre Supabase
      ...(process.env.ALLOW_REMOTE_TEST_DML !== 'true'
        ? ['test/real-postgres-integration.spec.ts', 'test/real-postgres-vertical-flow.spec.ts']
        : []),
    ],
    globals: true,
    fileParallelism: false,
  },
});
