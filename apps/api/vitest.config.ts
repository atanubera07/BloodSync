import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    maxWorkers: 1,
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/{auth.service,matching.service,request.service,donor.service,admin.service,rate-limit}.ts',
      ],
      thresholds: { statements: 50, branches: 40, functions: 60, lines: 55 },
    },
  },
});
