import { defineConfig } from "vitepress";

const base = "/kori-docs/";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  title: "Kori",
  description: "A Go toolkit for Chi - inspired by Hono, made idiomatic in Go.",
  appearance: "force-dark",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
  ],

  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        docFooter: {
          prev: "Previous page",
          next: "Next page",
        },
        nav: [
          { text: "Home", link: "/" },
          { text: "Introduction", link: "/introduction/" },
          { text: "Getting Started", link: "/getting-started/installation" },
          { text: "Core Concepts", link: "/core-concepts/handlers" },
          { text: "OpenAPI", link: "/openapi/" },
        ],
        sidebar: [
          {
            text: "Introduction",
            items: [
              { text: "What is Kori?", link: "/introduction/" },
              { text: "Philosophy", link: "/introduction/philosophy" },
              { text: "Why Kori?", link: "/introduction/why-kori" },
              { text: "Comparison", link: "/introduction/comparison" },
            ],
          },
          {
            text: "Getting Started",
            items: [
              { text: "Installation", link: "/getting-started/installation" },
              { text: "Your First API", link: "/getting-started/first-api" },
              { text: "Routing", link: "/getting-started/routing" },
              {
                text: "Error Handling",
                link: "/getting-started/error-handling",
              },
              {
                text: "Request Binding",
                link: "/getting-started/request-binding",
              },
              { text: "Validation", link: "/getting-started/validation" },
              {
                text: "Project Structure",
                link: "/getting-started/project-structure",
              },
            ],
          },
          {
            text: "Core Concepts",
            items: [
              { text: "Handlers", link: "/core-concepts/handlers" },
              { text: "Routing", link: "/core-concepts/routing" },
              { text: "Groups", link: "/core-concepts/groups" },
              { text: "Middleware", link: "/core-concepts/middleware" },
              { text: "Options", link: "/core-concepts/options" },
              { text: "Validation", link: "/core-concepts/validation" },
              { text: "Server-Sent Events", link: "/core-concepts/sse" },
            ],
          },
          {
            text: "OpenAPI",
            items: [
              { text: "Overview", link: "/openapi/" },
              { text: "Documenting Routes", link: "/openapi/routes" },
              { text: "Schema Generation", link: "/openapi/schemas" },
              { text: "Security", link: "/openapi/security" },
            ],
          },
        ],
      },
    },
    ptbr: {
      label: "Português (Brasil)",
      lang: "pt-BR",
      themeConfig: {
        docFooter: {
          prev: "Página anterior",
          next: "Próxima página",
        },
        nav: [
          { text: "Início", link: "/ptbr/" },
          { text: "Introdução", link: "/ptbr/introduction/" },
          { text: "Começando", link: "/ptbr/getting-started/installation" },
          { text: "Conceitos", link: "/ptbr/core-concepts/handlers" },
          { text: "OpenAPI", link: "/ptbr/openapi/" },
        ],
        sidebar: [
          {
            text: "Introdução",
            items: [
              { text: "O que é o Kori?", link: "/ptbr/introduction/" },
              { text: "Filosofia", link: "/ptbr/introduction/philosophy" },
              { text: "Por que o Kori?", link: "/ptbr/introduction/why-kori" },
              { text: "Comparação", link: "/ptbr/introduction/comparison" },
            ],
          },
          {
            text: "Começando",
            items: [
              {
                text: "Instalação",
                link: "/ptbr/getting-started/installation",
              },
              {
                text: "Sua Primeira API",
                link: "/ptbr/getting-started/first-api",
              },
              { text: "Roteamento", link: "/ptbr/getting-started/routing" },
              {
                text: "Tratamento de Erros",
                link: "/ptbr/getting-started/error-handling",
              },
              {
                text: "Binding de Requisição",
                link: "/ptbr/getting-started/request-binding",
              },
              { text: "Validação", link: "/ptbr/getting-started/validation" },
              {
                text: "Estrutura de Projeto",
                link: "/ptbr/getting-started/project-structure",
              },
            ],
          },
          {
            text: "Conceitos Fundamentais",
            items: [
              { text: "Handlers", link: "/ptbr/core-concepts/handlers" },
              { text: "Roteamento", link: "/ptbr/core-concepts/routing" },
              { text: "Grupos", link: "/ptbr/core-concepts/groups" },
              { text: "Middleware", link: "/ptbr/core-concepts/middleware" },
              { text: "Options", link: "/ptbr/core-concepts/options" },
              { text: "Validação", link: "/ptbr/core-concepts/validation" },
              { text: "Server-Sent Events", link: "/ptbr/core-concepts/sse" },
            ],
          },
          {
            text: "OpenAPI",
            items: [
              { text: "Visão Geral", link: "/ptbr/openapi/" },
              { text: "Documentando Rotas", link: "/ptbr/openapi/routes" },
              { text: "Geração de Schemas", link: "/ptbr/openapi/schemas" },
              { text: "Segurança", link: "/ptbr/openapi/security" },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    logo: "/favicon.svg",
    search: {
      provider: "local",
      options: {
        locales: {
          ptbr: {
            translations: {
              button: {
                buttonText: "Pesquisar",
                buttonAriaLabel: "Pesquisar",
              },
              modal: {
                displayDetails: "Mostrar lista detalhada",
                resetButtonTitle: "Redefinir pesquisa",
                backButtonTitle: "Fechar pesquisa",
                noResultsText: "Nenhum resultado",
                footer: {
                  selectText: "Selecionar",
                  selectKeyAriaLabel: "Enter",
                  navigateText: "Navegar",
                  navigateUpKeyAriaLabel: "Seta para cima",
                  navigateDownKeyAriaLabel: "Seta para baixo",
                  closeText: "Fechar",
                  closeKeyAriaLabel: "Esc",
                },
              },
            },
          },
        },
      },
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/douglasmai4/kori" },
    ],
  },
  lastUpdated: true,
});
