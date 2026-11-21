import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

import { OG_HEIGHT, OG_WIDTH, ogImagePath } from './lib/og';

/** Adds the per-page share image to every Starlight page. */
export const onRequest = defineRouteMiddleware((context) => {
  const { head, entry } = context.locals.starlightRoute;
  if (context.url.pathname.startsWith('/404')) return;
  const image = new URL(ogImagePath(context.url.pathname), context.site).href;
  const meta = (attrs: Record<string, string>) => head.push({ tag: 'meta', attrs, content: '' });

  meta({ property: 'og:image', content: image });
  meta({ property: 'og:image:type', content: 'image/png' });
  meta({ property: 'og:image:width', content: String(OG_WIDTH) });
  meta({ property: 'og:image:height', content: String(OG_HEIGHT) });
  meta({ property: 'og:image:alt', content: entry.data.title });
  meta({ name: 'twitter:card', content: 'summary_large_image' });
  meta({ name: 'twitter:image', content: image });
});
