import { fileURLToPath, URL } from 'node:url';
import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Content globs are resolved against the working directory, not this file, and
// the site is built from the project root (`--config frontend/vite.config.js`).
// Absolute paths keep the scan correct regardless of where the build runs.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        here('./index.html'),
        here('./src/**/*.jsx'),
        // Shared components live in the Laravel app's tree but compile into
        // this bundle too, so their classes must be scanned here as well.
        here('../resources/js/**/*.jsx'),
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
            },
        },
    },

    plugins: [forms],
};
