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
        docFooter: {
          prev: "Previous page",
          next: "Next page",
        },
        nav: [
          { text: "Home", link: "/" },
          { text: "Introduction", link: "/introduction/" },
          { text: "Getting Started", link: "/getting-started/installation" },
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
        ],
      },
    },
  },

  themeConfig: {
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
