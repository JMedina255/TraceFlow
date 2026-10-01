# Catálogo Centralizado de Tablas y Matrices - TraceFlow SCM

> **Sistema de Gestión de Configuración de Software - TraceFlow SCM**  
> **Repositorio:** `TraceFlow`  
> **Documento:** `docs/TABLES.md`  
> **Fuente Oficial de Datos Estructurados (SSOT)**  
> **Versión:** 1.0  
> **Fecha:** 2026-09-30  
> **Estado General:** APROBADO  

---

## Índice de Tablas

| ID de Tabla | Nombre de la Tabla | Estado | Sección de Origen en SRS |
| :--- | :--- | :--- | :--- |
| [TB-01](#tb-01--control-de-versiones-documentales-del-proyecto) | Control de Versiones Documentales del Proyecto | APROBADO | Carátula / Preliminares (Pág. 2) |
| [TB-02](#tb-02--indicadores-financieros-de-viabilidad-económica) | Indicadores Financieros de Viabilidad Económica | APROBADO | Sección 3.5 (Pág. 14) |
| [TB-03](#tb-03--cuadro-de-necesidades-identificadas) | Cuadro de Necesidades Identificadas | APROBADO | Sección 3.6 (Pág. 17) |
| [TB-04](#tb-04--cuadro-de-requerimientos-funcionales) | Cuadro de Requerimientos Funcionales (RF-01 a RF-18) | APROBADO | Sección 5.1 (Págs. 22-24) |
| [TB-05](#tb-05--cuadro-de-requerimientos-no-funcionales) | Cuadro de Requerimientos No Funcionales (RNF-01 a RNF-09) | APROBADO | Sección 5.2 (Pág. 24) |
| [TB-06](#tb-06--cuadro-de-reglas-de-negocio) | Cuadro de Reglas de Negocio (RN-01 a RN-09) | APROBADO | Sección 5.3 (Págs. 25-26) |
| [TB-07](#tb-07--estados-oficiales-del-ciclo-de-vida-de-una-rfc) | Estados Oficiales del Ciclo de Vida de una Solicitud de Cambio | APROBADO | Sección 5.3 (Págs. 26-27) y 4.2 |
| [TB-08](#tb-08--fases-del-ciclo-de-vida-del-desarrollo-metodología-uwe) | Fases del Ciclo de Vida del Desarrollo (Metodología UWE) | APROBADO | Sección 6 (Págs. 28-29) |
| [TB-09](#tb-09--matriz-de-perfiles-y-roles-de-usuario-del-sistema) | Matriz de Perfiles y Roles de Usuario del Sistema (PU-01 a PU-07) | APROBADO | Sección 6.1 (Pág. 30) |
| [TB-10](#tb-10--catálogo-general-de-casos-de-uso) | Catálogo General de Casos de Uso (CU-01 a CU-28) | APROBADO | Sección 6.1.3 (Págs. 35-94) |
| [TB-11](#tb-11--inventario-de-diagramas-de-secuencia-del-modelo-lógico) | Inventario de Diagramas de Secuencia del Modelo Lógico | APROBADO | Sección 6.2.1 (Págs. 95-114) |
| [TB-12](#tb-12--matriz-de-trazabilidad-requerimientos-funcionales-vs-casos-de-uso) | Matriz de Trazabilidad: Requerimientos Funcionales vs Casos de Uso | APROBADO | Sección 5.1 y 6.1.3 |
| [TB-13](#tb-13--matriz-de-trazabilidad-reglas-de-negocio-vs-casos-de-uso) | Matriz de Trazabilidad: Reglas de Negocio vs Casos de Uso | REVISION | Sección 5.3 y 6.1.3 |
| [TB-14](#tb-14--matriz-general-de-trazabilidad-scm) | Matriz General de Trazabilidad SCM (Necesidad → RF → RN → CU → Actor) | REVISION | Secciones 3.6, 5.1, 5.3, 6.1, 6.1.3 |

---

# TB-01 — Control de Versiones Documentales del Proyecto

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección Preliminar (Pág. 2)  

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1.0 | JCM / RAA / RFL / AJR | RVA | RVA | 16/09/2026 | Versión 1.0 inicial |

---

# TB-02 — Indicadores Financieros de Viabilidad Económica

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 3.5 (Pág. 14)  

| Indicador Financiero | Valor Proyectado | Interpretación Técnica / Financiera |
| :--- | :--- | :--- |
| Inversión Inicial (CAPEX) | S/. 5,475.00 | Cubre 500 horas de desarrollo agregadas para el equipo C-SharkTeam (Joan Medina, Renzo Antayhua, Renzo Loyola y Augusto Rivera a razón referencial de S/. 9.00/hr; **PENDIENTE DE VALIDACIÓN DE ESFUERZO** individual), depreciación de equipos (3.5 meses), conectividad, dominio web e imprevistos. |
| Costo Operativo Anual (OPEX) | S/. 1,140.00 | Mantenimiento de infraestructura PaaS (Render/Supabase), renovación de dominio, soporte preventivo y materiales de difusión. |
| Valor Actual Neto (VAN) | +S/. 10,801.64 | Estrictamente positivo (VAN > 0), ratificando que el proyecto generará valor económico y retención institucional por encima de la tasa exigida (COK 12.00%). |
| Tasa Interna de Retorno (TIR) | 68.20% | Supera ampliamente el COK referencial (12.00%), otorgando un margen de seguridad amplio frente a variaciones de costos. |
| Relación Beneficio / Costo (B/C) | 1.97 | Por cada sol invertido en el ciclo del proyecto, se generarán S/. 1.97 en beneficios y ahorros valorizados para la facultad y los estudiantes. |
| Periodo de Recuperación (Payback) | 1 año y 9.7 meses | La inversión inicial se recuperará plenamente durante el transcurso del segundo año de operación. |

---

# TB-03 — Cuadro de Necesidades Identificadas

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 3.6 (Pág. 17)  

| Área | Problema Detectado | Requerimiento del Sistema |
| :--- | :--- | :--- |
| Código | Pérdida de fuentes | Repositorio centralizado y seguro. |
| Cambios | Modificaciones arbitrarias | Flujo de aprobación (Solicitudes de Cambio). |
| Versiones | Confusión sobre la versión vigente | Etiquetado de Líneas Base (Baselines). |
| Auditoría | No se identifica al responsable de una falla | Registro de auditoría y trazabilidad total. |
| Entregas | Entregas al cliente sin validación previa | Aprobación formal antes de la liberación. |

---

# TB-04 — Cuadro de Requerimientos Funcionales

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 5.1 (Págs. 22-24)  

| ID | Requerimiento Funcional | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| RF-01 | Gestión de Usuarios y Roles | El sistema debe permitir registrar usuarios y asignar los roles del flujo de cambios (Solicitante, Analista de Requerimientos/Gestor, Arquitecto/Especialista Técnico, CCB, Administrador de Configuración/Bibliotecario, Ingeniero de Software/Desarrollador, Equipo de Calidad/Testing), restringiendo las acciones disponibles según el rol. | Alta |
| RF-02 | Gestión de Proyectos | El sistema debe permitir crear y administrar múltiples proyectos de clientes de ÉXODO S.A.C. de forma aislada entre sí. | Alta |
| RF-03 | Identificación de ECS | El sistema debe permitir registrar y clasificar los Elementos de Configuración (código, documentos, esquemas de BD) de cada proyecto. | Alta |
| RF-04 | Registro de Solicitudes de Cambio (RFC) | El sistema debe permitir al Solicitante registrar una Solicitud de Cambio indicando descripción, justificación, prioridad, ECS afectado y fecha, y permitir su subsanación cuando la información esté incompleta. | Alta |
| RF-05 | Clasificación y Análisis de Impacto | El sistema debe permitir al Analista de Requerimientos clasificar el tipo y criticidad de la solicitud, y al Arquitecto/Especialista Técnico registrar el análisis de impacto (arquitectura, esfuerzo, costo, tiempo y riesgos) en un Informe Técnico de Impacto. | Alta |
| RF-06 | Evaluación y Aprobación por el CCB | El sistema debe permitir al Comité de Control de Cambios evaluar la viabilidad técnica de una solicitud, aprobarla o rechazarla, y registrar las causales de no aprobación cuando corresponda. | Alta |
| RF-07 | Gestión de Órdenes de Cambio | El sistema debe permitir generar la Orden de Cambio (ECN/ECO) una vez aprobada una solicitud por el CCB, y actualizar el plan de gestión del proyecto asociado. | Media |
| RF-08 | Gestión de Bibliotecas de Software | El sistema debe administrar al menos tres bibliotecas por proyecto (Biblioteca de Trabajo, Biblioteca de Soporte y Biblioteca Maestra), permitiendo mover un ECS entre ellas mediante operaciones de Check-Out y Check-In. | Alta |
| RF-09 | Control de Versiones y Bloqueos de Sincronización | El sistema debe registrar cada Check-in/Check-out de un ECS con autor, fecha y descripción del cambio, y aplicar/liberar bloqueos de sincronización que impidan la edición concurrente del mismo ECS en la Biblioteca de Trabajo. | Alta |
| RF-10 | Gestión de Pruebas y Certificación de Conformidad | El sistema debe permitir al Equipo de Calidad registrar los resultados de pruebas de integración y validación funcional, certificar la conformidad de un cambio o reportar no conformidades con hallazgos asociados. | Alta |
| RF-11 | Reevaluación y Re-testeo | El sistema debe permitir registrar ciclos de corrección de defectos y re-testeo sobre un cambio no conforme, hasta su certificación o hasta agotar los reintentos permitidos. | Media |
| RF-12 | Rollback y Cancelación de Órdenes de Cambio | El sistema debe permitir al Administrador de Configuración ejecutar un rollback del ECS en la Biblioteca de Trabajo y cancelar la Orden de Cambio cuando el re-test no sea superado exitosamente. | Alta |
| RF-13 | Gestión de Líneas Base | El sistema debe permitir crear y congelar líneas base a partir de un ECS verificado al momento del Check-In a la Biblioteca Maestra/Soporte, registrando la versión resultante. | Alta |
| RF-14 | Cierre Formal del Cambio y Notificaciones | El sistema debe registrar el cierre formal de una Solicitud de Cambio (por implementación exitosa, rechazo técnico, rechazo administrativo o cancelación) y notificar automáticamente al Solicitante el resultado. | Alta |
| RF-15 | Gestión de Incidencias y Soporte | El sistema debe permitir registrar, dar seguimiento y derivar incidencias reportadas por consultores o clientes hacia una nueva Solicitud de Cambio. | Media |
| RF-16 | Trazabilidad de Configuración | El sistema debe permitir visualizar las relaciones entre los ECS, las Solicitudes de Cambio, las Órdenes de Cambio y las líneas base a lo largo del tiempo. | Alta |
| RF-17 | Auditoría e Integridad | El sistema debe registrar las acciones críticas de los usuarios en cada etapa del flujo y validar la integridad de los artefactos mediante checksums (SHA-256). | Alta |
| RF-18 | Generación de Reportes | El sistema debe permitir generar reportes de estado del flujo de cambios, inventario de ECS y actas de cambios, con posibilidad de exportación. | Media |

---

# TB-05 — Cuadro de Requerimientos No Funcionales

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 5.2 (Pág. 24)  

| ID | Atributo de Calidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| RNF-01 | Seguridad | El sistema debe utilizar protocolos de transferencia segura (HTTPS/SSH) y control de acceso basado en roles (RBAC). | Alta |
| RNF-02 | Disponibilidad | El sistema debe garantizar un tiempo de actividad (uptime) del 99.9% durante los periodos críticos de proyecto. | Alta |
| RNF-03 | Integridad | El sistema debe verificar la integridad de los artefactos almacenados mediante checksums (SHA-256). | Alta |
| RNF-04 | Usabilidad | La interfaz debe permitir que un nuevo consultor se familiarice con el flujo de trabajo en menos de 3 horas. | Media |
| RNF-05 | Escalabilidad | El sistema debe soportar más de 50 proyectos simultáneos sin degradar el rendimiento de las operaciones. | Media |
| RNF-06 | Rendimiento | Las operaciones de consulta de historial o comparación de versiones no deben exceder los 3 segundos de respuesta. | Baja |
| RNF-07 | Compatibilidad | El sistema debe ser compatible con entornos de desarrollo de uso común (Visual Studio Code, IntelliJ IDEA, Android Studio). | Alta |
| RNF-08 | Mantenibilidad | La arquitectura debe permitir actualizaciones y parches sin requerir la detención total del servicio. | Media |
| RNF-09 | Respaldo | El sistema debe programar copias de seguridad automáticas diarias del repositorio central. | Alta |

---

# TB-06 — Cuadro de Reglas de Negocio

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 5.3 (Págs. 25-26)  

| ID | Nombre de la Regla | Descripción | Autoridad | Situación Actual (Problemática) |
| :--- | :--- | :--- | :--- | :--- |
| RN-01 | Aprobación Obligatoria de Integración | Ningún ECS puede integrarse a la Biblioteca Maestra/Soporte de un proyecto sin la revisión y aprobación de una Solicitud de Cambio por el CCB. | Comité de Control de Cambios (CCB) | Se integraban cambios directamente sin revisión previa. |
| RN-02 | Identificación Unívoca de Versiones | Toda línea base establecida tras un Check-In a la Biblioteca Maestra debe estar identificada con un estándar de versionamiento (mayor.menor.parche). | Administrador de Configuración / Bibliotecario | Se usaban nombres de carpetas y archivos comprimidos con nombres arbitrarios. |
| RN-03 | Trazabilidad de Cambios | Todo Check-in registrado debe incluir un mensaje descriptivo y estar asociado a una Orden de Cambio (ECN/ECO) previamente emitida. | Analista de Requerimientos / Gestor *(ver nota en Inconsistencias)* | No existía registro de quién ni por qué se modificaba el código. |
| RN-04 | Restricción de Bibliotecas Congeladas | Un ECS almacenado en la Biblioteca Maestra no puede modificarse directamente; cualquier corrección exige un nuevo ciclo completo de RFC, Check-Out y Check-In. | Administrador de Configuración / Bibliotecario | Los consultores editaban directamente los archivos entregados al cliente. |
| RN-05 | Evaluación Técnica Obligatoria | Ninguna Solicitud de Cambio puede pasar a evaluación del CCB sin contar previamente con un Informe Técnico de Impacto elaborado por el Arquitecto/Especialista Técnico. | Arquitecto / Especialista Técnico | Los cambios se aprobaban sin un análisis técnico documentado. |
| RN-06 | Bloqueo de Sincronización Obligatorio | Todo ECS que ingresa a la Biblioteca de Trabajo mediante Check-Out debe quedar bloqueado para otros usuarios hasta su Check-In o rollback. | Administrador de Configuración / Bibliotecario | Varios consultores editaban el mismo archivo de forma simultánea, generando sobreescrituras. |
| RN-07 | Diferenciación de Resultados de Cierre | Toda Solicitud de Cambio debe cerrarse con uno de tres resultados formales y mutuamente excluyentes: Rechazo Técnico (inviabilidad detectada por el CCB), Rechazo Administrativo (decisión del CCB pese a viabilidad técnica) o Cancelación por Fallo No Subsanado (re-test fallido tras corrección). | Comité de Control de Cambios (CCB) / Administrador de Configuración | No existía distinción entre los motivos de cierre de un cambio no exitoso. |
| RN-08 | Reversión Obligatoria ante Fallo No Subsanado | Si el re-test posterior a una corrección no es superado exitosamente, el Administrador de Configuración debe ejecutar un rollback del ECS en la Biblioteca de Trabajo antes de cancelar la Orden de Cambio. | Administrador de Configuración / Bibliotecario | El código con errores permanecía en el entorno de trabajo sin reversión formal. |
| RN-09 | Validación de QA Previa al Check-In a Biblioteca Maestra | Ningún ECS puede pasar de la Biblioteca de Trabajo a la Biblioteca Maestra/Soporte sin la certificación de conformidad del Equipo de Calidad/Testing. | Equipo de Calidad / Testing | El código se entregaba al cliente sin pruebas formales previas. |

---

# TB-07 — Estados Oficiales del Ciclo de Vida de una RFC

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 5.3 (Págs. 26-27) y Diagrama de Gestión de Cambios (Sección 4.2)  

| N.º | Nombre del Estado | Actor / Responsable Principal | Tipo de Estado | Descripción y Criterio de Transición |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Registrado** | Solicitante / Analista de Requerimientos | Inicial | La solicitud fue creada por el Solicitante y recepcionada por el Analista de Requerimientos. |
| 2 | **En Subsanación** | Solicitante | Intermedio (Bucle) | La información de la solicitud está incompleta y se encuentra en espera de datos adicionales subsanados. |
| 3 | **Clasificado** | Analista de Requerimientos / Gestor | Intermedio | El Analista de Requerimientos validó la información completa y definió el tipo y la criticidad del cambio. |
| 4 | **En Análisis Técnico** | Arquitecto / Especialista Técnico | Intermedio | El Arquitecto está elaborando el Informe Técnico de Impacto (arquitectura, dependencias, esfuerzo, costo, tiempo, riesgos). |
| 5 | **En Evaluación CCB** | Comité de Control de Cambios (CCB) | Intermedio | El Comité de Control de Cambios está evaluando la viabilidad técnica y decidiendo la aprobación del cambio. |
| 6 | **Rechazado (Técnico)** | Comité de Control de Cambios (CCB) | Terminal | El CCB determinó que el cambio no es técnicamente viable. Se notifica al Solicitante y el trámite finaliza. |
| 7 | **Rechazado (Administrativo)** | Comité de Control de Cambios (CCB) | Terminal | El CCB decidió no aprobar el cambio por razones de gestión, alcance o costo, pese a ser técnicamente viable. Se notifica al Solicitante y finaliza. |
| 8 | **Aprobado – Orden Emitida** | Comité de Control de Cambios (CCB) | Intermedio | El CCB aprobó la RFC y emitió la Orden de Cambio (ECN/ECO), autorizando la transferencia del ECS hacia la Biblioteca de Trabajo. |
| 9 | **En Implementación** | Ingeniero de Software / Desarrollador | Intermedio | El Desarrollador recibió el ECS bajo Check-Out con bloqueo activo y ejecuta las modificaciones y pruebas unitarias locales. |
| 10 | **En Validación QA** | Equipo de Calidad / Testing | Intermedio | El Equipo de Calidad está ejecutando pruebas de integración y validación funcional sobre el ECS modificado. |
| 11 | **En Corrección** | Ingeniero de Software / Desarrollador | Intermedio (Bucle) | QA detectó no conformidades y el cambio se encuentra en ciclo de corrección de defectos y re-testeo. |
| 12 | **Cancelado (Fallo No Subsanado)** | Administrador de Configuración / Bibliotecario | Terminal | El re-testeo no fue superado tras los reintentos permitidos; el Administrador ejecuta rollback del ECS en la Biblioteca de Trabajo y cancela la Orden de Cambio. |
| 13 | **Cerrado – Implementado** | Administrador de Configuración / CCB | Terminal | El ECS certificado completó Check-In en la Biblioteca Maestra, se congeló una nueva Línea Base, se liberó el bloqueo y se formalizó el cierre exitoso. |

---

# TB-08 — Fases del Ciclo de Vida del Desarrollo (Metodología UWE)

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 6 (Págs. 28-29)  

| Fase | Duración | Periodo | Enfoque UWE | Entregables Principales |
| :--- | :--- | :--- | :--- | :--- |
| 1. Análisis de Requisitos y Modelado Conceptual | 3 semanas | 29 ago – 18 sep 2026 | Modelo Conceptual (clases de dominio, casos de uso) | SRS, escenarios de caso de uso, modelo lógico, diagrama de clases preliminar. |
| 2. Diseño (Navegación, Presentación y Arquitectura) | 3.5 semanas | 19 sep – 9 oct 2026 | Modelo de Navegación y de Presentación | SAD, diagramas de secuencia, prototipos de interfaz, modelo de navegación web. |
| 3. Implementación | 5 semanas | 10 oct – 13 nov 2026 | Construcción del sistema | Módulos de RFC, ECS/bibliotecas, líneas base, auditoría; repositorio versionado. |
| 4. Pruebas y Validación | 2.5 semanas | 14 nov – 30 nov 2026 | Verificación funcional y de usabilidad | Casos de prueba ejecutados, informe de defectos, evaluación de usabilidad (SUS). |
| 5. Despliegue Cloud y Prueba Piloto | 1.5 semanas | 1 dic – 14 dic 2026 | Despliegue e implantación | Ambiente productivo desplegado, informe de prueba piloto, acta de cierre. |

---

# TB-09 — Matriz de Perfiles y Roles de Usuario del Sistema

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1 (Pág. 30)  

| ID | Tipo de Usuario / Actor | Descripción | Nivel Técnico | Funciones en el Sistema TraceFlow SCM |
| :--- | :--- | :--- | :--- | :--- |
| PU-01 | Solicitante | Persona (interna o del cliente) que identifica una necesidad de cambio y origina el trámite mediante un RFC. | Básico | Registrar Solicitudes de Cambio (RFC), subsanar información observada, consultar el estado de tickets/solicitudes y recibir notificaciones de cierre o rechazo. |
| PU-02 | Analista de Requerimientos / Gestor | Responsable de la recepción, validación formal y clasificación inicial de las solicitudes de cambio. | Avanzado | Registrar y validar RFC, solicitar subsanación de datos, clasificar tipo y criticidad, registrar causales de no aprobación, actualizar el plan de gestión del proyecto y derivar incidencias a RFC. |
| PU-03 | Arquitecto / Especialista Técnico | Responsable del análisis de impacto técnico de los cambios propuestos. | Experto | Realizar análisis de impacto en arquitectura y dependencias, estimar esfuerzo/costo/tiempo, generar el Informe Técnico de Impacto y registrar/clasificar nuevos ECS. |
| PU-04 | Comité de Control de Cambios (CCB) | Grupo colegiado de decisión que evalúa la viabilidad técnica y aprueba o rechaza formalmente los cambios. | Avanzado | Evaluar el informe técnico y solicitudes, aprobar o rechazar RFC, emitir Órdenes de Cambio (ECN/ECO), auditar acciones del sistema y formalizar cierres. |
| PU-05 | Administrador de Configuración / Bibliotecario | Responsable de administrar las bibliotecas (Trabajo, Soporte, Maestra), los bloqueos y las líneas base. | Experto | Ejecutar Check-Out/Check-In entre bibliotecas, aplicar y liberar bloqueos de sincronización, ejecutar rollback, establecer y congelar líneas base, validar integridad (SHA-256) y generar reportes. |
| PU-06 | Ingeniero de Software / Desarrollador | Consultor técnico que implementa el cambio aprobado sobre el ECS en la Biblioteca de Trabajo. | Medio | Recibir Orden de Cambio y ECS autorizado, implementar modificaciones, ejecutar pruebas unitarias locales y corregir defectos reportados por QA. |
| PU-07 | Equipo de Calidad / Testing | Responsable de validar funcional y técnicamente el cambio antes de su integración a la Biblioteca Maestra. | Medio | Ejecutar pruebas de integración y validación funcional, emitir Certificación de Conformidad, reportar no conformidades y hallazgos, y re-testear correcciones. |

---

# TB-10 — Catálogo General de Casos de Uso

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1.3 (Págs. 35-94)  

| Cód. Orig. | ID Estándar | Nombre del Caso de Uso | Tipo | Actor Principal | Actores Secundarios | Módulo Relacionado | Requerimiento Asociado Explícito |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CUS01 | CU-01 | Gestionar usuarios y roles | Secundario, administrativo | Administrador de Configuración / Bibliotecario | Usuarios del sistema | Gestión de Usuarios y Proyectos | RF-01 – Gestión de Usuarios y Roles |
| CUS02 | CU-02 | Crear y administrar proyectos | Primario, administrativo | Analista de Requerimientos / Gestor | Administrador de Configuración / Bibliotecario | Gestión de Usuarios y Proyectos | RF-02 – Gestión de Proyectos |
| CUS03 | CU-03 | Consultar proyecto | Secundario, de consulta | Analista de Requerimientos / Gestor | Usuarios autorizados | Gestión de Usuarios y Proyectos | RF-02 – Gestión de Proyectos |
| CUS04 | CU-04 | Registrar Solicitud de Cambio (RFC) | Primario, operativo | Solicitante | Analista de Requerimientos / Gestor | Registro y Evaluación de la RFC | RF-04 – Registro de Solicitudes de Cambio (RFC) |
| CUS05 | CU-05 | Validar y clasificar la solicitud | Primario, operativo | Analista de Requerimientos / Gestor | Solicitante | Registro y Evaluación de la RFC | RF-04, RF-05 – Registro, Clasificación y Análisis de Impacto |
| CUS06 | CU-06 | Realizar análisis de impacto técnico | Primario, analítico | Arquitecto / Especialista Técnico | Analista de Requerimientos / Gestor | Registro y Evaluación de la RFC | RF-05 – Clasificación y Análisis de Impacto |
| CUS07 | CU-07 | Evaluar viabilidad y aprobar/rechazar | Primario, decisional | Comité de Control de Cambios (CCB) | Solicitante, Analista de Requerimientos | Registro y Evaluación de la RFC | RF-06 – Evaluación y Aprobación por el CCB |
| CUS08 | CU-08 | Emitir Orden de Cambio (ECN/ECO) | Primario, formalización | Comité de Control de Cambios (CCB) | Administrador de Configuración / Bibliotecario | Registro y Evaluación de la RFC | RF-07 – Gestión de Órdenes de Cambio |
| CUS09 | CU-09 | Registrar ECS | Primario, configuración | Arquitecto / Especialista Técnico | Administrador de Configuración / Bibliotecario | Gestión de ECS y Bibliotecas | RF-03 – Identificación de ECS |
| CUS10 | CU-10 | Efectuar Check-Out (Soporte → Trabajo) | Primario, operación SCM | Administrador de Configuración / Bibliotecario | Ingeniero de Software / Desarrollador | Gestión de ECS y Bibliotecas | RF-08, RF-09 – Gestión de Bibliotecas y Control de Versiones |
| CUS11 | CU-11 | Aplicar bloqueo de sincronización | Secundario, soporte SCM | Administrador de Configuración / Bibliotecario | Sistema TraceFlow SCM | Gestión de ECS y Bibliotecas | RF-09 – Control de Versiones y Bloqueos de Sincronización |
| CUS12 | CU-12 | Efectuar Check-In (Trabajo → Maestra/Soporte) | Primario, operación SCM | Administrador de Configuración / Bibliotecario | Equipo de Calidad / Testing | Gestión de ECS y Bibliotecas | RF-08, RF-09 – Gestión de Bibliotecas y Control de Versiones |
| CUS13 | CU-13 | Consultar historial de versiones | Secundario, auditoría | Administrador de Configuración / Bibliotecario | Usuarios autorizados | Gestión de ECS y Bibliotecas | RF-09, RF-16 – Control de Versiones y Trazabilidad |
| CUS14 | CU-14 | Implementar cambio en el ECS | Primario, desarrollo | Ingeniero de Software / Desarrollador | Administrador de Configuración / Bibliotecario | Implementación y Validación | RF-07, RF-09 – Orden de Cambio y Control de Versiones |
| CUS15 | CU-15 | Ejecutar pruebas unitarias locales | Secundario, verificación | Ingeniero de Software / Desarrollador | Sistema de Pruebas Unitarias | Implementación y Validación | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| CUS16 | CU-16 | Ejecutar pruebas de integración | Primario, validación QA | Equipo de Calidad / Testing | Ingeniero de Software / Desarrollador | Implementación y Validación | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| CUS17 | CU-17 | Certificar conformidad del cambio | Primario, certificación | Equipo de Calidad / Testing | Administrador de Configuración / Bibliotecario | Implementación y Validación | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| CUS18 | CU-18 | Reportar no conformidad | Alternativo, QA | Equipo de Calidad / Testing | Ingeniero de Software / Desarrollador | Implementación y Validación | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| CUS19 | CU-19 | Reevaluar y re-testear | Alternativo, esencial | Equipo de Calidad / Testing | Ingeniero de Software / Desarrollador | Implementación y Validación | RF-11 – Reevaluación y Re-testeo |
| CUS20 | CU-20 | Crear y congelar línea base | Primario, esencial | Administrador de Configuración / Bibliotecario | Equipo de Calidad / Testing | Líneas Base y Rollback | RF-13 – Gestión de Líneas Base |
| CUS21 | CU-21 | Ejecutar rollback en Biblioteca de Trabajo | Alternativo, correctivo | Administrador de Configuración / Bibliotecario | Ingeniero de Software / Desarrollador | Líneas Base y Rollback | RF-12 – Rollback y Cancelación de Órdenes de Cambio |
| CUS22 | CU-22 | Cancelar Orden de Cambio | Alternativo, cierre fallido | Administrador de Configuración / Bibliotecario | Solicitante, CCB | Líneas Base y Rollback | RF-12, RF-14 – Rollback, Cancelación y Cierre Formal |
| CUS23 | CU-23 | Registrar incidencia | Primario, soporte | Solicitante | Analista de Requerimientos / Gestor | Incidencias y Soporte | RF-15 – Gestión de Incidencias y Soporte |
| CUS24 | CU-24 | Consultar estado de ticket | Secundario, consulta | Solicitante | Analista de Requerimientos / Gestor | Incidencias y Soporte | RF-15 – Gestión de Incidencias y Soporte |
| CUS25 | CU-25 | Derivar incidencia a RFC | Primario, transición | Analista de Requerimientos / Gestor | Solicitante | Incidencias y Soporte | RF-15 – Gestión de Incidencias y Soporte |
| CUS26 | CU-26 | Validar integridad (checksum) | Secundario, seguridad | Administrador de Configuración / Bibliotecario | Sistema TraceFlow SCM | Trazabilidad, Auditoría y Reportes | RF-17, RNF-03 – Auditoría e Integridad |
| CUS27 | CU-27 | Auditar acciones del sistema | Secundario, control | Comité de Control de Cambios (CCB) | Administrador de Configuración / Bibliotecario | Trazabilidad, Auditoría y Reportes | RF-16, RF-17 – Trazabilidad de Configuración y Auditoría |
| CUS28 | CU-28 | Generar reportes de estado | Secundario, reporte | Administrador de Configuración / Bibliotecario | Gestores y Dirección de Proyecto | Trazabilidad, Auditoría y Reportes | RF-18 – Generación de Reportes |

---

# TB-11 — Inventario de Diagramas de Secuencia del Modelo Lógico

**Estado:** APROBADO  
**Fuente:** `FD03-EPIS-Informe_SRS.md`, Sección 6.2.1 (Págs. 95-114)  

| ID Diagrama | Caso de Uso | Nombre del Diagrama de Secuencia | Actor Principal | Pág. SRS Original | Estado en Documentación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DG-SEQ-01 | CUS01 (CU-01) | Gestionar usuarios y roles | Administrador de Configuración / Bibliotecario | Pág. 96 | Presente (assets/page-096.png) |
| DG-SEQ-02 | CUS02 (CU-02) | Crear y administrar proyectos | Analista de Requerimientos / Gestor | Pág. 97 | Presente (assets/page-097.png) |
| DG-SEQ-03 | CUS03 (CU-03) | Consultar proyecto | Analista de Requerimientos / Gestor | Pág. 97b | Presente (assets/DG-SEQ-03.png) |
| DG-SEQ-04 | CUS04 (CU-04) | Registrar Solicitud de Cambio (RFC) | Solicitante | Pág. 98 | Presente (assets/page-098.png) |
| DG-SEQ-05 | CUS05 (CU-05) | Validar y clasificar la solicitud | Analista de Requerimientos / Gestor | Pág. 99 | Presente (assets/page-099.png) |
| DG-SEQ-06 | CUS06 (CU-06) | Realizar análisis de impacto técnico | Arquitecto / Especialista Técnico | Pág. 100 | Presente (assets/page-100.png) |
| DG-SEQ-07 | CUS07 (CU-07) | Evaluar viabilidad y aprobar/rechazar | Comité de Control de Cambios (CCB) | Pág. 101 | Presente (assets/page-101.png) |
| DG-SEQ-08 | CUS08 (CU-08) | Emitir Orden de Cambio (ECN/ECO) | Comité de Control de Cambios (CCB) | Pág. 102 | Presente (assets/page-102.png) |
| DG-SEQ-09 | CUS09 (CU-09) | Registrar Elemento de Configuración (ECS) | Arquitecto / Especialista Técnico | Pág. 103 | Presente (assets/page-103.png) |
| DG-SEQ-10 | CUS10 (CU-10) | Efectuar Check-Out de elementos de configuración | Administrador de Configuración / Bibliotecario | Pág. 104 | Presente (assets/page-104.png) |
| DG-SEQ-11 | CUS11 (CU-11) | Aplicar bloqueo de sincronización | Administrador de Configuración / Bibliotecario | Pág. 104 | Presente (assets/page-104.png) |
| DG-SEQ-12 | CUS12 (CU-12) | Efectuar Check-In de elementos de configuración | Administrador de Configuración / Bibliotecario | Pág. 105 | Presente (assets/page-105.png) |
| DG-SEQ-13 | CUS13 (CU-13) | Consultar historial de versiones | Administrador de Configuración / Bibliotecario | Pág. 105 | Presente (assets/page-105.png) |
| DG-SEQ-14 | CUS14 (CU-14) | Implementar cambio en el ECS | Ingeniero de Software / Desarrollador | Pág. 106 | Presente (assets/page-106.png) |
| DG-SEQ-15 | CUS15 (CU-15) | Ejecutar pruebas unitarias locales | Ingeniero de Software / Desarrollador | Pág. 107 | Presente (assets/page-107.png) |
| DG-SEQ-16 | CUS16 (CU-16) | Ejecutar pruebas de integración | Equipo de Calidad / Testing | Pág. 107 | Presente (assets/page-107.png) |
| DG-SEQ-17 | CUS17 (CU-17) | Certificar conformidad del cambio | Equipo de Calidad / Testing | Pág. 108 | Presente (assets/page-108.png) |
| DG-SEQ-18 | CUS18 (CU-18) | Reportar no conformidad | Equipo de Calidad / Testing | Pág. 108 | Presente (assets/page-108.png) |
| DG-SEQ-19 | CUS19 (CU-19) | Reevaluar y re-testear | Equipo de Calidad / Testing | Pág. 109 | Presente (assets/page-109.png) |
| DG-SEQ-20 | CUS20 (CU-20) | Crear y congelar línea base | Administrador de Configuración / Bibliotecario | Pág. 110 | Presente (assets/page-110.png) |
| DG-SEQ-21 | CUS21 (CU-21) | Ejecutar rollback en Biblioteca de Trabajo | Administrador de Configuración / Bibliotecario | Pág. 110 | Presente (assets/page-110.png) |
| DG-SEQ-22 | CUS22 (CU-22) | Cancelar Orden de Cambio | Administrador de Configuración / Bibliotecario | Pág. 111 | Presente (assets/page-111.png) |
| DG-SEQ-23 | CUS23 (CU-23) | Registrar incidencia | Solicitante | Pág. 111 | Presente (assets/page-111.png) |
| DG-SEQ-24 | CUS24 (CU-24) | Consultar estado de ticket | Solicitante | Pág. 112 | Presente (assets/page-112.png) |
| DG-SEQ-25 | CUS25 (CU-25) | Derivar incidencia a RFC | Analista de Requerimientos / Gestor | Pág. 112 | Presente (assets/page-112.png) |
| DG-SEQ-26 | CUS26 (CU-26) | Validar integridad mediante checksum | Administrador de Configuración / Bibliotecario | Pág. 113 | Presente (assets/page-113.png) |
| DG-SEQ-27 | CUS27 (CU-27) | Auditar acciones del sistema | Comité de Control de Cambios (CCB) | Pág. 113 | Presente (assets/page-113.png) |
| DG-SEQ-28 | CUS28 (CU-28) | Generar reportes de estado | Administrador de Configuración / Bibliotecario | Pág. 114 | Presente (assets/page-114.png) |

---

# TB-12 — Matriz de Trazabilidad: Requerimientos Funcionales vs Casos de Uso

**Estado:** APROBADO  
**Fuente:** Derivada de las narrativas explícitas en `FD03-EPIS-Informe_SRS.md`, Sección 6.1.3  

| ID RF | Nombre del Requerimiento Funcional | Casos de Uso que lo Instrumentan (Código Oficial / Original) | Sustento Documental (Campo Requerimiento Asociado en CU) |
| :--- | :--- | :--- | :--- |
| RF-01 | Gestión de Usuarios y Roles | CU-01 (CUS01) | Explícito en CUS01 |
| RF-02 | Gestión de Proyectos | CU-02 (CUS02), CU-03 (CUS03) | Explícito en CUS02 y CUS03 |
| RF-03 | Identificación de ECS | CU-09 (CUS09) | Explícito en CUS09 |
| RF-04 | Registro de Solicitudes de Cambio (RFC) | CU-04 (CUS04), CU-05 (CUS05) | Explícito en CUS04 y CUS05 |
| RF-05 | Clasificación y Análisis de Impacto | CU-05 (CUS05), CU-06 (CUS06) | Explícito en CUS05 y CUS06 |
| RF-06 | Evaluación y Aprobación por el CCB | CU-07 (CUS07) | Explícito en CUS07 |
| RF-07 | Gestión de Órdenes de Cambio | CU-08 (CUS08), CU-14 (CUS14) | Explícito en CUS08 y CUS14 |
| RF-08 | Gestión de Bibliotecas de Software | CU-10 (CUS10), CU-12 (CUS12) | Explícito en CUS10 y CUS12 |
| RF-09 | Control de Versiones y Bloqueos de Sincronización | CU-10 (CUS10), CU-11 (CUS11), CU-12 (CUS12), CU-13 (CUS13), CU-14 (CUS14) | Explícito en CUS10, CUS11, CUS12, CUS13 y CUS14 |
| RF-10 | Gestión de Pruebas y Certificación de Conformidad | CU-15 (CUS15), CU-16 (CUS16), CU-17 (CUS17), CU-18 (CUS18) | Explícito en CUS15, CUS16, CUS17 y CUS18 |
| RF-11 | Reevaluación y Re-testeo | CU-19 (CUS19) | Explícito en CUS19 |
| RF-12 | Rollback y Cancelación de Órdenes de Cambio | CU-21 (CUS21), CU-22 (CUS22) | Explícito en CUS21 y CUS22 |
| RF-13 | Gestión de Líneas Base | CU-20 (CUS20) | Explícito en CUS20 |
| RF-14 | Cierre Formal del Cambio y Notificaciones | CU-22 (CUS22) | Explícito en CUS22 *(ver PENDIENTE DE VALIDACIÓN para cierre exitoso)* |
| RF-15 | Gestión de Incidencias y Soporte | CU-23 (CUS23), CU-24 (CUS24), CU-25 (CUS25) | Explícito en CUS23, CUS24 y CUS25 |
| RF-16 | Trazabilidad de Configuración | CU-13 (CUS13), CU-27 (CUS27) | Explícito en CUS13 y CUS27 |
| RF-17 | Auditoría e Integridad | CU-26 (CUS26), CU-27 (CUS27) | Explícito en CUS26 y CUS27 |
| RF-18 | Generación de Reportes | CU-28 (CUS28) | Explícito en CUS28 |

---

# TB-13 — Matriz de Trazabilidad: Reglas de Negocio vs Casos de Uso

**Estado:** REVISION  
**Fuente:** Derivada de las definiciones de políticas en `FD03-EPIS-Informe_SRS.md`, Sección 5.3 y de los flujos de la Sección 6.1.3  

> [!NOTE]
> Las relaciones directas se sustentan en los flujos principales, alternativos y de excepción de cada caso de uso. Las relaciones marcadas como `PENDIENTE DE VALIDACION` representan implicaciones operativas derivadas que requieren confirmación colegiada del CCB.

| ID RN | Regla de Negocio | Autoridad Responsable | Casos de Uso Directamente Vinculados | Casos de Uso con Afectación Operativa Directa | Estado de Trazabilidad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RN-01 | Aprobación Obligatoria de Integración | Comité de Control de Cambios (CCB) | CU-07 (Evaluar viabilidad y aprobar/rechazar), CU-12 (Check-In) | CU-08 (Emitir ECN/ECO) | APROBADO |
| RN-02 | Identificación Unívoca de Versiones | Administrador de Configuración / Bibliotecario | CU-20 (Crear y congelar línea base), CU-12 (Check-In) | CU-13 (Consultar historial de versiones) | APROBADO |
| RN-03 | Trazabilidad de Cambios | Analista de Requerimientos / Gestor *(ver Inconsistencias)* | CU-08 (Emitir ECN/ECO), CU-12 (Check-In), CU-14 (Implementar cambio) | CU-27 (Auditar acciones) | APROBADO |
| RN-04 | Restricción de Bibliotecas Congeladas | Administrador de Configuración / Bibliotecario | CU-04 (Registrar RFC), CU-10 (Check-Out), CU-12 (Check-In), CU-20 (Línea Base) | CU-09 (Registrar ECS) | APROBADO |
| RN-05 | Evaluación Técnica Obligatoria | Arquitecto / Especialista Técnico | CU-06 (Análisis de impacto técnico), CU-07 (Evaluar viabilidad) | CU-05 (Validar y clasificar solicitud) | APROBADO |
| RN-06 | Bloqueo de Sincronización Obligatorio | Administrador de Configuración / Bibliotecario | CU-10 (Check-Out), CU-11 (Aplicar bloqueo), CU-12 (Check-In), CU-21 (Rollback) | CU-14 (Implementar cambio en ECS) | APROBADO |
| RN-07 | Diferenciación de Resultados de Cierre | Comité de Control de Cambios (CCB) / Administrador | CU-07 (Evaluar viabilidad: Rechazo Técnico/Admin), CU-22 (Cancelar Orden de Cambio) | CU-20 (Línea base para cierre exitoso: PENDIENTE DE VALIDACION) | REVISION |
| RN-08 | Reversión Obligatoria ante Fallo No Subsanado | Administrador de Configuración / Bibliotecario | CU-19 (Reevaluar y re-testear), CU-21 (Rollback en Trabajo), CU-22 (Cancelar Orden) | CU-18 (Reportar no conformidad) | APROBADO |
| RN-09 | Validación de QA Previa al Check-In a Biblioteca Maestra | Equipo de Calidad / Testing | CU-16 (Pruebas de integración), CU-17 (Certificar conformidad), CU-12 (Check-In) | CU-18 (Reportar no conformidad) | APROBADO |

---

# TB-14 — Matriz General de Trazabilidad SCM

**Estado:** REVISION  
**Fuente:** Consolidada a partir de `TB-03`, `TB-04`, `TB-06`, `TB-09` y `TB-10`  

| Necesidad Detectada (TB-03) | Requerimiento Funcional (TB-04) | Regla de Negocio Asociada (TB-06) | Casos de Uso Instrumentadores (TB-10) | Actor / Rol Responsable Principal (TB-09) |
| :--- | :--- | :--- | :--- | :--- |
| Pérdida de fuentes (Código disperso sin control) | RF-02 (Gestión de Proyectos)<br>RF-03 (Identificación de ECS)<br>RF-08 (Gestión de Bibliotecas) | RN-04 (Restricción de Bibliotecas Congeladas)<br>RN-06 (Bloqueo de Sincronización) | CU-02, CU-03, CU-09, CU-10, CU-12 | Administrador de Configuración / Bibliotecario<br>Arquitecto / Especialista Técnico |
| Modificaciones arbitrarias (Cambios informales) | RF-04 (Registro de RFC)<br>RF-05 (Clasificación e Impacto)<br>RF-06 (Evaluación por CCB)<br>RF-07 (Gestión de ECN/ECO) | RN-01 (Aprobación Obligatoria)<br>RN-05 (Evaluación Técnica Obligatoria)<br>RN-07 (Diferenciación de Cierre) | CU-04, CU-05, CU-06, CU-07, CU-08, CU-14 | Solicitante<br>Analista de Requerimientos<br>Arquitecto<br>Comité de Control de Cambios (CCB) |
| Confusión sobre la versión vigente (Sin baselines) | RF-09 (Control de Versiones / Bloqueos)<br>RF-13 (Gestión de Líneas Base) | RN-02 (Identificación Unívoca de Versiones)<br>RN-04 (Restricción de Bibliotecas Congeladas) | CU-10, CU-11, CU-12, CU-13, CU-20 | Administrador de Configuración / Bibliotecario |
| No se identifica al responsable de una falla | RF-01 (Usuarios y Roles RBAC)<br>RF-16 (Trazabilidad de Configuración)<br>RF-17 (Auditoría e Integridad) | RN-03 (Trazabilidad de Cambios) | CU-01, CU-13, CU-26, CU-27 | Administrador de Configuración<br>Comité de Control de Cambios (CCB) |
| Entregas al cliente sin validación previa | RF-10 (Gestión de Pruebas y Certificación)<br>RF-11 (Reevaluación y Re-test)<br>RF-12 (Rollback y Cancelación)<br>RF-14 (Cierre Formal del Cambio) | RN-08 (Reversión ante Fallo No Subsanado)<br>RN-09 (Validación de QA previa a Maestra) | CU-15, CU-16, CU-17, CU-18, CU-19, CU-21, CU-22 | Equipo de Calidad / Testing<br>Ingeniero de Software / Desarrollador<br>Administrador de Configuración |
| Gestión de fallas de clientes hacia cambios | RF-15 (Gestión de Incidencias y Soporte) | *PENDIENTE DE VALIDACION* (Sin regla de negocio exclusiva para incidencias en SRS) | CU-23, CU-24, CU-25 | Solicitante<br>Analista de Requerimientos / Gestor |
| Transparencia y reportería de gestión | RF-18 (Generación de Reportes) | *PENDIENTE DE VALIDACION* (Sin regla de negocio exclusiva para reportes en SRS) | CU-28 | Administrador de Configuración / Bibliotecario |

---

## Inconsistencias Detectadas

Las siguientes inconsistencias y discrepancias fueron identificadas durante la extracción minuciosa del documento consolidado `FD03-EPIS-Informe_SRS.md`. No fueron corregidas silenciosamente y se registran aquí para su tratamiento y decisión formal:

### 1. Inconsistencia de Contexto en Perfiles de Usuario
- **Elemento:** Párrafo explicativo posterior a la tabla de perfiles de usuario.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1 (Líneas 1070 a 1076, Págs. 30-31).
- **Descripción:** El texto menciona literalmente: *"...donde el mentoreado resuelve dudas temáticas, el mentor gestiona y dicta las clases acumulando horas, y la administración supervisa la calidad del servicio tutorial y formaliza las certificaciones."* Estos términos corresponden a un sistema de tutorías universitarias y no guardan ninguna relación funcional con el proyecto TraceFlow SCM.
- **Impacto:** Confusión conceptual severa en la documentación de perfiles de usuario y RBAC.
- **Recomendación de Revisión:** Sustituir dicho párrafo por una justificación técnica alineada a la segregación de responsabilidades entre los 7 roles canónicos de SCM (*Solicitante*, *Analista*, *Arquitecto*, *CCB*, *Administrador*, *Desarrollador*, *QA*).

### 2. Discrepancia en la Convención de Nomenclatura de Casos de Uso
- **Elemento:** Identificadores de casos de uso.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1.3 (Págs. 35-94) y 6.2.1 (Págs. 95-114).
- **Descripción:** El SRS utiliza el código `CUS01` a `CUS28` (sin guion), mientras que `docs/DOCUMENTATION_RULES.md` establece como convención oficial mandatoria el formato `CU-XX`.
- **Impacto:** Ambigüedad en la referencia cruzada entre diagramas, matrices y especificaciones de casos de uso.
- **Recomendación de Revisión:** Adoptar `CU-XX` como identificador canónico en `TABLES.md` y `DIAGRAMS.md`, manteniendo `CUSXX` en una columna de compatibilidad transitoria hasta que el SRS consolidado sea refactorizado.

### 3. Omisión del Diagrama de Secuencia para CUS03 (Consultar proyecto)
- **Elemento:** Diagramas de secuencia del modelo lógico.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 6.2.1 (Págs. 97-98).
- **Descripción:** Existen diagramas de secuencia documentados para CUS01, CUS02 y luego salta directamente a CUS04. El caso de uso CUS03 ("Consultar proyecto") no cuenta con diagrama de secuencia en el documento original.
- **Impacto:** Laguna de cobertura en el modelado dinámico de las interacciones del sistema.
- **Recomendación de Revisión:** Evaluar si se debe formular el diagrama `DG-SEQ-03` para la consulta de proyectos o si se declara formalmente exceptuado por tratarse de una consulta sincrónica estándar de lectura.

### 4. Malformación de Sintaxis Markdown en Encabezados de CUS19 y CUS20
- **Elemento:** Tablas narrativas de CUS19 y CUS20.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1.3 (Líneas 2012 y 2060, Págs. 74 y 76).
- **Descripción:** Por efecto de la conversión desde PDF, los metadatos iniciales de CUS19 y CUS20 quedaron renderizados como texto corrido (`Campo Descripción Código CUS19` y `Campo Descripción Código CUS20`) antes de los saltos de página, en lugar de conservar la cabecera tabular `| Campo | Descripción |`.
- **Impacto:** Dificultad para el parseo automatizado de los escenarios de casos de uso.
- **Recomendación de Revisión:** Corregir la sintaxis Markdown en el SRS consolidado asegurando la estructura tabular estándar en todos los 28 casos de uso.

### 5. Autoridad de la Regla de Negocio RN-03 (Trazabilidad de Cambios)
- **Elemento:** Campo *Autoridad* en la tabla de Reglas de Negocio.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 5.3 (Línea 946, Pág. 25).
- **Descripción:** La tabla asigna la autoridad de la regla RN-03 al *"Analista de Requerimientos / Gestor"*, a pesar de que el texto de la regla establece que *"Todo Check-in registrado debe incluir un mensaje descriptivo y estar asociado a una Orden de Cambio (ECN/ECO)"*, siendo el Check-In una función estrictamente técnica y operativa del *Administrador de Configuración / Bibliotecario*.
- **Impacto:** Atribución incorrecta de responsabilidades de cumplimiento en la biblioteca de software.
- **Recomendación de Revisión:** Modificar la autoridad de RN-03 a *"Administrador de Configuración / Bibliotecario"* o declararla compartida con el Analista de Requerimientos (quien verifica la existencia de la ECN).

### 6. Duplicidad Literal entre Viabilidad Social y Viabilidad Ambiental
- **Elemento:** Secciones de Viabilidad Social y Ambiental.
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 3.5 (Líneas 414-450, Págs. 16-17).
- **Descripción:** Los cuatro numerales de la Viabilidad Ambiental (*Optimización de Recursos de Hardware*, *Reducción de la Huella de Carbono Digital*, *Digitalización y Cero Papel*, *Promoción del Trabajo Remoto*) son una réplica exacta palabra por palabra de los cuatro numerales de la Viabilidad Social.
- **Impacto:** Redundancia que reduce el rigor técnico de la evaluación de viabilidad del sistema.
- **Recomendación de Revisión:** Reescribir la Viabilidad Ambiental enfocándose en métricas energéticas de servidores, centros de datos en la nube y consumo de red.

### 7. Cobertura del Cierre Exitoso en la Matriz RF-14
- **Elemento:** Requerimiento RF-14 (Cierre Formal del Cambio y Notificaciones).
- **Ubicación Aproximada:** `FD03-EPIS-Informe_SRS.md`, Sección 5.1 y 6.1.3.
- **Descripción:** En la narrativa de los casos de uso, el RF-14 solo aparece referenciado de manera explícita en el caso de uso CUS22 ("Cancelar Orden de Cambio"), correspondiente a cierres no exitosos o cancelaciones. El cierre formal por implementación exitosa ocurre dentro de CUS20 ("Crear y congelar línea base") o de manera complementaria en el flujo de gestión de cambios sin un caso de uso denominado exclusivamente "Cerrar cambio implementado".
- **Impacto:** Asimetría en la trazabilidad formal del cierre exitoso frente a los cierres por rechazo o cancelación.
- **Recomendación de Revisión:** Documentar explícitamente en el caso de uso CUS20 la asociación complementaria a RF-14 o crear un caso de uso específico para el cierre administrativo exitoso por parte del CCB.
