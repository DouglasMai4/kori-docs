---
title: Comparação
---

# Comparação

Esta página ajuda você a entender onde o Kori se encaixa em relação às ferramentas que você já pode conhecer.

## Comparação de features

| Feature                                                 | net/http | Chi |           Kori           |
| ------------------------------------------------------- | :------: | :-: | :----------------------: |
| Roteamento                                              |    ✓     |  ✓  |            ✓             |
| Middleware                                              |    ✓     |  ✓  |            ✓             |
| Middleware por rota                                     |          |  ✓  |            ✓             |
| Handlers com retorno de erro                            |          |     |            ✓             |
| Binding de requisição (JSON, query, path, header, form) |          |     |            ✓             |
| Validação automática de entrada                         |          |     |            ✓             |
| Respostas de erro estruturadas                          |          |     |            ✓             |
| Helpers de resposta                                     |          |     |            ✓             |
| Geração de spec OpenAPI 3.1                             |          |     | ✓ _(via `kori/openapi`)_ |
| Suporte a SSE                                           |          |     |            ✓             |

O Chi já cuida de roteamento e middleware. O Kori adiciona a camada acima: binding, validação, tratamento de erros e escrita de respostas.

## Kori vs. frameworks full-stack

Muitos frameworks HTTP em Go substituem o `net/http` por completo. O Kori não.

| Solução                                 | Substitui `net/http` | Construído sobre Chi |
| --------------------------------------- | :------------------: | :------------------: |
| [Gin](https://github.com/gin-gonic/gin) |         Sim          |         Não          |
| [Echo](https://echo.labstack.com)       |         Sim          |         Não          |
| [Fiber](https://gofiber.io)             |         Sim          |         Não          |
| [Chi](https://github.com/go-chi/chi)    |         Não          |          —           |
| **Kori**                                |       **Não**        |       **Sim**        |

Gin, Echo e Fiber fornecem seus próprios tipos `Context`, suas próprias assinaturas de handler e seus próprios ecossistemas de middleware. Migrar para eles significa reescrever handlers e migrar middlewares.

Handlers Kori são handlers `net/http` padrão com um valor de retorno a mais. Qualquer middleware, test helper ou ferramenta que funciona com `http.Handler` continua funcionando sem alterações.

## Quando escolher o Kori

**O Kori é uma boa escolha se você:**

- Já usa Chi e quer reduzir o boilerplate dos handlers
- Quer handlers com retorno de erro sem adotar um framework completo
- Precisa de binding e validação de requisição sem um tipo de contexto customizado
- Quer geração de spec OpenAPI que vive ao lado das suas rotas
- Prefere manter compatibilidade com `net/http` em toda a stack

**O Kori pode não ser a escolha certa se você:**

- Precisa de recursos como templating embutido, gerenciamento de sessão ou suporte a WebSocket (use middlewares Chi ou outros pacotes diretamente)
- Está começando do zero e prefere um framework full-stack opinativo
- Trabalha em uma codebase onde Gin, Echo ou Fiber já é o padrão

## Se você já gosta do Chi, o Kori foi feito para aprimorá-lo — não para substituí-lo.

O Chi cuida do roteamento. O Kori cuida do resto. Ambos ficam fora do caminho do `net/http`.

Você pode adotar o Kori de forma incremental — um handler por vez — sem migrar toda a aplicação.
