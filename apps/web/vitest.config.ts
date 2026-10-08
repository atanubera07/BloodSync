import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: { include: ['lib/**/*.test.ts', 'tests/**/*.test.tsx'] },
});
