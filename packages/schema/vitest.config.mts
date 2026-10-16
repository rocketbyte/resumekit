import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'schema',
    include: ['src/**/*.spec.ts'],
  },
});
