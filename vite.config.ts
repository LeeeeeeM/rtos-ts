import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library';
  
  return {
    plugins: [
      react(),
      ...(isLibrary ? [dts({
        insertTypesEntry: true,
        include: ['lib/**/*'], // 只包含库文件，不包含 src
        exclude: ['src/**/*', 'tests/**/*']
      })] : [])
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
      sourcemap: false, // 禁用 sourcemap 提升构建速度
      minify: 'esbuild', // 使用更快的 esbuild
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
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