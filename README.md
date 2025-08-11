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
├── racional-app/        # Frontend (Next.js)
│   ├── src/               # Código fuente del frontend
│   └── README.md          # Documentación del frontend
└── README.md              # Este archivo
```

## 🚀 Tecnologías Utilizadas

### Backend (`racional-api`)
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM/Prisma
- **Testing**: Jest

### Frontend (`racional-front`)
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
cd racional-front
npm install
npm run dev
```

