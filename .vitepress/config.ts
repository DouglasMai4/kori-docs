import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kori",
  description: "A Go toolkit for Chi - inspired by Hono, made idiomatic in Go.",

  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Home", link: "/" },
          { text: "Guide", link: "/guide/getting-started" },
          { text: "API", link: "/api/" },
        ],
        sidebar: [],
      },
    },
    ptbr: {
      label: "Português (Brasil)",
      lang: "pt-BR",
      themeConfig: {
        nav: [
          { text: "Início", link: "/ptbr/" },
          { text: "Guia", link: "/ptbr/guide/getting-started" },
          { text: "API", link: "/ptbr/api/" },
        ],
        sidebar: [],
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/douglasmai4/kori" },
    ],
  },
});
