import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library';
  
  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
        include: ['lib/**/*', 'src/**/*'],
        exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
      })
    ],
    build: isLibrary ? {
      lib: {
        entry: resolve(__dirname, 'lib/rtos.ts'),
        name: 'SchedulerTS',
        fileName: (format) => `rtos.${format}.js`,
        formats: ['es', 'cjs', 'umd']
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {}
        }
      },
      sourcemap: true,
      minify: false
    } : {
      outDir: 'dist',
      sourcemap: true,
      minify: 'terser'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts', 'src/**/*.test.ts']
    },
    server: {
      port: 3000,
      open: true,
      historyApiFallback: true
    },
    preview: {
      port: 4173
    }
  };
});