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

## ⚙ Principios de Diseño

1. **Separación de Responsabilidades** — Las carteras manejan efectivo, los portafolios manejan activos.  
2. **Conciencia de Liquidación** — Las fechas de ejecución aseguran reportes financieros precisos.  
4. **Extensibilidad** — Fácil de agregar carteras multi-moneda, nuevos tipos de activos
5. **Auditabilidad** — Las marcas de tiempo y referencias externas permiten la reconciliación con sistemas externos.  


## 🏗 Entidades y Atributos

A continuación se muestra la **lista completa de entidades** con **todos los atributos**.


### **1. User**
Almacena información personal.

| Field       | Type          | Constraints                  | Description |
|-------------|--------------|------------------------------|-------------|
| id          | UUID         | PK                            | Identificador único para el usuario |
| name        | VARCHAR(100) | NOT NULL                      | Nombre completo del usuario |
| email       | VARCHAR(100) | NOT NULL, UNIQUE              | Dirección de correo electrónico |
| phone       | VARCHAR(20)  | NULLABLE                      | Número de teléfono |
| created_at  | TIMESTAMP    | DEFAULT now                   | Marca de tiempo de creación del registro |
| updated_at  | TIMESTAMP    | Auto-actualización                   | Marca de tiempo de última actualización |

---

### **2. Wallet**
Contiene el efectivo disponible actual para un usuario.

| Field       | Type          | Constraints                  | Description |
|-------------|--------------|------------------------------|-------------|
| id          | UUID         | PK                            | Identificador único de la cartera |
| user_id     | UUID         | FK → User.id, UNIQUE          | Propietario de la cartera |
| balance     | DECIMAL(15,2)| NOT NULL, DEFAULT 0.00        | Efectivo disponible actual |
| currency    | VARCHAR(3)   | NOT NULL, DEFAULT 'USD'       | Código ISO de moneda |
| updated_at  | TIMESTAMP    | Auto-actualización                   | Marca de tiempo de última actualización del saldo |

---

### **3. Portfolio**
Agrupación lógica de inversiones.

| Field       | Type          | Constraints                  | Description |
|-------------|--------------|------------------------------|-------------|
| id          | UUID         | PK                            | Identificador único del portafolio |
| user_id     | UUID         | FK → Portfolio.id             | Propietario del portafolio |
| name        | VARCHAR(100) | NOT NULL                      | Nombre del portafolio |
| description | TEXT         | NULLABLE                      | Descripción del portafolio |
| created_at  | TIMESTAMP    | DEFAULT now                   | Marca de tiempo de creación del registro |
| updated_at  | TIMESTAMP    | Auto-actualización                   | Marca de tiempo de última actualización |

---

### **4. PortfolioStock**
Rastrea las tenencias actuales en un portafolio.

| Field        | Type          | Constraints                  | Description |
|--------------|--------------|------------------------------|-------------|
| id           | UUID         | PK                            | Identificador único |
| portfolio_id | UUID         | FK → Portfolio.id             | Referencia del portafolio |
| stock_id     | UUID         | FK → Stock.id                  | Referencia de la acción |
| shares    | DECIMAL(15,4)| NOT NULL                      | Número de acciones en tenencia |
| investment_amount    | DECIMAL(15,2)| NOT NULL                      | Monto total invertido en tenencias actuales |
| updated_at   | TIMESTAMP    | Auto-actualización                   | Marca de tiempo de última actualización |

---

### **5. Stock**
Representa un activo del mercado.

| Field       | Type          | Constraints                  | Description |
|-------------|--------------|------------------------------|-------------|
| id          | UUID         | PK                            | Identificador único |
| symbol      | VARCHAR(10)  | NOT NULL, UNIQUE              | Símbolo ticker de la acción |
| name        | VARCHAR(100) | NOT NULL                      | Nombre de la empresa o activo |
| market      | VARCHAR(50)  | NULLABLE                      | Nombre del mercado (ej., NASDAQ) |
| current_price | DECIMAL(15,2)  |  NOT NULL, CHECK > 0                | Último precio de mercado conocido |
| created_at  | TIMESTAMP    | DEFAULT now                   | Marca de tiempo de creación del registro |

---

### **6. Transaction**
Representa movimientos de efectivo (depósitos/retiros).

| Field           | Type          | Constraints                  | Description |
|-----------------|--------------|------------------------------|-------------|
| id              | UUID         | PK                            | Identificador único |
| wallet_id       | UUID         | FK → Wallet.id                | Referencia de la cartera |
| type            | ENUM('DEPOSIT','WITHDRAWAL') | NOT NULL | Tipo de transacción |
| amount          | DECIMAL(15,2)| NOT NULL, CHECK > 0           | Monto de la transacción |
| execution_date  | DATE         | NULLABLE                      | Fecha cuando se liquidan los fondos |
| external_ref_id | VARCHAR(100) | NULLABLE, UNIQUE if present   | ID de referencia del sistema externo |
| created_at      | TIMESTAMP    | DEFAULT now                   | Marca de tiempo de creación del registro |

---

### **7. TradeOrder**
Representa órdenes de compra/venta de acciones.

| Field           | Type          | Constraints                  | Description |
|-----------------|--------------|------------------------------|-------------|
| id              | UUID         | PK                            | Identificador único |
| wallet_id       | UUID         | FK → Wallet.id                | Referencia de la cartera |
| portfolio_id    | UUID         | FK → Portfolio.id             | Referencia del portafolio |
| stock_id        | UUID         | FK → Stock.id                  | Referencia de la acción |
| type            | ENUM('BUY','SELL') | NOT NULL                 | Tipo de orden |
| quantity        | DECIMAL(15,4)| NOT NULL, CHECK > 0           | Número de acciones |
| price           | DECIMAL(15,2)| NOT NULL, CHECK > 0           | Precio por acción |
| execution_date  | DATE         | NULLABLE                      | Fecha cuando se liquida la operación |
| external_ref_id | VARCHAR(100) | NULLABLE, UNIQUE if present   | ID de orden del broker externo |
| created_at      | TIMESTAMP    | DEFAULT now                   | Marca de tiempo de creación del registro |

---



# Uso del AI

1. En primer paso, pedi al AI que diseñamos juntos el modelo de datos, desde su primer output, le fui dando sugerencias en el camino para complementar y verificar que el diseño sea pertinente al problema, lo mas importante son los siguientes: 

    1. **Introducción de la Cartera (Wallet)**  
    Inicialmente el modelo no contemplaba una cartera de efectivo. Se añadió para garantizar que las compras de acciones solo sean posibles si el usuario dispone de fondos suficientes, evitando saldos negativos y asegurando la integridad financiera.

    2. **Fecha de Ejecución en Transacciones**  
    En el mundo financiero, la fecha en la que se crea una transacción no siempre coincide con la fecha en la que se liquida. Por eso se añadió el campo `execution_date` tanto en `Transaction` como en `TradeOrder` para reflejar la **conciencia de liquidación** (settlement awareness).

    3. **ID de Referencia Externa**  
    Se incorporó el campo `external_ref_id` para vincular transacciones y órdenes con sistemas externos (bancos, brokers, pasarelas de pago). Esto mejora la **auditabilidad** y permite la **conciliación** con datos externos.

    4. **Ubicación del Precio de la Acción**  
    Inicialmente el precio se almacenaba en `PortfolioStock`, pero esto generaría demasiadas escrituras en la base de datos cada vez que el precio cambiara. Se movió el campo `current_price` a la entidad `Stock`, de forma que el valor de la cartera se calcule dinámicamente con el precio más reciente. Esto mejora el **rendimiento** y la **escalabilidad**.

    5. **Monto Invertido en Lugar de Precio Promedio**  
    Se reemplazó `avg_price` por `investment_amount` en `PortfolioStock`. Esto permite calcular de forma directa las ganancias/pérdidas sin tener que recalcular desde todas las operaciones históricas, y facilita el manejo de ventas parciales y dividendos.

    6. **Ganancias/Pérdidas Realizadas y No Realizadas Calculadas en Tiempo Real**  
    Se decidió **no almacenar** `realized_pl` ni `unrealized_pl` en la base de datos para evitar actualizaciones constantes y riesgos de inconsistencia.  

    7. **Optimización de Rendimiento en Posiciones**  
    En `PortfolioStock` solo se almacenan los datos esenciales (`quantity` y `investment_amount`), y el valor de mercado se calcula dinámicamente a partir de `Stock.current_price`. Esto reduce la carga de escritura y mantiene la base de datos ligera.

