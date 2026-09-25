import { useEffect } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminLayout from '@/layouts/AdminLayout';

const appName = import.meta.env.VITE_APP_NAME || 'ParkDrop Admin';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ).then((module: any) => {
            if (module.default.layout === undefined && !name.startsWith('Admin/Auth/')) {
                module.default.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
            }
            return module;
        }),
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
});
