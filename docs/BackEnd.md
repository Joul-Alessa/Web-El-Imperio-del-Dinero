# BackEnd

Mucho texto del backend

## Documentación de la API

Los endpoints de la API que expone el BackEnd son los siguientes:

### GET /apí/persons

Obtiene a todas las personas

No es requerido ningún header en el envío del request

La response tiene una estructura como la siguiente:

```json
[
  {
    "id": 1,
    "nombre": "Persona1"
  },
  {
    "id": 2,
    "nombre": "Persona2"
  },
  {
    "id": 3,
    "nombre": "Persona3"
  },
  {
    "id": 4,
    "nombre": "Persona4"
  }
]
```

### GET /apí/types

Obtiene todos los tipos de movimientos

No es requerido ningún header en el envío del request

La response tiene una estructura como la siguiente:

```json
[
  {
    "id": 1,
    "nombre": "Ingreso"
  },
  {
    "id": 2,
    "nombre": "Gasto"
  }
]
```

### GET /apí/accounts

Obtiene todas las cuentas

No es requerido ningún header en el envío del request

La response tiene una estructura como la siguiente:

```json
[
  {
    "id": 1,
    "nombre": "Efectivo"
  }
]
```