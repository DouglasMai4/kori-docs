import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

import { copy } from '../../components/landing/copy';
import { ogImagePath, renderOg, type OgCard } from '../../lib/og';

const sections: Record<string, { en: string; pt: string }> = {
  introduction: { en: 'Introduction', pt: 'Introdução' },
  'getting-started': { en: 'Getting Started', pt: 'Começando' },
  'core-concepts': { en: 'Core Concepts', pt: 'Conceitos' },
  guides: { en: 'Guides', pt: 'Guias' },
  openapi: { en: 'OpenAPI', pt: 'OpenAPI' },
  reference: { en: 'Reference', pt: 'Referência' },
};

export const getStaticPaths = (async () => {
  const paths: { params: { slug: string }; props: { card: OgCard } }[] = [];
  const add = (pagePath: string, card: OgCard) =>
    paths.push({ params: { slug: ogImagePath(pagePath).slice(4, -4) }, props: { card } });

  add('/', { section: 'Go toolkit for Chi', title: 'Simplicity that flows.', description: copy.en.description, accentLastWord: true });
  add('/pt-br/', { section: 'Toolkit Go para Chi', title: 'Simplicidade que flui.', description: copy['pt-BR'].description, accentLastWord: true });

  for (const entry of await getCollection('docs')) {
    const pt = entry.id.startsWith('pt-br/');
    const key = entry.id.replace(/^pt-br\//, '').split('/')[0];
    const label = sections[key];
    add(`/${entry.id}/`, {
      section: label ? (pt ? label.pt : label.en) : 'Docs',
      title: entry.data.title,
      description: entry.data.description,
    });
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { card: OgCard }).card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
