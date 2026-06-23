---
layout: home

hero:
  name: Kori
  text: The missing toolkit for Chi
  tagline: Inspired by Hono. Built for idiomatic Go.
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: Concepts
      link: /core-concepts/handlers

features:
  - icon: 🧩
    title: Chi Native
    details: Kori extends Chi instead of replacing it. Keep using net/http, middleware, routers, and everything you already know.

  - icon: ↩️
    title: Error Return
    details: Return errors directly from handlers. Kori converts them into consistent HTTP responses automatically.

  - icon: 🔗
    title: Binding Helpers
    details: Bind request data from JSON, query strings, path params, headers, forms, and multipart uploads with a single function call.

  - icon: 🦺
    title: Automatic Validation
    details: Powered by go-playground/validator. Invalid requests automatically return structured 422 responses.

  - icon: 📖
    title: OpenAPI Ready
    details: Generate OpenAPI specifications directly from your routes using the official kori/openapi package.

  - icon: 🔌
    title: Extensible via Options
    details: The Option type lets you hook into route registration - used by kori/openapi, route loggers, or your own tooling.
---
