# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 + Tailwind CSS 4 (Vite plugin), Bun. Replaces the previous VitePress site at `../kori-docs`.

## Users

Two audiences, weighted equally:

- **Go developers already using Chi** who want to cut handler boilerplate without changing routers. They arrive mid-task looking for reference and copy-pasteable examples.
- **Go developers evaluating HTTP toolkits** (comparing against Echo, Gin, Fiber, Huma, plain net/http). They need to understand what Kori adds and why before adopting.

## Product Purpose

Documentation and brand site for Kori, a Go toolkit for Chi. Success: an evaluator understands Kori's value in one visit and installs it; an existing user finds the exact function, option, or recipe they need fast.

## Positioning

Kori is a toolkit *for* Chi, not a framework replacing it — inspired by Hono, made idiomatic in Go. Handlers return `error`; binding (`BindJSON`, `BindQuery`, `BindPath`, `BindHeader`, `BindForm`, `BindMultipart`) and response helpers (`JSON`, `Text`, `NoContent`) remove boilerplate, while `http.ResponseWriter` and `*http.Request` stay explicit. Chi is never hidden.

## Operating Context

Readers work in an editor and terminal alongside the docs; code samples are the primary content and must be accurate against the current library (`github.com/douglasmai4/kori`, Go 1.26+).

## Capabilities and Constraints

- Bilingual: English is the default; pt-BR is a full translation.
- Sections: brand landing page; getting started; core concepts (routing, groups, handlers, middleware, options, validation, SSE, error handling); OpenAPI (routes, schemas, security); a complete API reference covering every exported function and option, including the `openapi` package; practical guides/recipes for real cases (auth, SSE, uploads, etc.).
- Existing content to migrate lives in `../kori-docs` (EN and `ptbr/`).

## Brand Commitments

- Name: **kori** (lowercase wordmark). Tagline: "Simplicidade que flui." (EN equivalent to be confirmed).
- Logo: stacked rounded-diamond mark with blue gradient; not yet vectorized — reference mock at `public/mock.png`.
- Binding brand palette:
  - Primary `#315BFF`, Crystal Blue `#75B7FF`, Ice Blue `#BBD8FF`, Deep Slate `#17243B`
  - Snow `#F5F8FF`, Mist `#E5ECF7`, Steel `#8493AD`, White `#FFFFFF`, Slate `#26364F`, Night `#0D1526`
  - Brand gradient: `linear-gradient(120deg, #BBD8FF 0%, #75B7FF 38%, #315BFF 100%)`
- Typeface: Geist Sans (per mock).
- Voice: modern, minimal, direct ("Uma toolkit Go moderna, minimalista e feita para construir coisas incríveis.").

## Evidence on Hand

- Existing docs content in `../kori-docs`, including a comparison page and philosophy page.
- Library source and examples in the Kori repo (`examples/`).
- No testimonials, adoption numbers, or benchmarks exist; do not fabricate them.

## Product Principles

1. Show the code first — a before/after beats a claim.
2. Respect Chi: never imply Kori replaces or hides it.
3. Reference must be complete and accurate to the shipped API.
4. Parity across languages — pt-BR is not a second-class translation.
5. Simplicity that flows: every page should feel as lean as the library.
