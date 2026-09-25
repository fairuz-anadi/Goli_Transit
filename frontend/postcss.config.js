import { fileURLToPath, URL } from 'node:url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Resolved from this file rather than the working directory, so the site can be
// built from anywhere (`vite build --config frontend/vite.config.js`).
const tailwindConfig = fileURLToPath(new URL('./tailwind.config.js', import.meta.url));

export default {
    plugins: [tailwindcss({ config: tailwindConfig }), autoprefixer()],
};
