# TraceFlow SCM — Prototipo Navegable React SPA

> **Sistema de Gestión de Configuración de Software y Control de Cambios**  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Equipo de Desarrollo:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)  
> **Curso:** Gestión de la Configuración de Software — EPIS / UPT (2026)  
> **Fase Actual:** Fase II — Arquitectura Base y Configuración Inicial de la SPA  

---

## 1. Descripción

Este directorio (`prototype/`) contiene la aplicación web cliente (SPA) de **TraceFlow SCM**, construida con fines académicos y de demostración interactiva de los flujos formales de SCM, control de cambios y gestión de bibliotecas según los estándares **IEEE 828** e **ISO/IEC/IEEE 12207**.

---

## 2. Stack Tecnológico

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador y Servidor Dev:** [Vite 8](https://vite.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Enrutamiento:** [React Router v7](https://reactrouter.com/)
- **Gestión de Estado:** [Zustand v5](https://github.com/pmndrs/zustand)
- **Iconografía:** [Lucide React](https://lucide.dev/)

---

## 3. Estructura del Proyecto

La estructura del código fuente sigue rigurosamente la arquitectura aprobada en la Sección 6 de `docs/PROTOTYPE_SPECIFICATION.md`:

```text
prototype/
├── index.html                   # HTML base de la SPA
├── package.json                 # Dependencias y scripts
├── vite.config.ts               # Configuración Vite + Tailwind CSS plugin
├── tsconfig.json                # Configuración TypeScript
└── src/
    ├── types/                   # Contratos y tipos TypeScript normativos
    │   ├── auth.ts              # Usuarios y 7 Roles Canónicos (PU-01 a PU-07)
    │   ├── project.ts           # Proyectos aislados de ÉXODO S.A.C.
    │   ├── ecs.ts               # Elementos de Configuración y Bibliotecas
    │   ├── rfc.ts               # 14 Estados de RFC (TB-07/DG-11) y Evaluación
    │   ├── ecn.ts               # Órdenes de Cambio ECN/ECO
    │   ├── qa.ts                # Validaciones QA, No Conformidades y Acta UAT
    │   ├── baseline.ts          # Líneas Base (mayor.menor.parche) y Rollback
    │   ├── incident.ts          # Incidencias y Derivación a RFC
    │   ├── audit.ts             # Bitácora Forense y Firmas SHA-256
    │   └── index.ts             # Re-exportación centralizada de tipos
    ├── data/                    # Semillas de datos simulados (Fase IV)
    ├── services/                # Servicios de negocio desacoplados (Mock API)
    ├── store/                   # Stores Zustand (useAuthStore, etc.)
    ├── components/
    │   ├── layout/              # Shell Global UWE, Topbar, Sidebar (Fase III)
    │   ├── common/              # Badges de estado, Tablas, Modales, Botones
    │   └── guards/              # RoleGuard y control de visibilidad
    ├── features/
    │   └── foundation/          # Vista inicial de verificación (Fase II)
    ├── routes/                  # Enrutador AppRouter (React Router)
    ├── App.tsx                  # Componente raíz
    ├── main.tsx                 # Punto de entrada
    └── index.css                # Estilos base con Tailwind CSS
```

---

## 4. Requisitos Previos

- **Node.js:** Versión 20+ (Recomendado: Node.js 24 LTS)
- **npm:** Versión 10+

---

## 5. Instrucciones de Instalación y Ejecución

### 5.1. Instalación de dependencias

Desde el directorio `prototype/`:

```bash
npm install
```

### 5.2. Modo de Desarrollo

Para iniciar el servidor local con Hot Module Replacement (HMR):

```bash
npm run dev
```

La aplicación estará disponible típicamente en: `http://localhost:5173/`

### 5.3. Compilación para Producción

Para compilar el proyecto y verificar los tipos TypeScript:

```bash
npm run build
```

Los artefactos optimizados se generarán en la carpeta `dist/`.

### 5.4. Vista previa de la compilación

```bash
npm run preview
```

---

## 6. Próximo Paso (Fase III)

- Construcción del **Shell Global corporativo** conforme a `DG-UWE-PRES-01`.
- Implementación de la barra superior (**Topbar**) con conmutador de usuario de demostración y notificaciones.
- Implementación del menú lateral (**Sidebar**) persistente estructurado según los **8 paquetes arquitecturales de DG-04**.
