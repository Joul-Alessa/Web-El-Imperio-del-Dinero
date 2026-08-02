# El Imperio del Dinero — Diseño de Base de Datos

Este documento describe el modelo de datos acordado para soportar:
- ingresos y gastos
- cuentas financieras
- instituciones
- divisas
- instrumentos financieros
- inversiones en renta fija y variable
- movimientos complejos entre cuentas e instrumentos

---

# 1. Entidad: Personas

Representa a cada miembro de la familia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| nombre | string | Nombre visible |

---

# 2. Entidad: Instituciones

Incluye bancos, fintechs, brokers, gobierno, etc.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| nombre | string | BBVA, Openbank, CETES Directo, GBM |
| tipo | string | banco, fintech, broker, gobierno |

---

# 3. Entidad: Divisas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| código | string | MXN, USD |
| nombre | string | Peso mexicano, Dólar estadounidense |
| símbolo | string | $, US$ |

---

# 4. Entidad: InstrumentosFinancieros

Representa activos financieros.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| nombre | string | CETES, BONDDIA, NVIDIA, VOO |
| tipo | string | renta fija, renta variable, ETF |
| riesgo | string | bajo, medio, alto |
| divisa_base | FK → Divisas | MXN, USD |
| institución_origen | string | CETES Directo, NASDAQ, BMV |
| metadata | JSON | Opcional |

---

# 5. Entidad: CuentasFinancieras

Representa cualquier lugar donde hay dinero.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| persona_id | FK → Personas | Dueño de la cuenta |
| institución_id | FK → Instituciones | Banco, fintech, broker |
| tipo | string | efectivo, débito, crédito, apartado, inversión |
| instrumento_id | FK → InstrumentosFinancieros (opcional) | Para cuentas de inversión |
| divisa_id | FK → Divisas | MXN, USD |
| nombre | string | Nombre visible |
| plazo | string (opcional) | 1 mes, 3 meses, 2 años |
| cantidad | decimal (opcional) | Acciones o títulos |
| valor_compra | decimal (opcional) | Precio de compra |
| valor_actual | decimal (opcional) | Precio actual |
| descripción | string | Opcional |

### Ejemplos:
- Ahorro Inteligente (Plata Card) → apartado, MXN  
- CETES 1 mes → inversión, instrumento CETES, MXN  
- NVIDIA en Plata Card → inversión, instrumento NVIDIA, USD  
- NVIDIA en GBM → inversión, instrumento NVIDIA, USD  
- Débito BBVA Nómina → débito, MXN  
- Efectivo → efectivo, MXN  

---

# 6. Entidad: Movimientos

Registra ingresos, gastos, transferencias e inversiones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | Identificador |
| fecha | date | Fecha del movimiento |
| persona_id | FK → Personas | Quién lo hizo |
| cuenta_id | FK → CuentasFinancieras | Dónde ocurrió |
| tipo | string | ingreso, gasto, inversión_compra, inversión_venta, transferencia |
| monto | decimal | Monto en la divisa de la cuenta |
| divisa_id | FK → Divisas | MXN, USD |
| instrumento_id | FK → InstrumentosFinancieros (opcional) | Para inversiones |
| cantidad | decimal (opcional) | Acciones o títulos |
| precio_unitario | decimal (opcional) | Precio por unidad |
| descripción | string | Texto libre |

---

# 7. Ejemplo completo de movimientos

### Movimiento 1 — salida de MXN desde Ahorro Inteligente
| Campo | Valor |
|-------|--------|
| persona_id | Joul |
| cuenta_id | Ahorro Inteligente |
| tipo | inversión_compra |
| monto | 90 |
| divisa | MXN |
| descripción | Transferencia para compra de NVIDIA |

### Movimiento 2 — compra de NVIDIA en Plata Card
| Campo | Valor |
|-------|--------|
| persona_id | Joul |
| cuenta_id | NVIDIA en Plata Card |
| tipo | inversión_compra |
| monto | 5 |
| divisa | USD |
| instrumento | NVIDIA |
| cantidad | 0.02 |
| precio_unitario | 250 |
| descripción | Compra de 0.02 acciones de NVIDIA |

---

# 8. Extensibilidad del modelo

Este diseño permite agregar:
- nuevas instituciones (Actinver, Kuspit)
- nuevas divisas (EUR)
- nuevos instrumentos (acciones, ETFs, bonos)
- nuevas cuentas financieras
- nuevos tipos de movimientos

Sin romper la estructura existente.

