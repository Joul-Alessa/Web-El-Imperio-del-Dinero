# El Imperio del Dinero — Requerimientos del Sistema

Este documento reúne todos los requerimientos funcionales y conceptuales discutidos, incluyendo ejemplos reales de movimientos, cuentas, instituciones y casos de uso.

---

## 1. Objetivo del sistema
Crear una aplicación web familiar para registrar, consultar y analizar:
- ingresos
- gastos
- movimientos entre cuentas
- inversiones (renta fija y renta variable)
- acumulados configurables
- filtros avanzados por persona, fecha, cuenta, institución, instrumento y divisa

El sistema reemplaza un Excel actual y elimina el cuello de botella de tener un solo archivo.

---

## 2. Datos que se registran actualmente en Excel
Cada movimiento contiene:
- Fecha
- Persona
- Tipo (ingreso / gasto)
- Cuenta financiera
- Descripción
- Monto (siempre positivo)

El Excel calcula:
- suma para ingresos
- resta para gastos
- saldos por cuenta

---

## 3. Requerimientos de agrupación

### 3.1 Agrupación por fecha
El sistema debe permitir:
- ver todos los movimientos de un día
- ver el “cierre del día” (saldo neto)
- elegir si se muestra detalle o solo cierre
- graficar movimientos diarios y acumulados

### 3.2 Agrupación por persona
El sistema debe permitir:
- ver movimientos de una persona
- ver movimientos de varias personas sumados
- ver líneas separadas por persona en gráficas
- combinar personas libremente

### 3.3 Acumulados configurables
El usuario debe poder elegir:
- acumulado desde todos los tiempos
- acumulado desde un periodo específico
- acumulado que inicia en cero
- acumulado que arrastra saldo previo

### 3.4 Agrupación por cuentas financieras
El sistema debe permitir filtrar por:
- tipo de cuenta (efectivo, débito, crédito, apartado, inversión)
- institución (BBVA, Openbank, Santander, Plata Card, CETES Directo, GBM)
- persona dueña de la cuenta
- combinaciones personalizadas

Ejemplos:
- ver solo efectivo
- ver solo tarjetas de débito
- ver todas las cuentas BBVA de toda la familia
- ver tu débito BBVA + tu apartado Openbank + la débito Santander de tu hermano

---

## 4. Requerimientos de inversión

### 4.1 Renta fija
El sistema debe soportar:
- CETES
- BONOS
- UDIBONOS
- BONDDIA

Cada instrumento puede tener:
- plazo (1 mes, 3 meses, 2 años)
- divisa base (MXN)
- institución origen (CETES Directo)

### 4.2 Renta variable
El sistema debe soportar:
- acciones (ej. NVIDIA)
- ETFs (ej. VOO, NAFTAMEX)
- múltiples instituciones (Plata Card, GBM)
- múltiples divisas (MXN, USD)

Debe permitir:
- registrar cantidad de títulos
- registrar precio unitario
- registrar divisa del movimiento
- combinar posiciones entre instituciones

Ejemplo:
> “¿Cuánto tengo invertido en NVIDIA entre Plata Card y GBM juntas?”

### 4.3 Movimientos entre cuentas e instrumentos
El sistema debe registrar correctamente:
- salida de MXN desde una cuenta (ej. Ahorro Inteligente)
- compra de un instrumento en USD (ej. NVIDIA)
- conversión de divisa
- cantidad de títulos adquiridos

---

## 5. Ejemplo completo de movimiento:  
### Transferencia desde Ahorro Inteligente (MXN) → compra de NVIDIA (USD)

Supuestos:
- 90 MXN salen del Ahorro Inteligente
- se compran 5 USD de NVIDIA
- tipo de cambio: 1 USD = 18 MXN
- cantidad adquirida: 0.02 acciones
- precio unitario: 250 USD
- institución: Plata Card

#### Movimiento 1 — salida de MXN
- persona: Joul  
- cuenta: Ahorro Inteligente (Plata Card)  
- tipo: inversión_compra  
- monto: 90 MXN  
- divisa: MXN  
- descripción: “Transferencia para compra de NVIDIA (equivalente a 5 USD)”

#### Movimiento 2 — compra de NVIDIA
- persona: Joul  
- cuenta: NVIDIA en Plata Card  
- tipo: inversión_compra  
- monto: 5 USD  
- divisa: USD  
- instrumento: NVIDIA  
- cantidad: 0.02 acciones  
- precio_unitario: 250 USD  
- descripción: “Compra de 0.02 acciones de NVIDIA a 250 USD”

---

## 6. Requerimientos de visualización
El sistema debe permitir:
- gráficas por persona
- gráficas por cuenta
- gráficas por institución
- gráficas por instrumento
- gráficas por divisa
- acumulados configurables
- comparaciones entre personas, cuentas o instrumentos

---

## 7. Requerimientos de extensibilidad
El modelo debe permitir agregar:
- nuevas instituciones (ej. Actinver, Kuspit)
- nuevas divisas (EUR)
- nuevos instrumentos (acciones, ETFs, bonos)
- nuevas cuentas financieras
- nuevos tipos de movimientos

Sin romper el diseño actual.

