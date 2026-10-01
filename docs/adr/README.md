# Catálogo Oficial de Architectural Decision Records (ADRs) — TraceFlow SCM



## Control de Documento

- **Proyecto**: TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios

- **Fase del Proyecto**: Transición de Análisis a Diseño de Software

- **Estado de las Decisiones**: APROBADO (Conjunto Completo ADR-001 a ADR-010)

- **Fecha de Aprobación**: 2026-10-01

- **Fuente de Verdad Funcional**: FD03-EPIS-Informe_SRS.md (Baseline de Análisis v1.0) y FD04-EPIS-Informe_SAD_Analisis.md (Baseline v1.1)

- **Impacto Global en Baselines de Análisis**: NINGUNO (Cero modificaciones al alcance funcional)



---



---

## 0. Errata de Trazabilidad y Nomenclatura — Sin Cambio Semántico de las Decisiones Arquitectónicas
Antes de la redacción formal del SAD de Diseño (`FD05`), se ejecutó una auditoría exhaustiva de coherencia entre los registros de decisión arquitectónica (`ADR-001` a `ADR-010`) y las tablas normativas del SRS (`TB-04`, `TB-05`, `TB-06` en `docs/TABLES.md`), subsanando las siguientes divergencias de nomenclatura y trazabilidad sin alterar ninguna de las decisiones técnicas aprobadas:

1. **ADR-006 (Seguridad, Sesión y SoD)**:
   - Se precisó que en la baseline SRS (`TB-05`), `RNF-01` corresponde formalmente a **Seguridad** y `RNF-04` corresponde a **Usabilidad (< 3 horas)**. El timeout de cierre de sesión por inactividad de 15 minutos se clasifica expresamente como una **DECISIÓN DE SEGURIDAD DE DISEÑO** para robustecer la aplicación, y no como un requerimiento numérico de la baseline SRS.
   - Se normalizó que en `TB-06`, `RN-05` corresponde formalmente a **Evaluación Técnica y Clasificación Obligatoria**. Las restricciones de Segregación de Funciones (SoD) para QA y CCB se trazan formalmente al SAD de Análisis (`FD04`, Secciones 3.4 y 6.3) y a las reglas `RN-01` y `RN-04`.
2. **ADR-008 (Auditoría y Trazabilidad)**:
   - Se vinculó la trazabilidad principal del registro de auditoría inmutable con `RF-16` (Trazabilidad de Configuración), `RF-17` (Auditoría e Integridad), `RN-03` (Trazabilidad de Cambios) y `RNF-03` (Integridad por Checksums SHA-256), clarificando que en `TB-06`, `RN-02` corresponde a la **Identificación Unívoca de Versiones**.
3. **ADR-010 (Despliegue y Respaldo)**:
   - Se normalizaron estrictamente las denominaciones canónicas de `TB-05`: `RNF-01` = **Seguridad**, `RNF-02` = **Disponibilidad**, `RNF-07` = **Compatibilidad**, `RNF-08` = **Mantenibilidad**, y `RNF-09` = **Respaldo** (eliminando denominaciones ajenas como "Portabilidad" o "Respaldo Periódico Transaccional").
4. **Nomenclatura de Versiones**:
   - Se eliminaron denominaciones informales inexistentes como *"React LTS"* o *"PostgreSQL LTS"*. Se adoptó la denominación técnica rigurosa: *"versión mayor soportada seleccionada para la baseline de implementación"*. La denominación oficial LTS se reservó exclusivamente para **Node.js 24 LTS**.

---

## 1. Propósito y Alcance del Directorio

El presente directorio (`docs/adr/`) constituye el **repositorio histórico único y oficial de la verdad técnica y arquitectónica** de TraceFlow SCM. 



Las decisiones contenidas en este catálogo establecen el fundamento técnico, tecnológico y operativo que regirá la elaboración del futuro **SAD de Diseño (Software Architecture Document — Fase de Diseño)** y la subsecuente fase de implementación del sistema.



Cada ADR individual documenta el contexto del problema, los criterios de evaluación, las alternativas descartadas, la decisión aprobada, su justificación técnica, los trade-offs asumidos, las mitigaciones compensatorias y su trazabilidad rigurosa con los requisitos de la baseline de análisis.



---



## 2. Catálogo General de Decisiones Arquitectónicas



| Identificador | Título del ADR | Estado | Fecha | Resumen de la Decisión Aprobada |

| :---: | :--- | :---: | :---: | :--- |

| [**ADR-001**](ADR-001.md) | Estilo Arquitectónico Global — Monolito Modular | **APROBADO** | 2026-10-01 | Adopción de un Monolito Modular con 9 módulos desacoplados (MOD-01..09) y transaccionalidad ACID local. |

| [**ADR-002**](ADR-002.md) | Arquitectura del Frontend — SPA Basada en React, TypeScript y Vite | **APROBADO** | 2026-10-01 | Cliente SPA enriquecido en React + TS + Vite para 7 actores internos autenticados, sin sobrecarga de SSR. |

| [**ADR-003**](ADR-003.md) | Arquitectura del Backend — Node.js, TypeScript y NestJS | **APROBADO** | 2026-10-01 | Backend NestJS sobre Node.js 24 LTS, tipado estricto TypeScript y gobernanza modular con IoC y Guards. |

| [**ADR-004**](ADR-004.md) | Motor de Base de Datos Principal — PostgreSQL Relacional Transaccional | **APROBADO** | 2026-10-01 | PostgreSQL como motor relacional transaccional unificado, índices únicos condicionales y columnas JSONB. |

| [**ADR-005**](ADR-005.md) | Estrategia de Custodia y Almacenamiento de Elementos de Configuración (ECS) | **APROBADO** | 2026-10-01 | Custodia híbrida: metadatos en PostgreSQL y archivos físicos desacoplados mediante puerto `StoragePort`. |

| [**ADR-006**](ADR-006.md) | Mecanismo de Autenticación, Gestión de Sesiones y Autorización (RBAC / SoD) | **APROBADO** | 2026-10-01 | Sesión en servidor con Cookie `HttpOnly`, protección CSRF, revocación instantánea y Guards SoD (SAD / RN-01, RN-04). |

| [**ADR-007**](ADR-007.md) | Estrategia de Bloqueo de Sincronización SCM (Check-Out / Concurrencia) | **APROBADO** | 2026-10-01 | Bloqueo lógico persistente en PostgreSQL con índice único condicional (RN-06). Liberación exclusiva vía CU. |

| [**ADR-008**](ADR-008.md) | Arquitectura de Auditoría, Trazabilidad e Inmutabilidad de Registros | **APROBADO** | 2026-10-01 | Log append-only en PostgreSQL con revocación de UPDATE/DELETE a nivel motor e integridad hash SHA-256. |

| [**ADR-009**](ADR-009.md) | Contratos de Comunicación API — RESTful, JSON y OpenAPI 3.0 | **APROBADO** | 2026-10-01 | API REST sobre HTTPS, DTOs JSON, errores RFC 7807 y especificación OpenAPI 3.0. Rutas como ejemplos de diseño. |

| [**ADR-010**](ADR-010.md) | Estrategia de Empaquetado, Despliegue, Continuidad y Respaldo Operacional | **APROBADO** | 2026-10-01 | Docker multi-stage, reverse proxy Nginx, réplicas stateless y respaldo de Unidad Lógica (DB + Storage + Manifest). |



---



## 3. Matriz de Aprobación Formal de Decisiones Arquitectónicas



| ADR | Decisión Aprobada | Estado | Impacto Baseline | Trazabilidad y Observaciones |

| :---: | :--- | :---: | :---: | :--- |

| **ADR-001** | Monolito Modular | **APROBADO** | **NINGUNO** | MOD-01..09, RF-01..18, RN-01..09. Elimina sobrecostos distribuidos; requiere motor relacional transaccional (ADR-004). |

| **ADR-002** | React + TypeScript + Vite SPA | **APROBADO** | **NINGUNO** | RNF-04, RNF-05, RNF-07. Sistema interno autenticado sin necesidad de SEO; versión fija delegada a baseline de implementación. |

| **ADR-003** | Node.js (LTS Soportada) + NestJS | **APROBADO** | **NINGUNO** | RNF-08, RN-01..09. Subsanada obsolescencia de Node 18; adopta Node.js 24 LTS o LTS activa. Modularidad nativa 1:1 con MOD-01..09. |

| **ADR-004** | PostgreSQL Relacional Transaccional | **APROBADO** | **NINGUNO** | RNF-01, RNF-06, RN-06. Soporte de índices únicos condicionales nativos; versión específica (PG 16/17 LTS) con soporte activo. |

| **ADR-005** | Custodia Híbrida y Puerto `StoragePort` | **APROBADO** | **NINGUNO** | RN-08, CU-10, CU-12, CU-20, CU-26. Interfaz hexagonal desacoplada, adaptador inicial local, sustitución futura por S3/MinIO sin alterar dominio. |

| **ADR-006** | Cookie HttpOnly Sesión Opaca + SoD | **APROBADO** | **NINGUNO** | RNF-01, RN-01, RN-04, SoD (SAD). Evalúa 4 alternativas. Inmunidad a XSS, revocación inmediata en servidor y blindaje estricto de SoD en QA. |

| **ADR-007** | Bloqueo Persistente Condicional | **APROBADO** | **NINGUNO** | RN-06, RF-07, RF-08, CU-10, CU-12, CU-21, CU-22. Se elimina desbloqueo administrativo forzado (requeriría RFC). Liberación solo por CU canónicos. |

| **ADR-008** | Auditoría Append-Only en PostgreSQL | **APROBADO** | **NINGUNO** | RN-02, RN-08, RNF-06. Reformulado como inmutabilidad lógica por software. SHA-256 como hash de integridad. RNF-06 acotado a consultas SRS. |

| **ADR-009** | API RESTful + JSON + OpenAPI 3.0 | **APROBADO** | **NINGUNO** | RF-01..18, CU-01..30, CU-04.1. Todas las rutas se marcan como ejemplos de diseño. Catálogo definitivo se derivará en SAD de Diseño. |

| **ADR-010** | Docker Multi-Stage + Unidad de Respaldo | **APROBADO** | **NINGUNO** | RNF-02, RNF-08, RNF-09. Corrección crítica de respaldo: `Backup = Snapshot DB + Snapshot Storage + Manifest`. 02:00 y 30 días como diseño operativo. |



---



## 4. Stack Tecnológico Aprobado



Con el fin de garantizar la gobernanza del proyecto y evitar la obsolescencia técnica o el acoplamiento prematuro, se diferencia formalmente entre **Decisiones Arquitectónicas** (conceptos, paradigmas y estándares de diseño) y **Versiones de Implementación** (herramientas concretas con ciclo de vida vigente):



### 4.1 Decisiones Arquitectónicas (Paradigmas y Estándares)

- **Estilo Arquitectónico Global**: Monolito Modular con límites estrictos de dominio (MOD-01 a MOD-09).

- **Paradigma de Frontend**: Single Page Application (SPA) desacoplada, tipada y empaquetada como activos estáticos.

- **Paradigma de Backend**: Framework basado en Inversión de Control (IoC), Inyección de Dependencias (DI), Módulos encapsulados y Middleware/Guards declarativos.

- **Paradigma de Persistencia**: Motor relacional transaccional (ACID) con soporte para esquemas relacionales estrictos, restricciones condicionales y tipos semiestructurados (JSONB).

- **Estrategia de Custodia de Archivos**: Arquitectura Hexagonal con puerto abstracto de almacenamiento (`StoragePort`), escritura por etapas y compensación transaccional.

- **Protocolo de Autenticación y Autorización**: Sesión en servidor identificada mediante Cookie `HttpOnly` + `SameSite=Strict`, control de acceso basado en roles (RBAC) y verificación contextual de Segregación de Funciones (SoD).

- **Concurrencia de Configuración**: Bloqueo pesimista lógico persistente con restricción única condicional a nivel de motor.

- **Gobernanza de Datos e Integridad**: Almacenamiento append-only para auditoría y hashes criptográficos SHA-256 para verificación de artefactos.

- **Protocolo de Comunicación**: API RESTful sobre HTTPS, intercambio en JSON, errores conformes a RFC 7807 y especificación OpenAPI 3.0.

- **Estrategia de Operación**: Contenerización reproducible, réplicas stateless detrás de reverse proxy y respaldo atómico de unidad lógica (`DB + Storage + Manifest`).



### 4.2 Versiones de Implementación Recomendadas (Ciclo de Vida Activo)

| Componente | Tecnología | Versión Recomendada | Ciclo de Vida / Horizonte de Soporte | Estado |

| :--- | :--- | :---: | :--- | :---: |

| **Runtime Backend** | Node.js | **24 LTS** | Activo hasta abril 2028+ (Reemplaza a Node 18 EOL) | Aprobado |

| **Lenguaje Backend** | TypeScript | **5.x** | Soporte continuo de tipado estricto | Aprobado |

| **Framework Backend** | NestJS | **10.x / 11.x** | Soporte empresarial activo con actualización continua | Aprobado |

| **Motor de Base de Datos** | PostgreSQL | **versión mayor soportada (16 o 17)** | Soporte oficial garantizado hasta noviembre 2028 / 2029 | Aprobado |

| **Librería UI Frontend** | React | **versión mayor soportada (18 o 19)** | Ecosistema maduro con soporte activo | Aprobado |

| **Empaquetador Frontend** | Vite | **5.x / 6.x** | Estándar de la industria para HMR y bundling ESM | Aprobado |

| **Servidor Web / Proxy** | Nginx | **1.26+ (Mainline / Stable)** | Soporte activo para terminación TLS y proxy inverso | Aprobado |

| **Motor de Contenedores** | Docker Engine | **24+ / Compose v2** | Estándar Open Container Initiative (OCI) | Aprobado |

| **Estándar de API** | OpenAPI (Swagger) | **3.0.x / 3.1.x** | Especificación formal internacional | Aprobado |



---



## 5. Decisiones de Versión Pendientes de Fijación en la Baseline de Implementación

Las siguientes especificaciones técnicas han sido acotadas en su espectro arquitectónico pero su versión puntual se fijará formalmente al congelar la **Baseline de Implementación Técnica** previa a la construcción de código:

1. **Fijación Definitiva de React (18 vs 19)**: Supeditada a la matriz de compatibilidad de las librerías satélite de UI (enrutador, componentes accesibles y formularios) al momento de iniciar el sprint de frontend.

2. **Selección de Librería de Acceso a Datos en NestJS**: Evaluación final entre **TypeORM**, **Prisma** o **Kysely / node-postgres** nativo para el mapeo objeto-relacional y control granular de migraciones.

3. **Selección de Motor de Caché para Sesiones**: Decisión operativa sobre si las sesiones de usuario (`user_session`) se mantienen exclusivamente en PostgreSQL o se incorpora una instancia ligera de **Redis** en caso de que las pruebas de carga iniciales anticipen más de 500 peticiones concurrentes por segundo.

4. **Herramienta Específica de Linters de Arquitectura**: Definición entre `eslint-plugin-boundaries` o `dependency-cruiser` para la verificación automatizada de aislamiento entre MOD-01..09 en el pipeline de CI/CD.



---



## 6. Matriz de Riesgos Arquitectónicos Abiertos y Estrategias de Mitigación



| ID | Riesgo Arquitectónico Identificado | Nivel | ADR Asociado | Estrategia de Mitigación Aprobada |

| :---: | :--- | :---: | :---: | :--- |

| **R-01** | **Falta de Atomicidad Distribuida Física entre PostgreSQL y Storage**: Posibilidad de artefactos físicos huérfanos o metadatos sin archivo físico si el servidor colapsa entre la transacción de base de datos y la escritura física. | Medio | ADR-005 | Protocolo de escritura por etapas (Staging $	o$ DB Commit $	o$ Promoción), manejo compensatorio de excepciones y un *Reconciliation Worker* periódico que audita y purga inconsistencias. |

| **R-02** | **Disponibilidad 99.9% en Host Único ante Falla de Hardware Físico**: Docker Compose en un único servidor no puede auto-reparar la máquina física si falla la placa base o el disco principal. | Medio | ADR-010 | Múltiples réplicas de backend detrás de Nginx para mitigar fallas de software. Para fallas físicas de servidor: Procedimiento formal de Disaster Recovery (DR) con restauración rápida de la Unidad Lógica de Respaldo (RTO $\le 2$ h). Ruta de evolución futura a Docker Swarm/K8s. |

| **R-03** | **Desincronización Temporal en el Respaldo (DB vs Storage)**: Si se realizan Check-Ins mientras se ejecuta el respaldo, la copia de archivos podría diferir ligeramente del volcado de PostgreSQL. | Bajo | ADR-010 | Programación del respaldo en horario de actividad mínima (02:00 AM) y generación de un manifiesto con verificación cruzada de checksums SHA-256. |

| **R-04** | **Crecimiento Monótono de la Tabla de Auditoría**: La inmutabilidad del registro de auditoría (RF-17, MOD-09) genera una acumulación continua de registros que puede degradar el rendimiento a largo plazo. | Bajo | ADR-008 | Índices B-Tree y GIN optimizados; estrategia planificada de particionamiento por rangos temporales (mensuales/anuales) al superar las 500,000 entradas. |



---



## 7. Protocolo de Gobernanza y Ciclo de Vida de los ADRs

1. **Inmutabilidad de Decisiones Aprobadas**: Una vez alcanzado el estado **APROBADO**, ningún ADR puede ser modificado silenciosamente para alterar su sentido técnico.

2. **Procedimiento de Enmienda o Sustitución**:

   - Si una decisión técnica requiere ser modificada durante el diseño o la implementación, no se sobreescribe el ADR original.

   - Se creará un nuevo registro (e.g. `ADR-011`) con estado `PROPUESTO`, referenciando al ADR original (`Sustituye a ADR-XXX`).

   - El ADR original pasará al estado `SUPERSEDED` únicamente tras la aprobación formal de la nueva propuesta.

3. **Impacto en el Alcance Funcional**: Cualquier decisión técnica que pretenda alterar o expandir los casos de uso, actores, reglas de negocio o requisitos funcionales de TraceFlow SCM requerirá obligatoriamente la emisión y aprobación de una **Solicitud de Cambio formal (RFC)** aprobada por el Comité de Control de Cambios (CCB).



---



## 8. Confirmación de Habilitación para la Fase de Diseño

Con la formalización, saneamiento y aprobación unánime de los registros **ADR-001 a ADR-010**:

- Se declaran resueltas todas las observaciones y divergencias técnicas detectadas en la fase de análisis.

- Se mantiene una compatibilidad del 100% con la **Baseline de Análisis (FD03 SRS v1.0 y FD04 SAD v1.1)** con **Impacto en Baseline = NINGUNO**.

- **QUEDA FORMALMENTE HABILITADA LA CONSTRUCCIÓN DEL SAD DE DISEÑO (FD05-EPIS-Informe_SAD_Diseno.md)**.

