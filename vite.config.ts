import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import TanStackRouter from '@tanstack/router-plugin/vite'

export default defineConfig({
    plugins: [
        react(),
        TanStackRouter()
    ],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
})
