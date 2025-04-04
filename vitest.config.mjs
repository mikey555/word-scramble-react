import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import {loadEnv} from "vite";


export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    resolve: {
        alias: {
            '~': path.resolve(__dirname, './src/')
        }
    },
    test: {
        globals: true,
        environment: 'node',
        env: loadEnv('', process.cwd(), ''),
        setupFiles: './src/test/setup.ts', // Optional: for test setup
        css: true,
    }
})