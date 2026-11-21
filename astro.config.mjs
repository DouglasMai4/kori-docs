// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import fs from 'node:fs';
import { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';

// Copy button glyph: Hugeicons copy-01 (stroke-rounded), as a mask for Expressive Code.
const hugeCopy = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5'><path d='M7.5 14.5c0-3.3 0-4.95 1.025-5.975S11.2 7.5 14.5 7.5s4.95 0 5.975 1.025S21.5 11.2 21.5 14.5s0 4.95-1.025 5.975S17.8 21.5 14.5 21.5s-4.95 0-5.975-1.025S7.5 17.8 7.5 14.5'/><path d='M7.5 16.5c-1.396 0-2.095 0-2.656-.196a3.5 3.5 0 0 1-2.148-2.148C2.5 13.595 2.5 12.896 2.5 11.5v-2c0-3.3 0-4.95 1.025-5.975S6.2 2.5 9.5 2.5h2c1.396 0 2.095 0 2.656.196a3.5 3.5 0 0 1 2.148 2.148c.196.561.196 1.26.196 2.656'/></g></svg>"
)}`;
const pick = (dark, light) => ({ theme }) => (theme.type === 'dark' ? dark : light);

const loadTheme = (f) => ExpressiveCodeTheme.fromJSONString(fs.readFileSync(new URL(f, import.meta.url), 'utf-8'));
const koriDark = loadTheme('./src/themes/kori-dark.json');
const koriLight = loadTheme('./src/themes/kori-light.json');

const group = (label, pt, items) => ({ label, translations: { 'pt-BR': pt }, items });

export default defineConfig({
  site: 'https://kori.douglasmaia.dev.br',
  integrations: [
    icon({ include: { hugeicons: ['*'] } }),
    starlight({
      title: 'kori',
      description: 'A Go toolkit for Chi — inspired by Hono, made idiomatic in Go.',
      favicon: '/favicon.svg',
      disable404Route: true,
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'pt-br': { label: 'Português', lang: 'pt-BR' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/douglasmai4/kori' }],
      customCss: ['./src/styles/starlight.css'],
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
        SocialIcons: './src/components/SocialIcons.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      expressiveCode: {
        emitExternalStylesheet: false,
        themes: [koriDark, koriLight],
        styleOverrides: {
          borderRadius: '0.75rem',
          borderColor: 'var(--kori-line)',
          codeFontFamily: 'var(--sl-font-mono)',
          uiFontFamily: 'var(--sl-font)',
          frames: {
            shadowColor: 'transparent',
            copyIcon: `url("${hugeCopy}")`,
            inlineButtonForeground: pick('#c3cee0', '#4c5b75'),
            inlineButtonBackground: pick('#26364f', '#dbe3f0'),
            inlineButtonBackgroundIdleOpacity: '0.45',
            inlineButtonBackgroundHoverOrFocusOpacity: '1',
            inlineButtonBackgroundActiveOpacity: '1',
            inlineButtonBorder: pick('#22324c', '#c9d4e6'),
            inlineButtonBorderOpacity: '1',
            tooltipSuccessBackground: pick('#315bff', '#315bff'),
            tooltipSuccessForeground: '#ffffff',
            terminalTitlebarBackground: ({ theme }) => (theme.type === 'dark' ? '#131f36' : '#e5ecf7'),
            terminalTitlebarBorderBottomColor: ({ theme }) => (theme.type === 'dark' ? '#1d2b44' : '#dbe3f0'),
            terminalTitlebarDotsForeground: ({ theme }) => (theme.type === 'dark' ? '#8493ad' : '#8493ad'),
            terminalTitlebarDotsOpacity: '0.55',
            terminalTitlebarForeground: ({ theme }) => (theme.type === 'dark' ? '#a9b6cc' : '#4c5b75'),
            terminalBackground: ({ theme }) => (theme.type === 'dark' ? '#0f1a2e' : '#f5f8ff'),
            editorTabBarBackground: ({ theme }) => (theme.type === 'dark' ? '#131f36' : '#e5ecf7'),
            editorTabBarBorderBottomColor: ({ theme }) => (theme.type === 'dark' ? '#1d2b44' : '#dbe3f0'),
            editorActiveTabBackground: ({ theme }) => (theme.type === 'dark' ? '#0f1a2e' : '#f5f8ff'),
            editorActiveTabForeground: ({ theme }) => (theme.type === 'dark' ? '#e5ecf7' : '#17243b'),
            editorActiveTabIndicatorTopColor: 'transparent',
            editorActiveTabIndicatorBottomColor: ({ theme }) => (theme.type === 'dark' ? '#5b8bff' : '#315bff'),
            editorBackground: ({ theme }) => (theme.type === 'dark' ? '#0f1a2e' : '#f5f8ff'),
          },
        },
      },
      sidebar: [
        group('Introduction', 'Introdução', [
          'introduction',
          'introduction/why-kori',
          'introduction/philosophy',
          'introduction/comparison',
        ]),
        group('Getting Started', 'Começando', [
          'getting-started/installation',
          'getting-started/first-api',
          'getting-started/routing',
          'getting-started/request-binding',
          'getting-started/validation',
          'getting-started/error-handling',
          'getting-started/project-structure',
        ]),
        group('Core Concepts', 'Conceitos', [
          'core-concepts/handlers',
          'core-concepts/routing',
          'core-concepts/groups',
          'core-concepts/middleware',
          'core-concepts/options',
          'core-concepts/validation',
          'core-concepts/sse',
        ]),
        group('Guides', 'Guias', [
          'guides/authentication',
          'guides/file-uploads',
          'guides/streaming',
          'guides/custom-errors',
          'guides/testing',
        ]),
        group('OpenAPI', 'OpenAPI', [
          'openapi',
          'openapi/routes',
          'openapi/schemas',
          'openapi/security',
        ]),
        group('Reference', 'Referência', ['reference/kori', 'reference/openapi']),
      ],
    }),
  ],
});
