# Guía de Diseño y Experiencia de Usuario Empresarial (Enterprise UX Guidelines)
## TraceFlow SCM — Estándares Visuales, Arquitectura de Interfaz y Tokens Corporativos

> **Organización Cliente:** ÉXODO S.A.C.  
> **Sistema:** TraceFlow SCM — Versión Empresarial 2.0  
> **Fecha:** 11 de Noviembre de 2026  
> **Documento:** `docs/refactor/ENTERPRISE_UX_GUIDELINES.md`  
> **Marco Normativo:** IEEE 828, ISO/IEC/IEEE 12207, SRS (`FD03`), SAD Diseño (`FD05`)

---

## 1. Principios de Experiencia de Usuario Corporativa

La interfaz de usuario de **TraceFlow SCM** está diseñada para proporcionar un entorno de trabajo de alta confiabilidad, precisión operativa y legibilidad para ingenieros de software, directores técnicos y auditores de configuración.

### 1.1. Principios Rectores:
1. **Claridad Operativa sobre Explicación Didáctica:** Los elementos visuales deben transmitir inmediatamente el estado del sistema, las acciones requeridas y las restricciones de seguridad, sin recurrir a párrafos teóricos o explicaciones metodológicas.
2. **Densidad de Información Eficiente:** La gestión de configuración requiere visualizar correlativos, versiones semánticas, firmas criptográficas y trazabilidad cruzada. Las tablas, tarjetas y formularios deben maximizar el área útil sin saturar visualmente.
3. **Visibilidad de Estado y Trazabilidad:** Todo registro de cambio debe reflejar de forma inequívoca su posición en la máquina de estados canónica (TB-07), el rol firmante y la integridad del expediente.
4. **Seguridad y Segregación Visual:** Los controles que representen operaciones no autorizadas para el rol efectivo activo deben reflejar su bloqueo con retroalimentación clara de permisos, o no renderizarse si comprometen la confidencialidad.

---

## 2. Reglas de Desacademicización de la Interfaz

Para transformar el prototipo en una herramienta de nivel empresarial, se establecieron las siguientes reglas mandatarias de presentación visual:

### 2.1. Supresión de Nomenclatura Académica en Superficie
* **Prefijos Técnicos Ocultos de la Vista del Usuario:**
  * Quedan eliminados de títulos, botones, tarjetas e indicadores los códigos: `SCREEN-XX`, `WF-XX`, `PRES-XX`, `CU-XX`, `RF-XX`, `RN-XX`, `DG-XX`.
  * *Excepción:* Los códigos normativos se conservan íntegramente en los comentarios de código fuente, nombres de pruebas automatizadas y documentación técnica de ingeniería para preservar la trazabilidad hacia el SRS (`FD03`) y SAD (`FD04`/`FD05`).
* **Sustitución por Terminología de Negocio:**
  * En lugar de *"Fase CU-05: Admisión formal"*, utilizar: *"Clasificación y Admisión de Solicitud"*.
  * En lugar de *"SCREEN-05: Bandeja de RFC"*, utilizar: *"Bandeja de Solicitudes de Cambio"*.
  * En lugar de *"CU-06: Formulación de Dictamen"*, utilizar: *"Informe Técnico de Impacto"*.
  * En lugar de *"CU-07: Deliberación Colegiada"*, utilizar: *"Sesión de Deliberación CCB"*.
  * En lugar de *"CU-30: Doble Llave"*, utilizar: *"Autorización Delegada de Cambio Menor"*.

### 2.2. Supresión de Controles Demostrativos
* **Eliminación del Botón Reset Demo:** El control de restablecimiento de datos locales que se mostraba en la barra superior (`Topbar.tsx`) fue eliminado por constituir un riesgo operacional y conferir apariencia de simulador.
* **Eliminación de Tarjetas de Suplantación de Identidad:** La pantalla de inicio de sesión (`LoginView.tsx`) no debe mostrar listas públicas de cuentas ni botones de acceso sin contraseña.

---

## 3. Tokens Visuales y Paleta Corporativa (ÉXODO S.A.C. / UPT)

TraceFlow SCM utiliza un sistema de diseño institucional sobrio, basado en la identidad corporativa de ÉXODO S.A.C. e integrado con los tokens de Tailwind CSS:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SISTEMA DE COLORES INSTITUCIONALES                   │
├─────────────────────┬──────────────┬───────────────────────────────────┤
│ Token               │ Hexadecimal  │ Propósito Funcional               │
├─────────────────────┼──────────────┼───────────────────────────────────┤
│ `upt-primary`       │ `#0F2C59`    │ Azul Institucional Primario (Nav) │
│ `upt-secondary`     │ `#3085C3`    │ Azul Corporativo Secundario (CTA) │
│ `upt-institutional` │ `#0a1c38`    │ Azul Marino Profundo (Cabeceras)  │
│ `upt-bright`        │ `#1E3A8A`    │ Azul Real Acentuado               │
│ `upt-yellow`        │ `#F8DE22`    │ Amarillo Acento Éxodo (Indicador) │
│ `upt-bg`            │ `#F5F5F7`    │ Fondo Claro de Superficie         │
│ `upt-surface`       │ `#FFFFFF`    │ Contenedor y Tarjetas             │
│ `upt-border`        │ `#E5E7EB`    │ Bordes y Separadores Neutros      │
│ `upt-text`          │ `#1F2937`    │ Texto Principal de Alta Lectura   │
│ `upt-muted`         │ `#6B7280`    │ Metadatos y Texto Secundario      │
└─────────────────────┴──────────────┴───────────────────────────────────┘
```

### 3.1. Semántica de Estados de RFC (TB-07)
* **Borrador / Registrada:** `bg-blue-50 text-blue-700 border-blue-200`
* **En Evaluación / Deliberación:** `bg-amber-50 text-amber-700 border-amber-200`
* **Autorizada / Aprobada:** `bg-emerald-50 text-emerald-700 border-emerald-200`
* **Rechazada / Desestimada:** `bg-red-50 text-red-700 border-red-200`
* **En Implementación / Verificación:** `bg-purple-50 text-purple-700 border-purple-200`
* **Cerrada:** `bg-slate-100 text-slate-700 border-slate-300`

---

## 4. Estructura de Diseño de Componentes Principales

### 4.1. Barra Superior Corporativa (`Topbar.tsx`)
* **Identidad y Contexto:** Logotipo de TraceFlow SCM, indicador de versión estable (`v2.0`) y selector de proyecto activo.
* **Aislamiento Multitenant:** El menú desplegable de proyectos solo lista los proyectos formalmente autorizados para la cuenta autenticada.
* **Perfil de Usuario:** Muestra el nombre completo del colaborador, correo corporativo, rol efectivo activo y opción de cierre de sesión seguro.

### 4.2. Navegación Lateral (`Sidebar.tsx`)
* **Agrupación Modular:** Organizado en secciones lógicas (Gobernanza, Control de Cambios, Bibliotecas SCM, Auditoría).
* **Colapso Inteligente:** Permite expandir o contraer subsecciones conservando el estado en la sesión.
* **Indicador de Rol:** El encabezado del menú lateral refleja explícitamente el perfil activo bajo el cual se está operando.

### 4.3. Bandejas y Tablas de Datos (`RfcListView.tsx`, `EcsListView.tsx`)
* **Encabezados Claros:** Columnas con anchos proporcionales, identificadores correlativos monoespaciados (`RFC-2026-0001`) y chips de estado visualmente distintivos.
* **Filtros Funcionales:** Búsqueda textual por título o justificación, filtro por severidad/clasificación y filtro por estado del ciclo de vida.
* **Paginación y Conteos Reales:** Visualización precisa del número de registros coincidentes sin fabricar métricas ficticias.

### 4.4. Formularios Operativos (`LoginView.tsx`, `RfcCreateView.tsx`, `RfcEditView.tsx`)
* **Asistente por Pasos (Wizard):** División lógica de formularios extensos en etapas secuenciales (Datos Básicos, Justificación, Elementos Afectados, Confirmación).
* **Validación en Tiempo Real:** Señalización inmediata de campos requeridos o que infrinjan reglas de negocio del SRS (E1 y E2).
* **Banners de Error Estructurados:** Los mensajes de rechazo o error muestran icono, descripción clara de la regla incumplida y sugerencia de acción correctiva.

---

## 5. Accesibilidad y Ergonomía Visual

* **Contraste de Color:** Todas las combinaciones de texto contra fondo superan la relación de contraste 4.5:1 exigida por WCAG 2.1 nivel AA.
* **Enfoque de Teclado:** Todos los campos interactivos, botones y selectores disponen de estados `:focus-visible` claramente delineados con anillos de acento (`ring-2 ring-upt-bright`).
* **Tipografía:** Tipografía Sans-Serif de alta legibilidad (`Inter` / `system-ui`) con escalas jerárquicas balanceadas (H1: 20px bold, H2: 16px bold, Body: 14px regular, Meta: 12px medium).
