---
title: Schema Generation
---

# Schema Generation

Every struct you pass to `Body`, `Responses`, or `Params` is converted to an OpenAPI schema by reflection. Named structs are registered once under `#/components/schemas/` and referenced by `$ref` wherever they appear, so a `Todo` used in three responses is described a single time and shared.

```go
type Todo struct {
    ID        int       `json:"id"         doc:"Unique identifier"  example:"1"`
    Title     string    `json:"title"      doc:"Title of the task"  example:"Buy milk"`
    Done      bool      `json:"done"       doc:"Whether completed"  example:"false"`
    Priority  string    `json:"priority"   validate:"oneof=low medium high"`
    CreatedAt time.Time `json:"created_at"`
}
```

## Struct tags

The same tags you write for binding and validation drive the schema you don't annotate types twice:

| Tag | Effect |
| --- | --- |
| `json` | Property name in the schema. `json:"-"` omits the field. |
| `validate` | Enriches the schema with constraints and `format` (see below). |
| `doc` | Sets the property `description`. |
| `example` | Sets the property `example`, parsed to a number or bool when the field type is numeric or boolean. |

## Validation → schema mapping

The reflection reads each `validate` rule and translates the ones with a JSON-schema equivalent. Length and range rules apply differently to strings and numbers:

| validate tag | Schema output |
| --- | --- |
| `required` | Field added to the schema's `required` array |
| `min=3` (string) | `minLength: 3` |
| `max=100` (string) | `maxLength: 100` |
| `min=1` (numeric) | `minimum: 1` |
| `max=100` (numeric) | `maximum: 100` |
| `gt=0` (numeric) | `exclusiveMinimum: 0` |
| `lt=100` (numeric) | `exclusiveMaximum: 100` |
| `len=10` (string) | `minLength: 10, maxLength: 10` |
| `email` | `format: email` |
| `uuid`, `uuid3`, `uuid4`, `uuid5` | `format: uuid` |
| `url`, `uri`, `http_url` | `format: uri` |
| `datetime` | `format: date-time` |
| `oneof=a b c` | `enum: ["a", "b", "c"]` |

Rules the generator doesn't recognize are ignored, so your validation tags can carry any rule Kori validates only the schema-relevant ones surface in the spec.

## Required and nullable

A field is `required` when its `validate` tag contains `required` **and** it isn't a pointer. Pointer fields are the opposite: they are treated as nullable their type becomes `["type", "null"]` in OpenAPI 3.1 and are always excluded from `required`. This mirrors how Kori binds optional fields, where a `*string` distinguishes "absent" from "empty":

```go
type UpdateTodoBody struct {
    Title    *string `json:"title"    validate:"omitempty,min=1,max=200"` // nullable, optional
    Done     *bool   `json:"done"`                                        // nullable, optional
    Priority string  `json:"priority" validate:"required,oneof=low medium high"` // required
}
```

## Types

Go types map to schemas as you'd expect: integers become `integer` (with `int32`/`int64` formats), floats become `number`, `bool` becomes `boolean`, slices become `array` with an `items` schema, and maps become an `object` with `additionalProperties`. Nested structs are registered and referenced like any other named schema.

A few standard types have a wire format that doesn't match their Go representation, so the generator emits a fixed schema for them instead of reflecting their fields:

| Go type | Schema |
| --- | --- |
| `time.Time` | `string`, `format: date-time` |
| `net/url.URL` | `string`, `format: uri` |
| `net.IP` | `string`, `format: ipv4` |
| `encoding/json.RawMessage` | untyped (any JSON) |
| `github.com/google/uuid.UUID` | `string`, `format: uuid` |

## Embedded structs and generics

Embedded (anonymous) structs are inlined their fields and `required` entries are merged into the outer schema rather than referenced separately:

```go
type Meta struct {
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Todo struct {
    Meta         // created_at + updated_at appear directly on Todo
    ID   int    `json:"id"`
    Title string `json:"title"`
}
```

Generic instantiations get a valid component name by replacing the type-parameter brackets: `SuccessResponse[HomeResponse]` is registered as `SuccessResponse_HomeResponse`. This lets you document generic envelope types a shared `SuccessResponse[T]` wrapper, for instance without any manual naming.

Recursive and self-referential types are handled safely: a type that refers back to itself resolves to a `$ref` rather than recursing forever.
