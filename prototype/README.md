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

### 5.5. Verificación de Código y Calidad (Lint & Build)

```bash
# Análisis estático rápido (0 warnings, 0 errors)
npm run lint

# Verificación de tipos TypeScript y empaquetado de producción
npm run build
```

### 5.6. Ejecución de Suites de Pruebas Automatizadas

TraceFlow cuenta con 9 suites de pruebas unitarias y de integración que verifican las máquinas de estado, reglas SoD, permisos RBAC e integridad criptográfica:

```bash
npm test
```

Suites incluidas en el runner oficial:
1. `rfc.service.spec.mjs`: Registro formal de RFC (`CU-04`) y restricciones SoD.
2. `rfc.views.spec.mjs`: Bandeja y expediente 360°, aislamiento multitenant.
3. `rfc.validation.spec.mjs`: Admisión formal (`CU-05`) y subsanación (`CU-04.1`).
4. `auth.spec.mjs`: Validación de credenciales y protección de rutas.
5. `navigation.spec.mjs`: Matriz de navegación lateral contextual por rol.
6. `impactAnalysis.spec.mjs`: Dictamen e informe técnico de impacto (`CU-06`).
7. `minorApproval.spec.mjs`: Doble llave delegada en cambios menores (`CU-30`).
8. `ccb.spec.mjs`: Deliberación colegiada del CCB (`CU-07`).
9. `enterprise.rbac.spec.mjs`: Suite de seguridad empresarial, Default-Deny y SoD.

---

## 6. Autenticación y Cuentas Institucionales

El acceso al sistema requiere correo institucional y contraseña, eliminando la selección pública de identidades:

| ID Usuario | Nombre | Correo Institucional | Rol Principal | Rol Secundario | Proyectos Asignados |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **USR-001** | Joan Cristian Medina Quispe | `jmedina@exodo.pe` | **PU-02** (Gestor) | **PU-01** (Solicitante) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-002** | Renzo Antonio Antayhua Mamani | `rantayhua@exodo.pe` | **PU-03** (Arquitecto) | **PU-06** (Desarrollador) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-003** | Augusto Joaquin Rivera Muñoz | `arivera@exodo.pe` | **PU-05** (Bibliotecario)| **PU-07** (Calidad/QA) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-004** | Renzo Fernando Loyola Vilca Choque | `rloyola@exodo.pe` | **PU-04** (CCB) | *(Ninguno)* | PRJ-001, PRJ-002 *(Veto: PRJ-003)* |

* **Aprovisionamiento Seguro de Credenciales:** El repositorio no publica contraseñas ni hashes en texto claro. La configuración y actualización de credenciales para entorno local se realiza mediante el procedimiento seguro de aprovisionamiento (`authService.setLocalPassword`).
* **Políticas clave:**
  * **Un solo rol efectivo por sesión:** Si una cuenta posee más de un rol asignado, el usuario debe seleccionar el rol con el que operará al momento de autenticar.
  * **Default-Deny:** Toda ruta no asignada explícitamente queda bloqueada por defecto.
  * **Aislamiento Multitenant:** `USR-004` tiene vetado el acceso a `PRJ-003`.
  * **Ownership en Solicitudes:** Los solicitantes (`PU-01`) solo pueden ver sus propios expedientes.
  * **Doble Llave:** Cambios menores requieren firmas obligatorias de Gestor (`PU-02`) y Arquitecto (`PU-03`) emitidas por dos identidades físicas diferentes.

---

## 7. Aviso de Dependencia de Backend para Producción

La presente versión corresponde a una aplicación de cliente enriquecido (React SPA). Los controles de acceso, hash criptográfico y SoD operan rigurosamente en la capa de servicios y Zustand en el cliente. Para despliegues en producción real con valor legal y auditoría regulatoria, se requiere integrar un backend confiable con tokens firmados por servidor (`HttpOnly`), base de datos relacional y persistencia inmutable en base de datos.
