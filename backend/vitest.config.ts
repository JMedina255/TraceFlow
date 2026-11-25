import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.{spec,e2e-spec,test}.ts'],
    globals: true,
  },
});
