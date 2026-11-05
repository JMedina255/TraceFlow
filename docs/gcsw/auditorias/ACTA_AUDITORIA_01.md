# ACTA DE AUDITORÍA DE CONFIGURACIÓN DE SOFTWARE

## I. Datos generales

- **Proyecto:** TraceFlow SCM
- **Código de control:** AUD-GCSW-001
- **Fecha de auditoría:** 04/11/2026
- **Repositorio auditado:** https://github.com/JMedina255/TraceFlow
- **Referencia Git:** Rama `master`, commit `6f5b234`
- **Equipo responsable:** C-SharkTeam (Joan Medina, Renzo Antayhua, Renzo Loyola, Augusto Rivera)
- **Alcance:** Auditoría física de la configuración (PCA) predominante y auditoría funcional (FCA) limitada al prototipo demostrativo
- **Estado:** BORRADOR — PENDIENTE DE REVISIÓN

---

## II. Hallazgos de auditoría

| Hallazgo | Evidencia | Clasificación | Acción correctiva y responsable |
| :--- | :--- | :---: | :--- |
| **H-01. Inconsistencia en el versionamiento del Plan de Gestión de Configuración**<br>El documento `D-GCSW001` presenta discrepancias entre el nombre de archivo (V1.1), la carátula (0.1.0) y el historial de revisiones (0.2.0), impidiendo identificar inequívocamente la versión formal vigente. | `DIAG-GCSW-001` (`docs/gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md`), §2.1.A. Archivo externo localizado fuera del repositorio Git. | **PCA** | Conciliar el historial documental, unificar la nomenclatura y registrar la versión canónica con su evidencia de aprobación.<br>**Responsable:** Joan Cristian Medina Quispe (Administrador de Configuración). |
| **H-02. Inventario de ECS desactualizado respecto del repositorio**<br>El registro `R-GCSW006` contempla 24 ECS al corte del commit `a12e44f` (14/10/2026). No incluye los nuevos componentes, servicios, pruebas de `prototype/src/` ni los documentos de `docs/refactor/` incorporados posteriormente. | `DIAG-GCSW-001`, §3.1 y §3.2. Discrepancia verificada en `ECS-TF-14` (código fuente), `ECS-TF-15` (build) y `ECS-TF-16` (pruebas). | **PCA** | Actualizar `R-GCSW006` contrastando cada ECS con el repositorio físico. Asignar códigos correlativos (`ECS-TF-25` en adelante) a los nuevos artefactos.<br>**Responsable:** Joan Cristian Medina Quispe (Administrador de Configuración), con soporte técnico. |
| **H-03. Ausencia de evidencia de aprobación formal de cambios**<br>No se evidencian formatos `R-GCSW002` diligenciados ni actas del CCB que autoricen formalmente los cambios integrados. Los commits y Pull Requests acreditan integración técnica en Git, pero no constituyen aprobación de SCM. | `DIAG-GCSW-001`, §2.2 y §5.1. Repositorio con 8 PRs integrados en GitHub sin actas de aprobación formal correspondientes. | **PCA** | Formalizar el flujo de vinculación entre Solicitud (RFC), Evaluación, Aprobación (`R-GCSW002`) y Commit. Declarar los cambios históricos en estado pendiente de regularización.<br>**Responsable:** Joan Cristian Medina Quispe (Administrador de Configuración). |
| **H-04. Líneas base planificadas sin formalización verificable**<br>Las líneas base planificadas (`LB-F1I1` a `LB-F3I1`) no cuentan con actas de autorización, referencias de congelamiento técnico ni sellado criptográfico. | `DIAG-GCSW-001`, §6.2 y §6.3. Verificación técnica en el repositorio: `git tag -l` devuelve 0 etiquetas y no existen GitHub Releases ni bundles de respaldo. | **PCA** | Seleccionar una configuración candidata, formalizar la aprobación con el CCB y el docente asesor, y congelar la línea base mediante una etiqueta Git controlada (`git tag -a`).<br>**Responsable:** Joan Cristian Medina Quispe (Administrador de Configuración). |
| **H-05. Evidencia insuficiente de aceptación del prototipo demostrativo**<br>El prototipo cuenta con pruebas unitarias y matriz de navegación, pero no se localizó un acta formal de verificación visual y funcional suscrita con los resultados de aceptación de las pantallas desarrolladas.<br>*(Nota: No implica fallo del prototipo ni exigencia de implementar todo el SRS).* | `docs/PROTOTYPE_SPECIFICATION.md`, §3 y componentes en `prototype/src/`. Ausencia del acta formal en la documentación SCM *(evidencia pendiente de validación con archivos externos de calidad)*. | **FCA** | Diseñar una lista de chequeo de aceptación del prototipo, ejecutar recorridos documentados distinguiendo pantallas funcionales de vistas simuladas, y formalizar el acta de aceptación.<br>**Responsables:** Augusto Joaquín Rivera Muñoz (Calidad y Auditoría) y Renzo Fernando Loyola Vilca Choque (Frontend). |

---

## III. Conclusión y decisión

Con base en la evaluación efectuada, se determina que el proyecto presenta condiciones técnicas de desarrollo operativas y verificables, pero carece de las evidencias documentales indispensables de gobernanza de configuración: líneas base congeladas con etiquetas Git, actas de aprobación formal de cambios (R-GCSW002) y conciliación del inventario de ECS. Por consiguiente, **no se recomienda liberar TraceFlow SCM a un entorno de producción ni declarar una línea base formalmente aprobada** hasta que se regularicen las acciones correctivas señaladas. No obstante, **el sistema puede y debe continuar utilizándose como prototipo demostrativo y entorno de validación académica**, identificando expresamente el carácter simulado de sus módulos en desarrollo y la naturaleza de las pantallas actualmente operativas.
