---
title: Comparison
---

# Comparison

This page helps you understand where Kori fits relative to the tools you may already know.

## Feature comparison

| Feature                                           | net/http | Chi |           Kori           |
| ------------------------------------------------- | :------: | :-: | :----------------------: |
| Routing                                           |    ✓     |  ✓  |            ✓             |
| Middleware                                        |    ✓     |  ✓  |            ✓             |
| Per-route middleware                              |          |  ✓  |            ✓             |
| Error-returning handlers                          |          |     |            ✓             |
| Request binding (JSON, query, path, header, form) |          |     |            ✓             |
| Automatic input validation                        |          |     |            ✓             |
| Structured error responses                        |          |     |            ✓             |
| Response helpers                                  |          |     |            ✓             |
| OpenAPI 3.1 spec generation                       |          |     | ✓ _(via `kori/openapi`)_ |
| SSE support                                       |          |     |            ✓             |

Chi already handles routing and middleware. Kori adds the layer above: binding, validation, error handling, and response writing.

## Kori vs. full-stack frameworks

Many Go HTTP frameworks replace `net/http` entirely. Kori does not.

| Solution                                | Replaces `net/http` | Built on Chi |
| --------------------------------------- | :-----------------: | :----------: |
| [Gin](https://github.com/gin-gonic/gin) |         Yes         |      No      |
| [Echo](https://echo.labstack.com)       |         Yes         |      No      |
| [Fiber](https://gofiber.io)             |         Yes         |      No      |
| [Chi](https://github.com/go-chi/chi)    |         No          |      —       |
| **Kori**                                |       **No**        |   **Yes**    |

Gin, Echo, and Fiber provide their own `Context` types, their own handler signatures, and their own middleware ecosystems. Switching to them means rewriting handlers and migrating middleware.

Kori handlers are standard `net/http` handlers with one extra return value. Any middleware, test helper, or tooling that works with `http.Handler` continues to work unchanged.

## When to choose Kori

**Kori is a good fit if you:**

- Already use Chi and want to reduce handler boilerplate
- Want error-returning handlers without adopting a full framework
- Need request binding and validation without a custom context type
- Want OpenAPI spec generation that lives next to your routes
- Prefer to keep `net/http` compatibility across your stack

**Kori may not be the right choice if you:**

- Need features like built-in templating, session management, or WebSocket support (use Chi middleware or other packages directly)
- Are starting from scratch and prefer an opinionated full-stack framework
- Work in a codebase where Gin, Echo, or Fiber is already the standard

## If you already like Chi, Kori is designed to enhance it — not replace it.

Chi handles routing. Kori handles the rest. Both stay out of the way of `net/http`.

You can adopt Kori incrementally — one handler at a time — without migrating your entire application.
