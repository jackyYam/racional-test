# Plataforma de Trading Demo

## 📌 Descripción General

Este proyecto es para una **API de Gestión de Inversiones** que permite a los usuarios:

- Gestionar información personal
- Mantener una cartera para el saldo de efectivo
- Depositar y retirar fondos
- Comprar y vender acciones
- Rastrear el rendimiento de la cartera
- Ver historial de transacciones y operaciones

El diseño es **escalable**, **mantenible** y **consciente de la liquidación** — lo que significa que distingue entre la **fecha de creación de la orden** y la **fecha de ejecución** cuando los fondos o activos realmente cambian de manos.

Cabe destacar que hice este backend pensando que es un **backend for frontend**, esto se ve reflejado en la respuesta que traen ciertos endpoints para optimizar el UX (Paginación, separación de responsabilidades para loading time, traer lo justo y necesario)

## ⚙ Principios de Diseño

1. **Separación de Responsabilidades** — Las carteras manejan efectivo, los portafolios manejan activos.
2. **Conciencia de Liquidación** — Las fechas de ejecución aseguran reportes financieros precisos.
3. **Extensibilidad** — Fácil de agregar carteras multi-moneda, nuevos tipos de activos
4. **Auditabilidad** — Las marcas de tiempo y referencias externas permiten la reconciliación con sistemas externos.

## 🏗 Entidades y Atributos

A continuación se muestra la **lista completa de entidades** con **todos los atributos**.

### **1. User**

Almacena información personal.

| Field      | Type         | Constraints        | Description                              |
| ---------- | ------------ | ------------------ | ---------------------------------------- |
| id         | UUID         | PK                 | Identificador único para el usuario      |
| name       | VARCHAR(100) | NOT NULL           | Nombre completo del usuario              |
| email      | VARCHAR(100) | NOT NULL, UNIQUE   | Dirección de correo electrónico          |
| phone      | VARCHAR(20)  | NULLABLE           | Número de teléfono                       |
| created_at | TIMESTAMP    | DEFAULT now        | Marca de tiempo de creación del registro |
| updated_at | TIMESTAMP    | Auto-actualización | Marca de tiempo de última actualización  |

---

### **2. Wallet**

Contiene el efectivo disponible actual para un usuario.

| Field      | Type          | Constraints             | Description                                       |
| ---------- | ------------- | ----------------------- | ------------------------------------------------- |
| id         | UUID          | PK                      | Identificador único de la cartera                 |
| user_id    | UUID          | FK → User.id, UNIQUE    | Propietario de la cartera                         |
| balance    | DECIMAL(15,2) | NOT NULL, DEFAULT 0.00  | Efectivo disponible actual                        |
| currency   | VARCHAR(3)    | NOT NULL, DEFAULT 'USD' | Código ISO de moneda                              |
| updated_at | TIMESTAMP     | Auto-actualización      | Marca de tiempo de última actualización del saldo |

---

### **3. Portfolio**

Agrupación lógica de inversiones.

| Field       | Type         | Constraints        | Description                              |
| ----------- | ------------ | ------------------ | ---------------------------------------- |
| id          | UUID         | PK                 | Identificador único del portafolio       |
| user_id     | UUID         | FK → Portfolio.id  | Propietario del portafolio               |
| name        | VARCHAR(100) | NOT NULL           | Nombre del portafolio                    |
| description | TEXT         | NULLABLE           | Descripción del portafolio               |
| created_at  | TIMESTAMP    | DEFAULT now        | Marca de tiempo de creación del registro |
| updated_at  | TIMESTAMP    | Auto-actualización | Marca de tiempo de última actualización  |

---

### **4. PortfolioStock**

Rastrea las tenencias actuales en un portafolio.

| Field             | Type          | Constraints        | Description                                 |
| ----------------- | ------------- | ------------------ | ------------------------------------------- |
| id                | UUID          | PK                 | Identificador único                         |
| portfolio_id      | UUID          | FK → Portfolio.id  | Referencia del portafolio                   |
| stock_id          | UUID          | FK → Stock.id      | Referencia de la acción                     |
| shares            | DECIMAL(15,4) | NOT NULL           | Número de acciones en tenencia              |
| investment_amount | DECIMAL(15,2) | NOT NULL           | Monto total invertido en tenencias actuales |
| sell_amount       | DECIMAL(15,2) |                    | Monto total vendido en tenencias actuales   |
| updated_at        | TIMESTAMP     | Auto-actualización | Marca de tiempo de última actualización     |

---

### **5. Stock**

Representa un activo del mercado.

| Field         | Type          | Constraints         | Description                              |
| ------------- | ------------- | ------------------- | ---------------------------------------- |
| id            | UUID          | PK                  | Identificador único                      |
| symbol        | VARCHAR(10)   | NOT NULL, UNIQUE    | Símbolo ticker de la acción              |
| name          | VARCHAR(100)  | NOT NULL            | Nombre de la empresa o activo            |
| market        | VARCHAR(50)   | NULLABLE            | Nombre del mercado (ej., NASDAQ)         |
| current_price | DECIMAL(15,2) | NOT NULL, CHECK > 0 | Último precio de mercado conocido        |
| created_at    | TIMESTAMP     | DEFAULT now         | Marca de tiempo de creación del registro |

---

### **6. Transaction**

Representa movimientos de efectivo (depósitos/retiros).

| Field           | Type                         | Constraints                 | Description                              |
| --------------- | ---------------------------- | --------------------------- | ---------------------------------------- |
| id              | UUID                         | PK                          | Identificador único                      |
| wallet_id       | UUID                         | FK → Wallet.id              | Referencia de la cartera                 |
| type            | ENUM('DEPOSIT','WITHDRAWAL') | NOT NULL                    | Tipo de transacción                      |
| amount          | DECIMAL(15,2)                | NOT NULL, CHECK > 0         | Monto de la transacción                  |
| execution_date  | DATE                         | NULLABLE                    | Fecha cuando se liquidan los fondos      |
| external_ref_id | VARCHAR(100)                 | NULLABLE, UNIQUE if present | ID de referencia del sistema externo     |
| created_at      | TIMESTAMP                    | DEFAULT now                 | Marca de tiempo de creación del registro |

---

### **7. TradeOrder**

Representa órdenes de compra/venta de acciones.

| Field           | Type               | Constraints                 | Description                              |
| --------------- | ------------------ | --------------------------- | ---------------------------------------- |
| id              | UUID               | PK                          | Identificador único                      |
| wallet_id       | UUID               | FK → Wallet.id              | Referencia de la cartera                 |
| portfolio_id    | UUID               | FK → Portfolio.id           | Referencia del portafolio                |
| stock_id        | UUID               | FK → Stock.id               | Referencia de la acción                  |
| type            | ENUM('BUY','SELL') | NOT NULL                    | Tipo de orden                            |
| quantity        | DECIMAL(15,4)      | NOT NULL, CHECK > 0         | Número de acciones                       |
| price           | DECIMAL(15,2)      | NOT NULL, CHECK > 0         | Precio por acción                        |
| execution_date  | DATE               | NULLABLE                    | Fecha cuando se liquida la operación     |
| external_ref_id | VARCHAR(100)       | NULLABLE, UNIQUE if present | ID de orden del broker externo           |
| created_at      | TIMESTAMP          | DEFAULT now                 | Marca de tiempo de creación del registro |

---

# Endpoints

## Autenticación

| Método | Endpoint         | Descripción                                |
| ------ | ---------------- | ------------------------------------------ |
| `POST` | `/auth/login`    | Iniciar sesión con credenciales de usuario |
| `POST` | `/auth/register` | Registrar un nuevo usuario                 |

## Usuarios

| Método | Endpoint         | Descripción                                          |
| ------ | ---------------- | ---------------------------------------------------- |
| `GET`  | `/users/profile` | Obtener perfil del usuario con cartera y portafolios |
| `PUT`  | `/users/profile` | Actualizar información del perfil del usuario        |

## Portafolios

| Método | Endpoint          | Descripción                                                |
| ------ | ----------------- | ---------------------------------------------------------- |
| `POST` | `/portfolios`     | Crear un nuevo portafolio                                  |
| `GET`  | `/portfolios`     | Obtener todos los portafolios del usuario                  |
| `GET`  | `/portfolios/:id` | Obtener resumen del portafolio con tenencias y rendimiento |
| `PUT`  | `/portfolios/:id` | Actualizar información del portafolio                      |

## Acciones

| Método | Endpoint  | Descripción                            |
| ------ | --------- | -------------------------------------- |
| `GET`  | `/stocks` | Obtener todas las acciones disponibles |

## Transacciones

| Método | Endpoint                    | Descripción                                            |
| ------ | --------------------------- | ------------------------------------------------------ |
| `POST` | `/transactions`             | Crear una transacción de depósito o retiro             |
| `GET`  | `/transactions`             | Obtener historial de transacciones del usuario         |
| `GET`  | `/transactions/:id`         | Obtener transacción específica por ID                  |
| `PUT`  | `/transactions/:id/execute` | Actualizar fecha de ejecución de transacción pendiente |

## Órdenes de Trading

| Método | Endpoint         | Descripción                                               |
| ------ | ---------------- | --------------------------------------------------------- |
| `POST` | `/trades/orders` | Crear y ejecutar una orden de compra/venta inmediatamente |
| `GET`  | `/trades/orders` | Obtener historial de órdenes de trading del usuario       |

---

## Autenticación

La mayoría de los endpoints requieren autenticación JWT. Incluye el token en el header:

```
Authorization: Bearer <your-jwt-token>
```

## Parámetros de Consulta

- **Paginación**: Los endpoints de listado soportan `page` y `limit`
  - `?page=1&limit=10` (valores por defecto)

## Referencias Externas

- **Documentación Postman**: [API Documentation](https://documenter.getpostman.com/view/37929525/2sB3BGHV5m)
- Algunos endpoints permiten `external_ref_id` para reconciliación con sistemas externos

# Posibles mejoras para el futuro

- Introducir historial de precios de las acciones
- Introducir más campos que faciliten el análisis de datos sobre rendimiento de portafolio
- Introducir selección de wallet al comprar
- Implementar una lógica de conciliación mejor con servicios externos de payment managing
