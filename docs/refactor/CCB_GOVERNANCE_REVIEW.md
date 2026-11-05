# TraceFlow SCM — Auditoría Normativa y Gobernanza del Comité de Control de Cambios (CCB)
## Análisis Documental de CU-07, Reglas de Votación y Discrepancias Normativas

---

### 1. Contexto y Justificación

El presente documento formaliza la auditoría técnico-normativa previa a la implementación de la infraestructura funcional para la **Deliberación del Comité de Control de Cambios (CU-07)** en TraceFlow SCM. 

El objetivo es contrastar las especificaciones normativas del **SRS (`FD03-EPIS-Informe_SRS.md`)**, el **SAD de Análisis (`FD04-EPIS-Informe_SAD_Analisis.md`)**, el **SAD de Diseño (`FD05-EPIS-Informe_SAD_Diseno.md`)**, las matrices canónicas (**`TABLES.md`**, **`DIAGRAMS.md`**) y los documentos de arquitectura de la refactorización (**`IDENTITY_AND_ROLES.md`**, **`RFC_IMPACT_ANALYSIS.md`**, **`RFC_MINOR_APPROVAL.md`**).

---

### 2. Integrantes del Comité en el Catálogo Actual

De la auditoría realizada sobre `prototype/src/data/initialUsers.ts` y `docs/refactor/IDENTITY_AND_ROLES.md`:

| Identificador | Nombre de Usuario | Nombre Completo | Rol Primario | Roles Asignados | Proyectos Autorizados | Miembro CCB (`PU-04`) |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|
| `USR-001` | `jmedina` | Joan Cristian Medina Quispe | `PU-02` | `['PU-02', 'PU-01']` | `PRJ-001`, `PRJ-002`, `PRJ-003` | ❌ No |
| `USR-002` | `rantayhua` | Renzo Antonio Antayhua Mamani | `PU-03` | `['PU-03', 'PU-06']` | `PRJ-001`, `PRJ-002`, `PRJ-003` | ❌ No |
| `USR-003` | `arivera` | Augusto Joaquin Rivera Muñoz | `PU-05` | `['PU-05', 'PU-07']` | `PRJ-001`, `PRJ-002`, `PRJ-003` | ❌ No |
| `USR-004` | `rloyola` | Renzo Fernando Loyola Vilca Choque | `PU-04` | `['PU-04']` | `PRJ-001`, `PRJ-002` | ✅ **SÍ (Único integrante)** |

#### Hallazgo crítico sobre el catálogo base:
- En la configuración actual de cuentas demostrativas, **únicamente `USR-004` (Renzo Fernando Loyola Vilca Choque) posee la asignación del rol canónico `PU-04`**.
- Además, `USR-004` tiene acceso restringido exclusivamente a `PRJ-001` y `PRJ-002` (aislamiento estricto respecto a `PRJ-003`).
- Los bocetos demostrativos del SAD (`WF-09`) hacen mención ilustrativa a múltiples integrantes ("Dr. Ricardo Valcarcel - Presidente CCB", "Ing. Renzo Antayhua - Líder de Arquitectura", "Lic. Joan Medina - Gestor de Proyecto"); sin embargo, en las matrices canónicas normativas `USR-001` y `USR-002` **no** poseen `PU-04` para preservar la estricta Segregación de Funciones (SoD) respecto a gestión y desarrollo.
- **Conclusión de catálogo:** La demostración con un único usuario `PU-04` no permite simular cuórum colegiado multifirmante de forma nativa sin la incorporación controlada de fixtures de prueba para las suites automatizadas.

---

### 3. Criterios Documentados de Pertenencia al CCB

Conforme a la tabla **TB-09** y el SRS:
1. **Atribución canónica exclusiva:** La emisión de votos colegiados para Cambios Mayores compete exclusivamente a cuentas con el rol canónico **`PU-04` (Comité de Control de Cambios)**.
2. **Segregación SoD anti-autoevaluación (`RN-01`, `RN-03`):** El usuario en rol Solicitante (`PU-01`) que originó la Solicitud de Cambio tiene prohibido votar o presidir la sesión del CCB sobre su propio requerimiento (`rfc.requesterId !== currentUser.id`).
3. **Aislamiento Multitenant por Proyecto:** Un integrante del CCB solo puede deliberar y votar sobre RFCs pertenecientes a proyectos a los cuales esté formalmente asignado (`user.assignedProjectIds.includes(rfc.projectId)`).

---

### 4. Reglas Oficiales de Votación

Conforme al SAD de Diseño (`FD05`, diagramas `DG-UWE-PRES-07` y wireframe `WF-09 / SCREEN-09`):
1. **Opciones formales de voto:**
   - **`APROBAR`:** Voto favorable a la procedencia del cambio mayor.
   - **`RECHAZAR`:** Voto desfavorable que desestima la procedencia por inviabilidad técnica, económica o de cronograma.
   - **`ABSTENCION`:** Posición neutral documentada (ej. por potencial conflicto de interés o especialidad no afín).
2. **Fundamentación cualitativa obligatoria:** Todo voto registrado debe consignar obligatoriamente una justificación descriptiva formal (mínimo 10 caracteres).
3. **Inmutabilidad y unicidad del voto:** Cada integrante del comité puede registrar a lo sumo un único voto por sesión formal. No se admiten votos repetidos por una misma identidad física.

---

### 5. Contradicciones y Discrepancias entre SRS y SAD

| Elemento Normativo | Especificación en SRS (`FD03`) | Especificación en SAD de Diseño (`FD05`) | Evaluación y Precedencia |
|---|---|---|---|
| **Cuórum de Sesión** | Exige *"validar el cuórum legal"* (Paso 5) y define la excepción *`E1 — Falta de cuórum reglamentario en la votación del CCB`*, bloqueando la formalización. No obstante, **no define valores cuantitativos** (ni número de miembros ni porcentaje). | **Saneamiento Normativo Explícito:** En notas de `NAV-10` y `WF-09` se indica textualmente: *"Se eliminan términos no regulados como 'quórum' o 'mayoría calificada'. El panel registra deliberación, votación individual fundamentada y emisión de resolución colegiada formal."* | **Discrepancia abierta:** El SAD elimina formalmente el término por falta de regulación legal en los términos de referencia, mientras que el SRS lo asume conceptualmente como excepción. |
| **Mecanismo de Decisión** | Menciona *"dictamen aprobatorio o rechazo colegiado"*, sugiriendo decisión del colectivo sin especificar regla de mayoría simple, mayoría calificada o unanimidad. | Presenta botones directos de acción: *"Emitir Resolución Oficial de Aprobación (CU-08)"* y *"Emitir Resolución de Rechazo"*, asociándolos a la formalización del acta de sesión sin cálculo algorítmico de mayoría. | **Indeterminación:** No existe fórmula matemática aprobada de ponderación o corte de votos. |
| **Composición del Comité** | Describe al CCB como un actor colectivo (`ACT_CCB`) con roles institucionales multidisciplinarios. | Muestra ejemplos visuales con 3 miembros, pero el catálogo de cuentas de usuario solo cuenta con 1 usuario activo asignado a `PU-04`. | **Incompatibilidad de catálogo para cuórum numérico fijo.** |

---

### 6. Aspectos Normativos Pendientes de Definición

Para que el sistema pueda resolver automáticamente el cierre de la deliberación del CCB mediante software, la Dirección del Proyecto / Product Owner debe definir y aprobar formalmente:

1. **Tamaño mínimo del Comité:** ¿Cuántos integrantes conforman el CCB por proyecto?
2. **Regla de Cuórum de Instalación:** ¿Se requiere un mínimo de integrantes presentes para habilitar la votación (ej. $\ge 50\%$ o número fijo)?
3. **Regla de Decisión Aprobatoria:**
   - ¿Unanimidad de votos emitidos?
   - ¿Mayoría simple ($> 50\%$ de los votos válidos)?
   - ¿Mayoría calificada ($\ge 2/3$)?
4. **Tratamiento de Abstenciones:** ¿La abstención reduce la base de cálculo de la mayoría o computa negativamente?
5. **Voto Dirimente / Veto:** ¿El Presidente del CCB o el Gestor de Proyecto posee voto dirimente en caso de empate o facultad de veto estratégico?

---

### 7. Alternativas de Resolución Propuestas

| Alternativa | Mecanismo | Ventajas | Desventajas |
|---|---|---|---|
| **Alternativa 1: Unanimidad de Integrantes Asignados** | Requiere voto aprobatorio del 100% de los miembros `PU-04` asignados al proyecto, sin rechazos. | Máxima seguridad para cambios mayores de alto riesgo. | Vulnerable a bloqueos si un integrante no vota o se abstiene. |
| **Alternativa 2: Mayoría Simple con Quórum Mínimo** | Requiere participación de al menos 3 integrantes y $>50\%$ de votos a favor. | Práctica estándar en comités de ingeniería corporativa. | Requiere ampliar el catálogo oficial de usuarios para contar con al menos 3 cuentas `PU-04`. |
| **Alternativa 3: Votación Deliberativa + Resolución Formal del Presidente** | Los miembros emiten sus votos individuales fundamentados y el Presidente del CCB emite el acta resolutiva formal (Aprobada / Rechazada) considerando las opiniones del comité. | Totalmente compatible con la nota de saneamiento del SAD (`FD05`) y flexible ante catálogos reducidos. | La resolución final recae en la firma de cierre del responsable de la sesión. |

---

### 8. Política de Implementación para la Fase 04C.1

En estricta observancia del principio de **no invención de reglas de negocio arbitrarias**:

1. **Infraestructura implementada al 100%:**
   - Creación y apertura de sesiones de deliberación CCB para solicitudes en `EN_EVALUACION` clasificadas como `CAMBIO_MAYOR`.
   - Consulta de integrantes autorizados del comité vinculados al proyecto.
   - Registro individual e inmutable de votos (`APROBAR`, `RECHAZAR`, `ABSTENCION`) con fundamentación obligatoria ($\ge 10$ caracteres).
   - Prevención estricta de votos duplicados por la misma cuenta de usuario.
   - Bloqueo de roles no autorizados (exclusividad `PU-04`) y aislamiento multitenant de proyectos.
   - Confección de borrador de acta de deliberación y cálculo estadístico de votos emitidos (a favor, en contra, abstenciones).
   - Registro de auditoría demostrativa append-only con hash SHA-256 (`CCB_SESION_INICIADA`, `CCB_VOTO_REGISTRADO`, `CCB_ACTA_GENERADA`).
2. **Salvaguarda de resolución automática (Bloqueo Normativo):**
   - El sistema **NO** calculará automáticamente la aprobación ni el rechazo definitivo mientras la regla de cuórum y mayoría no esté formalmente normada y aprobada por el responsable del proyecto.
   - La RFC permanecerá de forma segura en **`EN_EVALUACION`**.
   - En la interfaz de usuario se presentará un aviso administrativo de gobernanza informando que la sesión y los votos están debidamente registrados en el borrador de acta, encontrándose la resolución definitiva a la espera de la reglamentación colegiada.
   - Los contratos y métodos para emitir la resolución formal definitiva quedan completamente preparados en el servicio para su activación inmediata tan pronto se autorice la regla corporativa.
