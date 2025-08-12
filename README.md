# Racional Trading Platform - Monorepo

## 📌 Descripción General

Este monorepo contiene la plataforma completa de trading demo con dos proyectos principales:

- **`racional-api`** - Backend API en NestJS
- **`racional-app`** - Frontend en Next.js

## 🏗 Estructura del Proyecto

```
racional-test/
├── racional-api/          # Backend API (NestJS)
│   ├── src/               # Código fuente de la API
│   ├── test/              # Tests de la API
│   └── package.json       # Dependencias del backend
├── racional-app/          # Frontend (Next.js)
│   ├── src/
└── README.md              # Este archivo
```

## 🚀 Tecnologías Utilizadas

### Backend (`racional-api`)

- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Testing**: Jest

### Frontend (`racional-app`)

- **Framework**: React/Next.js
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand/Redux Toolkit

## 🛠 Instalación y Desarrollo

### Backend

```bash
cd racional-api
npm install
npm run start:dev
```

### Frontend

```bash
cd racional-app
npm install
npm run dev
```

# Uso del AI en desarrollo API

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
