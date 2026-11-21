export const before = `func createUser(w http.ResponseWriter, r *http.Request) {
    var body CreateUserBody
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"message": "invalid JSON"})
        return
    }

    if err := validate.Struct(body); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusUnprocessableEntity)
        json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
        return
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusConflict)
        json.NewEncoder(w).Encode(map[string]string{"message": "email already in use"})
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}`;

export const after = `func createUser(w http.ResponseWriter, r *http.Request) error {
    var body CreateUserBody
    if err := kori.BindJSON(r, &body); err != nil {
        return err // 400 or 422, with structured details
    }

    user, err := db.Create(body.Name, body.Email)
    if err != nil {
        return kori.Conflict("email already in use")
    }

    return kori.JSON(w, http.StatusCreated, user)
}`;

export const chi = `r := chi.NewRouter()
r.Use(middleware.Logger)

// a plain Chi handler, untouched
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("ok"))
})

// Kori handlers on the same router
users := kori.Group(r, "/users", auth.Bearer(verify))
kori.GET(users, "/", listUsers)
kori.POST(users, "/", createUser)
kori.DELETE(users, "/{id}", deleteUser, kori.Use(requireAdmin))`;

export const oaGo = `type CreateUserBody struct {
    Name  string \`json:"name"  validate:"required,min=2"\`
    Email string \`json:"email" validate:"required,email"\`
}

kori.POST(r, "/users", createUser, spec.Route(openapi.RouteConfig{
    Summary:   "Create a user",
    Body:      &CreateUserBody{},
    Responses: map[int]any{201: &User{}},
}))`;

export const oaYaml = `CreateUserBody:
  type: object
  required: [name, email]
  properties:
    name:
      type: string
      minLength: 2
    email:
      type: string
      format: email`;
