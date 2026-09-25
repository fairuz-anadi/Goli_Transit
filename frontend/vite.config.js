import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Standalone public site.
 *
 * This is a plain SPA, deliberately NOT a Laravel/Inertia app: it runs on its
 * own port, talks to the backend only over HTTP, and knows nothing about Blade
 * or PHP. The Laravel app on the backend port keeps the API and the Control
 * Room.
 *
 * `@shared` points at resources/js so the map canvas, planner widgets, and UI
 * primitives are written once and used by both surfaces.
 */
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),

    plugins: [react()],

    resolve: {
        alias: {
            // `@` must mean resources/js here: the shared components import each
            // other with `@/lib/...` and `@/Components/...`, matching the
            // Laravel app's jsconfig. `@shared` is the same target under a name
            // that reads clearly from this side.
            '@': fileURLToPath(new URL('../resources/js', import.meta.url)),
            '@shared': fileURLToPath(new URL('../resources/js', import.meta.url)),
            // This site's own source.
            '@app': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },

    server: {
        port: 5173,
        strictPort: true,
    },

    build: {
        outDir: fileURLToPath(new URL('./dist', import.meta.url)),
        emptyOutDir: true,
    },
});
