import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import markSvg from '../assets/kori-mark.svg?raw';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Public path of the share image for a page path: `/pt-br/guides/testing/` → `/og/pt-br/guides/testing.png`. */
export function ogImagePath(pagePath: string): string {
  const slug = pagePath.replace(/^\/|\/$/g, '') || 'index';
  return `/og/${slug}.png`;
}

export interface OgCard {
  /** Section shown in the footer, e.g. "Guides". */
  section: string;
  title: string;
  description?: string;
  /** Last word of the title rendered in Crystal, like the landing hero. */
  accentLastWord?: boolean;
}

const c = {
  night: '#0d1526',
  deep: '#17243b',
  primary: '#315bff',
  crystal: '#75b7ff',
  ice: '#bbd8ff',
  steel: '#8493ad',
  text: '#f5f8ff',
  muted: '#a9b6cc',
};

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFile(require.resolve(`${pkg}/files/${file}`));

let assets: Promise<{ fonts: Parameters<typeof satori>[1]['fonts']; mark: string }> | undefined;
async function loadAssets() {
  const [s400, s600, m500] = await Promise.all([
    font('@fontsource/geist', 'geist-latin-400-normal.woff'),
    font('@fontsource/geist', 'geist-latin-600-normal.woff'),
    font('@fontsource/geist-mono', 'geist-mono-latin-500-normal.woff'),
  ]);
  return {
    fonts: [
      { name: 'Geist', data: s400, weight: 400 as const, style: 'normal' as const },
      { name: 'Geist', data: s600, weight: 600 as const, style: 'normal' as const },
      { name: 'Geist Mono', data: m500, weight: 500 as const, style: 'normal' as const },
    ],
    mark: `data:image/svg+xml;base64,${Buffer.from(markSvg).toString('base64')}`,
  };
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 18) return 96;
  if (n <= 32) return 80;
  if (n <= 52) return 64;
  return 54;
}

/** One rotated, rounded slab, echoing the hero and the mark. */
const slab = (size: number, right: number, top: number, background: string, extra: Record<string, unknown> = {}) =>
  h('div', {
    position: 'absolute',
    width: size,
    height: size,
    right,
    top,
    borderRadius: size * 0.18,
    transform: 'rotate(45deg)',
    backgroundImage: background,
    ...extra,
  });

export async function renderOg(card: OgCard): Promise<Buffer> {
  assets ??= loadAssets();
  const { fonts, mark } = await assets;
  const size = titleSize(card.title);

  const words = card.title.split(' ');
  const last = card.accentLastWord && words.length > 1 ? words.pop()! : undefined;
  const title = h(
    'div',
    { display: 'flex', flexWrap: 'wrap', fontSize: size, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.04em', color: c.text },
    last ? [h('span', { marginRight: size * 0.25 }, words.join(' ')), h('span', { color: c.crystal }, last)] : card.title,
  );

  const tree = h(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Geist',
      backgroundColor: c.night,
      backgroundImage: `radial-gradient(circle at 88% 60%, rgba(49, 91, 255, 0.38), rgba(13, 21, 38, 0) 55%), linear-gradient(180deg, ${c.night} 0%, #111d36 100%)`,
    },
    [
      slab(460, -60, -90, 'linear-gradient(135deg, rgba(117, 183, 255, 0.16), rgba(49, 91, 255, 0.06))', { border: '1px solid rgba(117, 183, 255, 0.22)' }),
      slab(380, -150, 230, 'linear-gradient(120deg, #bbd8ff 0%, #75b7ff 38%, #315bff 100%)', { opacity: 0.9 }),
      slab(290, 150, 330, 'linear-gradient(135deg, rgba(117, 183, 255, 0.5), rgba(49, 91, 255, 0.7))', { border: '1px solid rgba(187, 216, 255, 0.3)' }),
      h(
        'div',
        {
          position: 'absolute',
          left: 80,
          top: 72,
          bottom: 72,
          width: 680,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
        [
          h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
            h('img', { width: 52, height: 52 }, undefined, { src: mark, width: 52, height: 52 }),
            h('div', { fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em', color: c.text }, 'kori'),
          ]),
          h('div', { display: 'flex', flexDirection: 'column' }, [
            title,
            ...(card.description
              ? [h('div', { display: 'flex', marginTop: 28, fontSize: 30, lineHeight: 1.4, color: c.muted, maxWidth: 640 }, card.description)]
              : []),
          ]),
          h('div', { display: 'flex', alignItems: 'center', gap: 18, fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 24, color: c.steel }, [
            h('div', { color: c.crystal }, card.section),
            h('div', { width: 6, height: 6, borderRadius: 2, backgroundColor: c.steel, transform: 'rotate(45deg)' }),
            h('div', {}, 'kori.douglasmaia.dev.br'),
          ]),
        ],
      ),
    ],
  );

  const svg = await satori(tree as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
