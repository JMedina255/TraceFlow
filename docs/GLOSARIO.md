# Glosario Oficial y Terminología Normativa — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Equipo Responsable:** C-SharkTeam (Medina Quispe, Antayhua Mamani, Loyola Vilca Choque, Rivera Muñoz)  
> **Documento:** `docs/GLOSARIO.md`  
> **Rama:** `docs/alineacion-srs-sad-2026-11-12`  
> **Estado:** Candidato a Aprobación (DOC-02.1)  
> **Fecha:** 25 de noviembre de 2026  

---

## 1. Propósito y Criterios Lingüísticos

Este glosario establece la terminología oficial en español que gobierna la documentación funcional, la arquitectura, la base de datos PostgreSQL, el backend NestJS, el frontend React y las pruebas automatizadas de **TraceFlow SCM**.

### Reglas de Normalización Terminológica
1. **Idioma de dominio:** Todo concepto propio del negocio de ÉXODO S.A.C. y del proceso de control de cambios se expresa en **español claro y sin ambigüedades** (sin tildes ni caracteres especiales en identificadores de código o SQL).
2. **Siglas normativas preservadas:** Se conservan las siglas universales de ingeniería SCM e industria cuando su traducción reduciría precisión o rompería trazabilidad normativa con IEEE 828, ISO/IEC/IEEE 12207, `FD03`, `FD04` y `FD05`: **`RFC`**, **`ECS`**, **`ECN/ECO`**, **`CCB`**, **`QA`**, **`UAT`**, **`RBAC`**, **`SoD`**, **`SCM`**, **`SRS`**, **`SAD`**, **`ADR`**.
3. **Convenciones técnicas de frameworks:** Los términos propios de los frameworks y protocolos subyacentes (`Controller`, `Service`, `Repository`, `Module`, `Guard`, `Dto`, `Hook use*`, `GET/POST/PATCH`, `Cookie HttpOnly`, `PostgreSQL`, `TLS`) mantienen su convención técnica estándar según [`docs/ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md).

---

## 2. Glosario Oficial del Dominio

| Término oficial | Equivalente en inglés | Sigla | Definición | Uso dentro del sistema |
|---|---|---:|---|---|
| **Solicitud de Cambio** | Change Request / Request for Change | `RFC` | Expediente formal que registra una necesidad de modificación correctiva, adaptativa o perfectiva sobre uno o más ECS, incluyendo justificación, prioridad y trazabilidad de estados. | Entidad central del flujo de cambios (`solicitud_cambio` / `change_request`, rutas `/api/v1/rfcs`, códigos `RFC-YYYY-NNNN`, 14 estados TB-07). |
| **Elemento de Configuración** | Configuration Item / Software Configuration Item | `ECS` | Artefacto de software o documentación sometido formalmente a control de versiones, custodia en bibliotecas, bloqueos de concurrencia y auditoría SHA-256. | Entidad `elemento_configuracion` (`config_item`), versiones inmutables `version_ecs` (`ecs_version`), códigos tipo `SRC-AUTH-JWT.ts`. |
| **Orden de Cambio** | Engineering Change Notice / Engineering Change Order | `ECN/ECO` | Instrumento técnico formal emitido tras la autorización de una RFC que instruye y asigna al desarrollador responsable la ejecución controlada del cambio. | Entidad `orden_cambio` (`change_order`), códigos `ECN-YYYY-NNNN`, habilita el Check-Out exclusivo en `CU-08` y `CU-10`. |
| **Línea Base** | Baseline | `LB` | Conjunto congelado e inmutable de versiones específicas de ECS (`version_ecs`) que representa una configuración aprobada, estable y verificada del proyecto. | Entidad `linea_base` (`baseline`) y detalle `elemento_linea_base` (`baseline_item`), protegidas por triggers de inmutabilidad en `CU-20`. |
| **Biblioteca de Trabajo** | Working Library | `TRABAJO` | Espacio de custodia temporal donde el desarrollador trabaja sobre copias en modificación de un ECS bajo bloqueo exclusivo de sincronización. | Valor `TRABAJO` en `biblioteca_actual` (`current_library`), usado durante `CU-10`, `CU-14` y `CU-15`. |
| **Biblioteca de Soporte** | Support / QA Library | `SOPORTE` | Espacio controlado de integración y pruebas donde se alojan las versiones candidatas para verificación de integración, certificación QA y aceptación UAT. | Valor `SOPORTE` en `biblioteca_actual` (`current_library`), usado durante `CU-16`, `CU-17` y `CU-29`. |
| **Biblioteca Maestra** | Master Library | `MAESTRA` | Repositorio definitivo de producción y custodia inmutable donde solo ingresan versiones certificadas por QA y aceptadas por UAT mediante Check-In formal. | Valor `MAESTRA` en `biblioteca_actual` (`current_library`), gobernado por el Bibliotecario (`PU-05`) en `CU-12` y `CU-20`. |
| **Bloqueo de Sincronización** | Synchronization Lock / Check-Out Lock | `LOCK` | Mecanismo pesimista exclusivo que impide modificaciones concurrentes sobre un mismo ECS mientras exista una orden de cambio en ejecución (`RN-06`). | Entidad `bloqueo_sincronizacion` (`sync_lock`) con índice único condicional activo y liberación solo por `CHECK_IN`, `ROLLBACK` o `CANCELED`. |
| **Informe de Impacto** | Technical Impact Assessment / Report | `TIA` | Dictamen técnico elaborado por el Arquitecto (`PU-03`) que evalúa afectación arquitectónica, dependencias, riesgos y la Triple Restricción (alcance, tiempo, costo) según `RN-05`. | Entidad `informe_impacto` (`impact_assessment`), códigos `TIA-YYYY-NNNN`, determina vía `CAMBIO_MENOR` o `CAMBIO_MAYOR` en `CU-06`. |
| **Autorización Delegada** | Delegated Minor Change Authorization | `DOBLE LLAVE` | Mecanismo ágil y segregado de aprobación para cambios clasificados como `CAMBIO_MENOR`, que exige dos firmas independientes y de identidades físicas distintas (`PU-02` Gestor + `PU-03` Arquitecto). | Entidad `autorizacion_delegada` (`change_authorization`) en `CU-30`, blindada por trigger `trg_enforce_double_key_segregation`. |
| **Comité de Control de Cambios** | Change Control Board | `CCB` | Órgano colegiado responsable de deliberar, votar de forma individual e irrevocable y emitir resoluciones formales sobre solicitudes clasificadas como `CAMBIO_MAYOR`. | Entidades `resolucion_ccb` (`ccb_resolution`) y `voto_ccb` (`ccb_vote`) en `CU-07`, con unicidad e inmutabilidad por votante (`SoD-05`). |
| **Certificación de Calidad** | QA Certification | `QA` | Dictamen técnico emitido por el Equipo de Calidad (`PU-07`) que acredita conformidad o no conformidad tras ejecutar pruebas de integración y regresión sobre una versión candidata. | Entidad `certificacion_qa` (`qa_certification`) en `CU-17`, incompatible por SoD con el desarrollador implementador (`PU-06`). |
| **Aceptación de Usuario** | User Acceptance Testing | `UAT` | Validación formal y suscripción de conformidad emitida por el Solicitante (`PU-01`) antes de promover el ECS a la Biblioteca Maestra (`RN-09`). | Entidad `aceptacion_uat` (`uat_acceptance`) en `CU-29`, prerrequisito junto con QA para el Check-In definitivo (`CU-12`). |
| **Incidencia** | Incident Ticket | `INC` | Registro operativo de falla, anomalía o desviación reportada en operación que puede ser diagnosticada y derivada formalmente a una nueva Solicitud de Cambio (`RFC`). | Entidad `incidencia` (`incident_ticket`) en `CU-23`, `CU-24` y `CU-25`, con trazabilidad bidireccional hacia `solicitud_cambio`. |
| **Registro de Auditoría** | Audit Log | `EVT` | Bitácora inmutable de solo inserción (`append-only`) encadenada criptográficamente mediante SHA-256 que registra toda operación crítica, actor, rol y marca temporal (`ADR-008`). | Entidad `registro_auditoria` (`audit_log`), función `registrar_auditoria` (`append_audit_log`) y trigger `trg_audit_log_immutable`. |

---

## 3. Términos Complementarios de Seguridad, Gobernanza y Operación

| Término oficial | Equivalente en inglés | Sigla | Definición | Uso dentro del sistema |
|---|---|---:|---|---|
| **Control de Acceso Basado en Roles** | Role-Based Access Control | `RBAC` | Modelo de autorización que restringe rutas, acciones y endpoints exclusivamente a los perfiles funcionales autorizados para el rol efectivo de la sesión. | Guards en NestJS (`GuardiaRoles`), matriz `PERMISOS_ACCION` y `RoleGuard` en React. |
| **Segregación de Funciones** | Separation of Duties | `SoD` | Principio de control interno que impide que una misma identidad acumule o ejerza roles incompatibles dentro de un mismo expediente (ej. solicitante vs evaluador, desarrollador vs QA, doble llave). | Validaciones en servicios NestJS, políticas en frontend y triggers en PostgreSQL (`SEC-04`, `SEC-05`). |
| **Perfil de Usuario** | User Role / Profile | `PU` | Cada uno de los 7 roles canónicos autorizados: `PU-01` Solicitante, `PU-02` Gestor, `PU-03` Arquitecto, `PU-04` Miembro CCB, `PU-05` Bibliotecario, `PU-06` Desarrollador, `PU-07` Calidad/QA. | Catálogo `rol_aplicacion` (`app_role`) y asignaciones `asignacion_rol_usuario` (`user_role_assignment`). |
| **Proyecto** | Project | `PRJ` | Unidad organizativa y de aislamiento multitenant que agrupa elementos de configuración, líneas base y solicitudes de cambio de un cliente o sistema específico. | Entidad `proyecto` (`project`) y tabla puente `asignacion_proyecto_usuario` (`user_project_assignment`). |
| **Sesión de Usuario** | User Session | `SES` | Registro opaco en servidor asociado a un token aleatorio cuyo hash SHA-256 se persiste en PostgreSQL y se transporta mediante cookie `HttpOnly` (`tf_session`) con expiración por inactividad (`ADR-006`). | Entidad `sesion_usuario` (`user_session`) y módulo `auth` en backend. |
| **Usuario** | Application User | `USR` | Cuenta institucional registrada en TraceFlow SCM autenticada mediante hash criptográfico Argon2id y habilitada para operar con roles y proyectos asignados. | Entidad `usuario` (`app_user`), códigos `USR-001` a `USR-004`. |
| **Subsanación** | Rectification / Correction | `CU-04.1` | Proceso mediante el cual el Solicitante corrige observaciones formuladas por el Gestor en el filtro inicial (`EN_SUBSANACION -> REGISTRADA`) o desiste formalmente (`DESESTIMADA`). | Flujo `CU-04.1` en `solicitud_cambio` y vista de edición de RFC. |
| **Desestimación** | Dismissal | `RN-07` | Cierre anticipado y terminal (`DESESTIMADA`) de una RFC inviable en admisión (`CU-05`) o no subsanada en plazo, o por desistimiento del Solicitante. | Transición terminal hacia `DESESTIMADA` en `TB-07` / `DG-11`. |
| **Reversión (Rollback)** | Rollback | `RBK` | Restitución controlada de un ECS hacia su última versión congelada en Línea Base cuando fallan las pruebas de QA o UAT, liberando el bloqueo de sincronización. | Operaciones `CU-21`, causa canónica `ROLLBACK` en `bloqueo_sincronizacion`. |
| **Gestión de Configuración de Software** | Software Configuration Management | `SCM` | Disciplina de ingeniería que controla la identificación, control de cambios, auditoría de configuración y contabilidad de estado de los artefactos de software. | Propósito rector de TraceFlow SCM bajo IEEE 828 e ISO/IEC/IEEE 12207. |

---

## 4. Siglas y Acrónimos Conservados sin Traducción

Las siguientes siglas se conservan explícitamente en documentación, rutas, enumeraciones o identificadores cuando corresponda:

- **Normativos de dominio:** `SCM`, `RFC`, `ECS`, `ECN`, `ECO`, `CCB`, `QA`, `UAT`, `RBAC`, `SoD`, `SRS`, `SAD`, `ADR`, `SHA-256`, `Argon2id`.
- **Prefijos oficiales de artefactos (inmutables por [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md)):** `RF-XX`, `RNF-XX`, `RN-XX`, `PU-XX`, `CU-XX`, `DG-XX`, `DG-SEQ-XX`, `DG-AO-XX`, `DG-DXX`, `DG-DSEQ-XX`, `DG-UWE-NAV-XX`, `DG-UWE-PRES-XX`, `SCREEN-XX`, `WF-XX`, `DB-TXX`, `INT-TXX`.
- **Estándares técnicos externos:** `HTTP`, `REST`, `JSON`, `DTO`, `API`, `CORS`, `TLS`, `SSL`, `SQL`, `UUID`, `JSONB`, `URL`, `CLI`, `E2E`.

---

*Glosario oficial de TraceFlow SCM — Etapa DOC-02.1 — C-SharkTeam / ÉXODO S.A.C.*
