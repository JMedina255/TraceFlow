# TraceFlow SCM — Especificación Normativa de Autorización Delegada de Cambios Menores (CU-30)

## 1. Identificación y Trazabilidad Normativa

El caso de uso **CU-30: Autorizar Cambio Menor** implementa el mecanismo de gobernanza ágil y segregada para solicitudes de cambio que, habiendo superado el análisis de impacto técnico (`CU-06`), fueron dictaminadas como **`CAMBIO_MENOR`**. 

Garantiza la celeridad operativa sin relajar el rigor de control de configuración, evitando sobrecargar al Comité de Control de Cambios (CCB) en pleno para modificaciones de bajo riesgo y alcance acotado.

* **Caso de Uso:** `CU-30` (Catálogo SRS `TB-10`, `CUS30`).
* **Requisitos Funcionales:**
  * `RF-05`: Clasificación y Análisis de Impacto (acreditación de no afectación a la Triple Restricción).
  * `RF-07`: Gestión de Órdenes de Cambio (habilitación previa para la emisión de ECN/ECO).
  * `RF-14`: Cierre Formal del Cambio y Notificaciones (resolución denegatoria a estado terminal `RECHAZADA`).
* **Reglas de Negocio Normativas:**
  * `RN-01`: **Aprobación Obligatoria de Integración** (ningún cambio menor puede pasar a implementación sin la autorización formal conjunta).
  * `RN-05`: **Evaluación Técnica Obligatoria y Clasificación** (la autorización delegada requiere como insumo obligatorio el Informe Técnico de Impacto emitido).
  * `RN-07`: **Diferenciación de Resultados y Estados de Cierre** (distinción entre estado `AUTORIZADA` y estado terminal `RECHAZADA`).
* **Diagramas de Referencia:**
  * `DG-SEQ-30`: Secuencia Conceptual de Análisis (UWE / SRS 6.2.1).
  * `DG-DSEQ-30`: Secuencia Técnica de Diseño (SAD Sección 12.2).
  * `DG-AO-30`: Análisis de Objetos BCE (Boundary: *Autorización Delegada de Cambio Menor*, Control: *Control de Autorización de Cambio Menor*, Entity: *Dictamen de Cambio Menor / ChangeAuthorization*).
  * `SCREEN-10` / `WF-10`: Consola de Autorización de Cambio Menor (`NAV-11`, `PRES-07`).
* **Estados Involucrados (TB-07 / DG-11):**
  * Estado Previo: `EN_EVALUACION` (con `classification: 'CAMBIO_MENOR'`).
  * Estado Aprobatorio: `AUTORIZADA` (habilita `CU-08`).
  * Estado Denegatorio: `RECHAZADA` (estado terminal) o reescalamiento a `CAMBIO_MAYOR` (CCB `CU-07`).

---

## 2. Roles Participantes y Principio de Doble Llave Operativa

Conforme a `RN-01`, `RN-05` y `DG-DSEQ-30`, la autorización delegada **no es unipersonal**. Constituye un mecanismo colegiado abreviado denominado **Doble Llave Operativa**, integrado por dos autoridades con responsabilidades complementarias:

1. **Analista de Requerimientos / Gestor (`PU-02`):**
   * *Responsabilidad:* Evalúa y emite el **Visto Bueno Funcional y de Gestión**.
   * *Criterio de Evaluación:* Verifica la justificación operativa del negocio, la prioridad, la ausencia de conflictos con la planificación del proyecto y la viabilidad de recursos.
2. **Arquitecto / Especialista Técnico (`PU-03`):**
   * *Responsabilidad:* Evalúa y emite el **Visto Bueno Técnico y Arquitectónico**.
   * *Criterio de Evaluación:* Ratifica que el cambio cumple estrictamente los límites de un Cambio Menor, que no degrada la arquitectura, que los riesgos identificados son tolerables y que el plan de rollback es viable.

---

## 3. Controles Normativos vs. Controles Adicionales de Seguridad

Es fundamental diferenciar los controles expresamente obligados por las baselines SRS/SAD de los controles adicionales de endurecimiento frontend/seguridad implementados:

| Control | Tipo de Control | Justificación y Sustento |
| :--- | :---: | :--- |
| **Doble Rol Concurrente (`PU-02` + `PU-03`)** | **Exigido Normativamente** | Mandato explícito de `RN-01`, `RN-05` y diagramas `DG-SEQ-30` y `DG-DSEQ-30`. Se requieren ambas conformidades para autorizar. |
| **Insumo de Informe Técnico Congelado** | **Exigido Normativamente** | `RN-05`: La autorización delegada solo puede ejecutarse si existe un `TechnicalImpactReport` completado en `CU-06`. |
| **Estado Previo `EN_EVALUACION`** | **Exigido Normativamente** | `TB-07`: Estado oficial 5 donde residen las RFCs pendientes de resolución colegiada o delegada. |
| **Aislamiento Multitenant de Proyecto** | **Exigido Normativamente** | SAD 3.4: El operador debe tener asignado el proyecto en `assignedProjectIds`. |
| **Antiautoevaluación del Solicitante (SoD)** | **Exigido Normativamente** | SAD 6.3 y `RN-01`: El solicitante original (`rfc.requesterId === currentUser.id`) no puede autorizar su propio cambio. |
| **Segregación por Identidad Distinta (`userId`)** | **Control Adicional de Seguridad** | En el entorno demo donde usuarios poseen perfiles múltiples, se exige como política de endurecimiento que: `gestorApproval.userId !== architectApproval.userId`. Una misma persona física no puede completar ambas llaves alternando de rol en la misma sesión. |
| **Inmutabilidad de Dictámenes Emitidos** | **Control Adicional de Seguridad** | Una vez registrada la conformidad (Aprobado/Rechazado), el registro queda congelado para auditoría; no puede sobreescribirse ni borrarse en caliente. |

---

## 4. Contratos de Datos

```typescript
export type ApprovalDecision = 'APROBADO' | 'RECHAZADO';

export type ApprovalRole = 'GESTOR' | 'ARQUITECTO';

export interface MinorApprovalRecord {
  id: string;                    // Correlativo APR-2026-XXXX
  rfcId: string;
  impactReportId: string;
  role: ApprovalRole;            // 'GESTOR' o 'ARQUITECTO'
  roleId: 'PU-02' | 'PU-03';     // Rol canónico que firmó
  userId: string;                // Identificador inmutable del usuario
  userName: string;              // Nombre del evaluador derivado de la sesión
  decision: ApprovalDecision;
  justification: string;         // Fundamentación obligatoria (mínimo 10 caracteres)
  decidedAt: string;             // Timestamp ISO 8601
}

export interface DelegatedMinorApproval {
  rfcId: string;
  impactReportId: string;
  gestorApproval?: MinorApprovalRecord;
  architectApproval?: MinorApprovalRecord;
  overallStatus: 'PENDIENTE' | 'AUTORIZADA' | 'RECHAZADA' | 'REESCALADA_CCB';
  completedAt?: string;
}
```

---

## 5. Matriz de Permisos y Reglas SoD en Runtime

| Acción del Sistema | Rol Autorizado | Rol Incompatible | Precondición Obligatoria |
| :--- | :---: | :---: | :--- |
| **Emitir Visto Bueno de Gestión** | `PU-02` *(Gestor)* | `PU-01`, `PU-03`, `PU-04`, `PU-05`, `PU-06`, `PU-07` | RFC en `EN_EVALUACION`, `CAMBIO_MENOR`, Gestor no es autor original de la RFC. |
| **Emitir Visto Bueno de Arquitectura** | `PU-03` *(Arquitecto)* | `PU-01`, `PU-02`, `PU-04`, `PU-05`, `PU-06`, `PU-07` | RFC en `EN_EVALUACION`, `CAMBIO_MENOR`, Arquitecto no es autor original de la RFC. |
| **Cierre Compartido a `AUTORIZADA`** | Motor de Negocio (Automático) | N/A | Existencia concurrente de ambos vistos buenos con decisión `APROBADO` emitidos por diferentes `userId`. |

---

## 6. Escenarios Operativos y Flujos del Caso de Uso

### Escenario A: Emisión de la Primera Conformidad (Estado Parcial)
1. El Gestor (`PU-02`) o el Arquitecto (`PU-03`) accede a `/rfcs/:rfcId/minor-approval`.
2. Emite su visto bueno aprobatorio (`decision: 'APROBADO'`) con fundamentación.
3. Se persiste el registro `MinorApprovalRecord` y se emite evento de auditoría `RFC_APROBACION_PARCIAL_MENOR`.
4. **Comportamiento del Estado:** La RFC **permanece en `EN_EVALUACION`**. El sistema notifica que falta la segunda conformidad. **No se emite ECN**.

### Escenario B: Emisión de la Segunda Conformidad (Autorización Completa)
1. El segundo actor autorizado accede y emite su visto bueno aprobatorio.
2. El sistema valida la regla de segregación por identidad (`userId1 !== userId2`).
3. El sistema valida la presencia de ambas conformidades aprobatorias.
4. **Transición Canónica:** La RFC transiciona a **`AUTORIZADA`**.
5. Se emite evento de auditoría demostrativo `RFC_APROBADA_MENOR`.
6. Queda formalmente habilitado el siguiente caso de uso: **`CU-08: Emitir Orden de Cambio (ECN/ECO)`**. No se genera automáticamente la ECN en esta fase.

### Escenario C: Dictamen Negativo y Causal de Rechazo
Si cualquiera de los dos evaluadores determina que el cambio no es viable:
1. Emite su dictamen con `decision: 'RECHAZADO'` y fundamentación obligatoria.
2. **Alternativa C.1 (Rechazo Definitivo - RN-07):** Si la causal es inviabilidad operativa o técnica insubsanable, la RFC transiciona a estado terminal **`RECHAZADA`**, registrando `rejectionReason` y emitiendo auditoría `RFC_RECHAZADA`.
3. **Alternativa C.2 (Reescalamiento por Rebasamiento de Límites - DG-SEQ-30 A1):** Si el evaluador determina que el cambio excede los umbrales de Cambio Menor (ej. requiere modificar la línea base arquitectónica o costo superior al previsto), dictamina reescalamiento. El expediente se reclasifica formalmente a `CAMBIO_MAYOR` y se canaliza hacia deliberación del CCB en **`CU-07`**, conservando el estado `EN_EVALUACION`.

---

## 7. Criterios de Aceptación Verificables

1. Un usuario con rol `PU-02` puede emitir únicamente la conformidad de Gestión.
2. Un usuario con rol `PU-03` puede emitir únicamente la conformidad de Arquitectura.
3. Los 5 roles restantes son bloqueados con excepción descriptiva de segregación de funciones.
4. Si una RFC no se encuentra en `EN_EVALUACION` o no está clasificada como `CAMBIO_MENOR`, cualquier intento de autorización delegada es rechazado.
5. El solicitante original no puede aprobar su propia RFC aunque posea rol de Gestor o Arquitecto.
6. La RFC permanece en `EN_EVALUACION` tras la primera aprobación; transiciona a `AUTORIZADA` únicamente al registrarse la segunda aprobación aprobatoria.
7. Un mismo usuario (`userId`) no puede firmar ambas conformidades.
8. Una misma conformidad no puede ser emitida dos veces para el mismo rol.
9. Se emite auditoría demostrativa con la identidad real del firmante y timestamp.
10. La aprobación no emite automáticamente una orden ECN.
