# Glosario Técnico y Equivalencias de Dominio — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Documento:** `docs/GLOSARIO.md` (Puente técnico hacia [`FD03-EPIS-Informe_SRS.md`](FD03-EPIS-Informe_SRS.md#14-terminología-y-glosario-del-dominio))  
> **Rama:** `docs/alineacion-srs-sad-2026-11-12`  
> **Estado:** Consolidación progresiva SRS-02  
> **Fecha:** 25 de noviembre de 2026  

---

## 1. Fuente Única de Definiciones Funcionales (Consolidación SRS-02)

Para evitar la duplicación de definiciones funcionales entre documentos, el **glosario funcional oficial del dominio** (definiciones de negocio comprensibles para el cliente **ÉXODO S.A.C.** y usuarios finales) reside ahora de manera centralizada en:

- **[`docs/FD03-EPIS-Informe_SRS.md` — Sección 1.4. Terminología y glosario del dominio](FD03-EPIS-Informe_SRS.md#14-terminología-y-glosario-del-dominio)**

El presente archivo se mantiene exclusivamente como **guía rápida de siglas normativas y enlace hacia la capa de implementación técnica** mientras avanza la consolidación de nomenclaturas en [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) y [`ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md).

---

## 2. Reglas de Normalización Terminológica para Implementación

1. **Idioma de dominio:** Todo concepto propio de TraceFlow SCM se expresa en **español claro** (sin tildes ni caracteres especiales en identificadores de código o SQL).
2. **Siglas normativas preservadas:** `RFC`, `ECS`, `ECN/ECO`, `CCB`, `QA`, `UAT`, `RBAC`, `SoD`, `SCM`, `SRS`, `SAD`, `ADR`.
3. **Convenciones de frameworks y datos:** Ver [`docs/MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md), [`docs/DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) y [`docs/ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md).

---

## 3. Correspondencia Rápida Término Oficial ↔ Capa Técnica

| Término oficial (SRS §1.4) | Sigla | Entidad objetivo (`DICCIONARIO_DATOS`) | Tabla actual (`traceflow`) | Referencia técnica |
|---|---:|---|---|---|
| **Solicitud de Cambio** | `RFC` | `solicitud_cambio` | `change_request` | [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) |
| **Elemento de Configuración** | `ECS` | `elemento_configuracion` / `version_ecs` | `config_item` / `ecs_version` | [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) |
| **Orden de Cambio** | `ECN/ECO` | `orden_cambio` | `change_order` | [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) |
| **Línea Base** | `LB` | `linea_base` / `elemento_linea_base` | `baseline` / `baseline_item` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Bloqueo de Sincronización** | `LOCK` | `bloqueo_sincronizacion` | `sync_lock` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Informe Técnico de Impacto** | `TIA` | `informe_impacto` | `impact_assessment` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Autorización de Cambio** | `DOBLE LLAVE` | `autorizacion_cambio` | `change_authorization` | [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) |
| **Comité de Control de Cambios** | `CCB` | `resolucion_ccb` / `voto_ccb` | `ccb_resolution` / `ccb_vote` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Certificación de Calidad** | `QA` | `certificacion_qa` | `qa_certification` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Aceptación de Usuario** | `UAT` | `aceptacion_uat` | `uat_acceptance` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Incidencia** | `INC` | `incidencia` | `incident_ticket` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Registro de Auditoría** | `EVT` | `registro_auditoria` | `audit_log` | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Organización** | `ORG` | `organizacion` | `organization` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Membresía Organizacional** | `ORG_MEM` | `miembro_organizacion` | `organization_member` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Configuración de Asistente** | `SETUP` | `configuracion_asistente` | `project_setup` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Rol en Proyecto** | `PROJ_ROLE` | `rol_equipo_proyecto` | `project_team_role` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Metodología y Fases** | `METH/PHASE` | `metodologia_proyecto` / `fase_proyecto` | `project_methodology` / `project_phase` | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Integración GitHub** | `GH` | `integracion_github` | `github_integration` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |
| **Evento / Webhook GitHub** | `GHEVT` | `evento_github` | `github_event` (Propuesta INIT-H01) | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |

---

## 4. Prefijos y Acrónimos Conservados sin Traducción

- **Normativos de dominio:** `SCM`, `RFC`, `ECS`, `ECN`, `ECO`, `CCB`, `QA`, `UAT`, `RBAC`, `SoD`, `SRS`, `SAD`, `ADR`, `SHA-256`, `Argon2id`.
- **Prefijos oficiales de artefactos ([`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md)):** `RF-XX`, `RNF-XX`, `RN-XX`, `PU-XX`, `CU-XX`, `DG-XX`, `DG-ACT-XX`, `DG-SEQ-XX`, `DG-AO-XX`, `DG-DXX`, `DG-DSEQ-XX`, `DG-UWE-NAV-XX`, `DG-UWE-PRES-XX`, `SCREEN-XX`, `WF-XX`, `DB-TXX`, `INT-TXX`.
- **Estándares técnicos externos:** `HTTP`, `REST`, `JSON`, `DTO`, `API`, `CORS`, `TLS`, `SSL`, `SQL`, `UUID`, `JSONB`, `URL`, `CLI`, `E2E`.

---

*Puente terminológico de TraceFlow SCM — Consolidación SRS-02 — C-SharkTeam / ÉXODO S.A.C.*
