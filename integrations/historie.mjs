import { historiesEnabled } from '../lib/historie/build.mjs';

/** Wyłączona funkcja nie posiada tras, również po wcześniejszym aktywnym buildzie. */
export default function historie() {
  return { name: 'historie', hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      if (!historiesEnabled()) return;
      const routes = [
        ['/historie', '../src/features/historie/index.astro'],
        ['/historie/[slug]', '../src/features/historie/story.astro'],
        ['/dzialaj/opowiedz', '../src/features/historie/form.astro'],
      ];
      for (const [pattern, entrypoint] of routes) injectRoute({ pattern, entrypoint: new URL(entrypoint, import.meta.url), prerender: true });
    },
  } };
}
