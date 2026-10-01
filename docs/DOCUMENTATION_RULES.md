# Reglas de Gobernanza Documental - TraceFlow SCM

> **Sistema de Gestión de Configuración de Software - TraceFlow SCM**  
> **Repositorio:** `TraceFlow`  
> **Documento de Reglas de Gobernanza Documental**  
> **Equipo de Desarrollo:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)  
> **Versión:** 1.0  
> **Fecha de Entrada en Vigencia:** 2026-09-30  
> **Estado:** APROBADO  

---

## 1. Propósito y Ámbito de Aplicación

El presente documento establece las políticas, normas, convenciones y flujos obligatorios para la creación, actualización, mantenimiento y control de versiones de toda la documentación técnica y funcional del proyecto **TraceFlow SCM**.

Su propósito es garantizar la integridad, consistencia, auditabilidad y trazabilidad bidireccional entre requerimientos, reglas de negocio, perfiles de usuario, casos de uso, modelos conceptuales/lógicos, diagramas de arquitectura y el código fuente.

Este marco de gobernanza es de cumplimiento obligatorio para todos los integrantes del equipo de desarrollo, analistas, arquitectos y evaluadores que intervengan en el repositorio.

---

## 2. Responsabilidad de Archivos y Arquitectura Documental

Para optimizar el mantenimiento y evitar redundancias operativas, la documentación del proyecto se estructura en responsabilidades delimitadas bajo el principio de **Fuente Única de Verdad (Single Source of Truth - SSOT)**:

| Archivo | Responsabilidad Principal | Naturaleza |
| :--- | :--- | :--- |
| `FD03-EPIS-Informe_SRS.md` | **Documento Maestro Consolidado:** Contiene la memoria completa de Especificación de Requerimientos de Software (SRS) para evaluación formal, contractual y académica. Compila de forma estructurada los requerimientos, tablas, diagramas y narrativas. | Documento Consolidado |
| `docs/DOCUMENTATION_RULES.md` | **Normativa de Gobernanza Documental:** Define las reglas, estándares de nomenclatura, jerarquías, convenciones de identificadores, checklists y flujo de cambios documentales. | Referencia Normativa Vinculante |
| `docs/DIAGRAMS.md` | **Fuente Oficial de Diagramas:** Repositorio centralizado y exclusivo de código fuente PlantUML, definiciones gráficas, especificaciones de modelos (casos de uso, secuencia, actividades, clases, paquetes). | Fuente Oficial de Diagramas (SSOT) |
| `docs/TABLES.md` | **Fuente Oficial de Datos Estructurados:** Repositorio centralizado y exclusivo de matrices de trazabilidad, tablas de requerimientos (RF/RNF), reglas de negocio (RN), perfiles de usuario (PU), cuadros comparativos e inventarios de configuración. | Fuente Oficial de Datos Estructurados (SSOT) |

### Declaraciones Fundamentales de Autoridad:
1. `docs/TABLES.md` es la **única fuente oficial** para cualquier dato tabular o matriz de trazabilidad. Ninguna tabla se crea de forma aislada en el SRS sin residir formalmente en este archivo.
2. `docs/DIAGRAMS.md` es la **única fuente oficial** para los diagramas y su especificación PlantUML. Ningún diagrama se redefine de manera independiente sin estar versionado en este archivo.
3. `FD03-EPIS-Informe_SRS.md` es el **documento consolidado**, que consume y refleja fielmente los contenidos definidos en `TABLES.md` y `DIAGRAMS.md`.

---

## 3. Jerarquía Documental y Reglas de Precedencia

Se define la siguiente jerarquía de autoridad documental:

```
[Nivel 1] docs/DOCUMENTATION_RULES.md (Gobernanza y Reglas Mandatorias)
   │
   ├── [Nivel 2] docs/TABLES.md (SSOT de Tablas y Matrices)
   └── [Nivel 2] docs/DIAGRAMS.md (SSOT de Diagramas PlantUML)
         │
         └── [Nivel 3] FD03-EPIS-Informe_SRS.md (Documento Consolidado)
```

### Reglas de Precedencia y Consistencia:
1. **Conflicto en datos estructurados o matrices:** Prevalece estrictamente lo definido en `docs/TABLES.md` sobre cualquier transcripción en el documento consolidado.
2. **Conflicto en modelado o especificación visual:** Prevalece estrictamente la especificación PlantUML y la lógica descrita en `docs/DIAGRAMS.md`.
3. **Sincronización Mandatoria:** Toda modificación efectuada en una fuente oficial (Nivel 2) exige la actualización sincronizada e inmediata del documento consolidado `FD03-EPIS-Informe_SRS.md` (Nivel 3) dentro del mismo ciclo de cambio.

---

## 4. Convenciones Oficiales de Identificadores

Para asegurar la auditabilidad y trazabilidad inequívoca en todo el ciclo de vida del software, se definen los siguientes prefijos obligatorios:

| Elemento | Prefijo Oficial | Formato | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| Requerimiento Funcional | `RF-` | `RF-XX` (2 dígitos mín.) | `RF-01`, `RF-14` | Capacidades y funciones del sistema TraceFlow SCM. |
| Requerimiento No Funcional | `RNF-` | `RNF-XX` (2 dígitos mín.) | `RNF-01`, `RNF-08` | Criterios de calidad, seguridad, rendimiento y arquitectura. |
| Regla de Negocio | `RN-` | `RN-XX` (2 dígitos mín.) | `RN-01`, `RN-06` | Políticas, restricciones y directrices operativas mandatorias. |
| Perfil de Usuario / Actor | `PU-` | `PU-XX` (2 dígitos mín.) | `PU-01`, `PU-05` | Roles humanos o del sistema autorizados a interactuar con SCM. |
| Caso de Uso | `CU-` | `CU-XX` (2 dígitos mín.) | `CU-01`, `CU-12` | Unidades de interacción funcional del sistema. |
| Diagrama General / Proceso | `DG-` | `DG-XX` (2 dígitos mín.) | `DG-01`, `DG-04` | Diagramas de actividades, paquetes, clases o casos de uso. |
| Diagrama de Secuencia | `DG-SEQ-` | `DG-SEQ-XX` (2 dígitos mín.) | `DG-SEQ-01` | Interacciones dinámicas y temporales entre objetos y capas. |

### Regla Estricta de No Reutilización de Identificadores:
- **Prohibición absoluta:** Un identificador asignado y posteriormente eliminado, fusionado o descartado **NUNCA DEBE REUTILIZARSE**.
- **Justificación:** La reutilización corrompe la trazabilidad histórica en los commits de Git, los registros de auditoría y las actas de cambio.
- **Tratamiento de bajas:** Cuando un requerimiento, regla o caso de uso deje de aplicar, su identificador debe registrarse en la matriz con estado `OBSOLETO`, indicando la justificación del descarte y conservando el salto numérico para nuevos elementos correlativos.

---

## 5. Nomenclatura Oficial de Actores y Roles

Queda terminantemente prohibido el uso de alias, acrónimos informales o traducciones no homologadas (tales como *Admin*, *Dev*, *Tester*, *Gestor solo*, *Cliente*). Los únicos nombres oficiales de actores reconocidos en la documentación y diagramas son:

1. **`Solicitante`**
2. **`Analista de Requerimientos / Gestor`**
3. **`Arquitecto / Especialista Técnico`**
4. **`Comité de Control de Cambios (CCB)`**
5. **`Administrador de Configuración / Bibliotecario`**
6. **`Ingeniero de Software / Desarrollador`**
7. **`Equipo de Calidad / Testing`**

Cualquier referencia en casos de uso, matrices de permisos (RBAC) o swimlanes de PlantUML debe coincidir textualmente con esta nomenclatura.

---

## 6. Terminología SCM Oficial del Proyecto

La documentación de TraceFlow SCM emplea un vocabulario técnico especializado alineado a las buenas prácticas de Gestión de la Configuración del Software. Los siguientes términos deben utilizarse con estricto apego a su definición oficial:

- **`ECS` (Elemento de Configuración de Software):** Unidad atómica o compuesta de artefacto de software (código fuente, esquema de base de datos, archivo de configuración, especificación de requerimientos) sometida a control de versiones y auditoría.
- **`RFC` (Request for Change / Solicitud de Cambio):** Documento formal donde el Solicitante registra la necesidad de modificación, indicando descripción, justificación, prioridad y ECS afectado.
- **`ECN/ECO` (Engineering Change Notice / Engineering Change Order):** Orden formal de cambio emitida por el Comité de Control de Cambios (CCB) para Cambios Mayores, o bajo autoridad operativa delegada compartida entre el Analista de Requerimientos / Gestor y el Arquitecto / Especialista Técnico para Cambios Menores. La ECN/ECO autoriza formalmente el inicio de trabajos técnicos sobre los ECS.
- **`Check-Out`:** Operación controlada mediante la cual un ECS autorizado es transferido desde la Biblioteca de Soporte hacia la Biblioteca de Trabajo para su modificación.
- **`Check-In`:** Operación controlada mediante la cual un ECS verificado y certificado por QA es reintegrado formalmente a la Biblioteca Maestra o de Soporte.
- **`Biblioteca de Trabajo`:** Espacio aislado de desarrollo y modificación donde los consultores implementan los cambios asignados sobre copias de trabajo de los ECS.
- **`Biblioteca de Soporte`:** Entorno controlado intermedio utilizado para pruebas de integración, validación técnica y compilaciones preliminares.
- **`Biblioteca Maestra`:** Repositorio central, definitivo y de alta seguridad que alberga las versiones consolidadas, congeladas y auditadas de los ECS liberados a producción.
- **`Línea Base / Baseline`:** Conjunto congelado de Elementos de Configuración formalmente aprobado en un instante del tiempo, que sirve como base obligatoria para desarrollos o despliegues posteriores.
- **`Bloqueo de sincronización`:** Mecanismo impuesto por el sistema que impide que múltiples usuarios modifiquen concurrentemente un mismo ECS mientras se encuentra en Check-Out en la Biblioteca de Trabajo.
- **`Certificación de Conformidad`:** Dictamen formal expedido por el Equipo de Calidad / Testing tras superar satisfactoriamente las pruebas de integración y validación funcional.
- **`Rollback`:** Procedimiento de reversión ejecutado por el Administrador de Configuración en la Biblioteca de Trabajo para restablecer el ECS a su estado previo estable cuando un cambio no supera los ciclos de QA permitidos.

---

## 7. Estados Documentales Oficiales

Cada sección, requerimiento, matriz o diagrama del proyecto debe poseer un estado explícito de ciclo de vida documental:

| Estado | Significado y Criterio de Transición |
| :--- | :--- |
| **`BORRADOR`** | Artefacto en propuesta o redacción preliminar. No es exigible para desarrollo ni vinculante para implementación. |
| **`REVISION`** | Artefacto completo sometido a inspección por pares, análisis de arquitectura o validación técnica. |
| **`APROBADO`** | Artefacto validado formalmente por el equipo o el CCB. Forma parte de la línea base documental del proyecto. |
| **`OBSOLETO`** | Artefacto o elemento descontinuado. Se mantiene visible únicamente para fines de auditoría histórica con mención de su reemplazo. |

---

## 8. Reglas de Modificación y Consistencia

### 8.1. Reglas para Creación y Modificación de Diagramas
- **Ubicación oficial:** Todo código fuente UML debe residir en `docs/DIAGRAMS.md`.
- **Estandarización visual:** Los diagramas PlantUML deben utilizar la paleta corporativa y configuración skinparam definida para el proyecto (fuente Arial, bordes redondeados, colores de swimlane canónicos).
- **Consistencia de actores:** Los nombres de carriles (swimlanes), lifelines o actores en diagramas de secuencia y casos de uso deben coincidir exactamente con los 7 roles oficiales.
- **Exportación gráfica:** Cada diagrama debe contar con su correspondiente archivo compilado `.png` y/o `.svg` alojado en el directorio `assets/`.

### 8.2. Reglas para Creación y Modificación de Tablas
- **Ubicación oficial:** Toda tabla analítica, requerimiento o matriz debe residir en `docs/TABLES.md`.
- **Formato Markdown:** Uso estricto de sintaxis de tablas GFM (GitHub Flavored Markdown) con alineación justificada en encabezados y celdas.
- **Columnas obligatorias en tablas de requerimientos:** Identificador, Nombre, Descripción, Prioridad y Estado.

### 8.3. Reglas para Incorporación de Nuevas Funcionalidades
1. Debe originarse o justificarse en una necesidad documentada del sistema.
2. Se asignará el siguiente número correlativo disponible para `RF-XX`.
3. Se determinarán sus correspondientes reglas de negocio `RN-XX` asociadas.
4. Se formulará el o los casos de uso `CU-XX` requeridos para instrumentarlo.
5. Se actualizará la matriz de trazabilidad en `docs/TABLES.md` y luego en `FD03-EPIS-Informe_SRS.md`.

### 8.4. Cadena de Trazabilidad Obligatoria
Cualquier modificación debe respetar la cadena de causalidad técnica:
$$\text{RF} \longrightarrow \text{RN} \longrightarrow \text{CU} \longrightarrow \text{Diagramas (Actividades / Secuencia)} \longrightarrow \text{Implementación}$$

- Ningún Caso de Uso (`CU`) puede existir sin al menos un Requerimiento Funcional (`RF`) asociado.
- Ninguna Regla de Negocio (`RN`) puede quedar sin una entidad o rol responsable.
- Ningún Diagrama de Secuencia (`DG-SEQ`) puede invocar actores o métodos que no deriven de un `CU` documentado.

---

## 9. Flujo Obligatorio de Actualización Documental

Para efectuar cualquier cambio en la documentación, se debe ejecutar rigurosamente el siguiente flujo de trabajo:

```
[1. Identificar necesidad / RFC]
               │
               ▼
[2. Modificar Fuente Oficial (TABLES.md o DIAGRAMS.md)]
               │
               ▼
[3. Regenerar Gráficos (PNG/SVG en assets/) si aplica]
               │
               ▼
[4. Sincronizar Documento Maestro (FD03-EPIS-Informe_SRS.md)]
               │
               ▼
[5. Verificar Trazabilidad e Identificadores (No duplicidad/no reciclaje)]
               │
               ▼
[6. Ejecutar Checklist Pre-Commit]
               │
               ▼
[7. Commit y Push bajo Convención Oficial]
```

---

## 10. Checklist Pre-Commit de Documentación

Antes de confirmar cualquier commit que involucre archivos documentales, el autor debe verificar los siguientes puntos:

- [ ] **Identificadores Válidos:** Todos los elementos (`RF`, `RNF`, `RN`, `PU`, `CU`, `DG`, `DG-SEQ`) siguen el formato `XX-00` correlativo.
- [ ] **No Reciclaje de IDs:** No se han reutilizado códigos de requerimientos o reglas dadas de baja.
- [ ] **Nomenclatura Homologada:** Los actores utilizados coinciden de manera literal con los 7 roles canónicos.
- [ ] **Terminología SCM Rigurosa:** Se emplean adecuadamente los términos `ECS`, `RFC`, `ECN/ECO`, `Check-In`, `Check-Out`, `Línea Base`, `Bibliotecas`, `Rollback`.
- [ ] **Principio SSOT Respetado:** Las tablas se modificaron en `TABLES.md` y los diagramas en `DIAGRAMS.md` antes de replicarse en el SRS.
- [ ] **Sincronización del SRS:** El archivo `FD03-EPIS-Informe_SRS.md` refleja con exactitud las fuentes oficiales.
- [ ] **Renderizado PlantUML:** Los diagramas en `DIAGRAMS.md` compilan sin errores sintácticos y las imágenes en `assets/` están actualizadas.
- [ ] **Enlaces Locales Íntegros:** Todas las referencias relativas a imágenes o archivos son accesibles y no contienen rutas rotas.

---

## 11. Convención de Commits Documentales

Los mensajes de commit que involucren cambios en la documentación deben regirse por el estándar de *Conventional Commits*:

- `docs: <descripción general>`: Cambios globales que afectan la documentación general.
- `docs(rules): <descripción>`: Modificaciones exclusivas a las reglas de gobernanza documental (`docs/DOCUMENTATION_RULES.md`).
- `docs(tables): <descripción>`: Actualización de datos tabulares, requerimientos o matrices en `docs/TABLES.md`.
- `docs(diagrams): <descripción>`: Creación o ajuste de diagramas PlantUML en `docs/DIAGRAMS.md` o imágenes asociadas.
- `docs(srs): <descripción>`: Sincronización o consolidación del informe maestro `FD03-EPIS-Informe_SRS.md`.
- `docs(traceability): <descripción>`: Actualización puntual de relaciones de trazabilidad `RF -> RN -> CU`.

### Ejemplos Válidos:
- `docs(rules): formalizar convenciones de identificadores y roles SCM`
- `docs(tables): actualizar matriz de trazabilidad RF-01 a RF-18`
- `docs(diagrams): agregar diagrama de actividades DG-01 para flujo de RFC`
- `docs(srs): sincronizar tablas de requerimientos funcionales con TABLES.md`

### Ejemplos Inválidos:
- `update docs` *(sin prefijo convencional ni alcance)*
- `arreglos en tablas` *(informal, sin identificador de tipo)*
- `docs: cambio de todo` *(demasiado genérico, no especifica componentes)*

---

# Reglas y Recomendaciones del Docente

Estas reglas complementan la gobernanza documental de TraceFlow SCM y deben
aplicarse en las fases de análisis y diseño para mantener coherencia entre
requerimientos, casos de uso, diagramas y futura implementación.

## 1. Granularidad de la documentación

Toda especificación debe redactarse con un nivel suficiente de detalle para
que exista correspondencia clara entre:

- lo documentado;
- lo modelado;
- lo que posteriormente será desarrollado.

Se debe evitar:

- descripciones demasiado generales;
- saltos lógicos entre requerimientos y casos de uso;
- funciones presentes en diagramas pero ausentes en narrativas;
- elementos implementados que no estén previamente especificados.

La documentación debe ser progresivamente más detallada, manteniendo siempre
coherencia entre sus artefactos.

## 2. Nivel de explicación

Durante la fase de análisis, la documentación debe utilizar lenguaje natural,
comprensible y orientado al cliente.

Las narrativas deben explicar el comportamiento del sistema de forma granular,
sin introducir detalles innecesarios de implementación.

Se debe priorizar:

- qué realiza el usuario;
- qué responde el sistema;
- qué información se valida;
- qué decisión se toma;
- qué resultado se obtiene.

No se deben introducir en análisis detalles como:

- controladores;
- servicios;
- repositorios;
- endpoints;
- consultas SQL;
- clases técnicas;
- métodos;
- frameworks;
- componentes internos de software.

Estos elementos pertenecen principalmente a la fase de diseño.

## 3. Casos de uso derivados mediante include y extend

Las relaciones `<<include>>` y `<<extend>>` no deben contabilizarse como
requerimientos funcionales independientes.

Cuando una relación represente comportamiento complementario que requiera
narrativa propia, debe identificarse como extensión del caso de uso principal.

Convención:

- CU-04       Caso de uso principal
- CU-04.1     Comportamiento incluido o extendido
- CU-04.2     Segundo comportamiento incluido o extendido
- CU-04.3     Tercer comportamiento incluido o extendido

La numeración debe mantenerse coherente en:

- narrativa;
- diagrama general de casos de uso;
- diagramas de secuencia;
- diagramas de análisis de objetos;
- matrices de trazabilidad.

No crear un nuevo RF únicamente porque exista un `include` o `extend`.

## 4. Correspondencia Narrativa ↔ Diagrama de Secuencia

Cada paso numerado del flujo narrativo debe poseer correspondencia directa con
la numeración mostrada en el Diagrama de Secuencia.

Ejemplo:

Narrativa:

1. El usuario selecciona registrar solicitud.
2. El sistema muestra el formulario.
3. El usuario registra la información.
4. El sistema valida los datos.
5. El sistema registra la solicitud.

Secuencia:

1. Seleccionar registrar solicitud
2. Mostrar formulario
3. Registrar información
4. Validar información
5. Confirmar registro

REGLA:

La secuencia no debe introducir pasos funcionales inexistentes en la narrativa.

Si es necesario agregar un paso a la secuencia, primero debe actualizarse la
narrativa.

## 5. Actores en Diagramas de Secuencia de Análisis

En la fase de análisis, los Diagramas de Secuencia deben mantenerse a nivel
conceptual.

Se recomienda representar principalmente:

Usuario → Sistema / Aplicación

y evitar introducir múltiples componentes internos o actores técnicos cuando
no sean necesarios para explicar el comportamiento al cliente.

Ejemplo válido en análisis:

Solicitante → TraceFlow SCM

No utilizar como estructura principal de análisis:

Usuario → Frontend → Controller → Service → Repository → Database

Esa granularidad corresponde a la fase de diseño.

Cuando exista participación real de otro actor humano en el mismo caso de uso,
debe evaluarse si:

- corresponde al mismo caso de uso;
- pertenece a otro caso de uso;
- o debe representarse como una interacción separada.

## 6. Diagramas obligatorios por Caso de Uso

Para cada Caso de Uso definido en el SRS de análisis se debe disponer, cuando
corresponda, de:

1. Narrativa del Caso de Uso.
2. Diagrama de Secuencia.
3. Diagrama de Análisis de Objetos.

Estos artefactos deben ser consistentes entre sí.

La narrativa es la referencia funcional principal.

Los diagramas deben derivarse de ella y no introducir comportamiento no
documentado.

## 7. Diagramas de Análisis de Objetos

Los Diagramas de Análisis de Objetos deben rehacerse a nivel de análisis.

Se recomienda utilizar el patrón conceptual:

- Boundary
- Control
- Entity

Ejemplo:

Actor
↓
Boundary
↓
Control
↓
Entity

Las entidades deben representar conceptos del dominio y no componentes
técnicos de implementación.

Evitar durante análisis:

- controladores HTTP;
- servicios REST;
- repositorios de persistencia;
- DTO;
- ORM;
- tablas de base de datos;
- clases específicas de framework.

## 8. Diagrama de Clases en fase de análisis

El Diagrama de Clases utilizado durante la fase de análisis debe representar
el modelo conceptual del dominio.

Debe mostrar principalmente:

- conceptos importantes;
- relaciones;
- asociaciones;
- multiplicidades relevantes.

No debe convertirse todavía en un modelo de implementación.

Evitar en esta fase:

- métodos técnicos;
- tipos de datos específicos;
- anotaciones de framework;
- claves foráneas;
- interfaces técnicas;
- servicios;
- controladores;
- repositorios;
- clases de infraestructura.

Ejemplos de conceptos apropiados:

- Proyecto
- RFC
- ECS
- Orden de Cambio
- Línea Base
- Certificación
- Usuario
- Incidencia

La versión detallada y técnica del Diagrama de Clases corresponde a la fase
de diseño.

## 9. Diagramas de Secuencia por Caso de Uso

Los Diagramas de Secuencia de análisis deben rehacerse con lenguaje
comprensible para el cliente.

Deben representar:

- interacción del actor;
- respuesta del sistema;
- validaciones;
- decisiones;
- resultado.

No deben mostrar detalles técnicos internos.

Ejemplo de análisis:

Solicitante -> TraceFlow SCM:
1. Solicitar registro de RFC

TraceFlow SCM -> Solicitante:
2. Mostrar formulario

Solicitante -> TraceFlow SCM:
3. Enviar información

TraceFlow SCM -> TraceFlow SCM:
4. Validar información

TraceFlow SCM -> Solicitante:
5. Confirmar registro

En la fase de diseño, esta misma interacción podrá descomponerse en:

Frontend → Controller → Service → Repository → Database

## 10. Revisión del Diagrama de Actividades

El Diagrama de Actividades del proceso debe revisarse cada vez que se
modifiquen:

- reglas de negocio;
- requerimientos;
- actores;
- decisiones;
- estados;
- flujos alternativos.

El Diagrama de Actividades debe representar el proceso real vigente y actuar
como referencia transversal para los casos de uso.

En TraceFlow SCM se debe verificar especialmente:

- cambio menor;
- cambio mayor;
- triple restricción;
- intervención del CCB;
- QA;
- aceptación del usuario;
- Check-In;
- Línea Base;
- cierre.

## 11. Relaciones entre Casos de Uso y Diagrama de Paquetes

El Diagrama de Paquetes no debe representar únicamente agrupaciones visuales.

Debe reflejar las dependencias funcionales entre los módulos.

Las relaciones entre casos de uso deben permitir identificar también
dependencias entre paquetes.

Ejemplo:

Gestión de Incidencias
→ puede generar
Gestión de RFC

Control de Cambios
→ utiliza
Gestión de Bibliotecas

Gestión de QA
→ condiciona
Check-In / Línea Base

Las relaciones deben derivarse del comportamiento definido en los casos de
uso y no agregarse solamente por criterio visual.

## 12. Separación entre fase de análisis y fase de diseño

TraceFlow SCM debe mantener una separación explícita entre los artefactos de:

### Fase de Análisis

Orientada principalmente al cliente y al entendimiento funcional.

#### SRS de Análisis

Debe contener:

- necesidades;
- requerimientos;
- reglas de negocio;
- actores;
- casos de uso;
- narrativas;
- actividades;
- secuencias conceptuales;
- análisis de objetos;
- modelo conceptual del dominio.

Debe utilizar lenguaje natural y abstraer detalles técnicos.

#### SAD de Análisis

Puede ser ligeramente más técnico que el SRS, pero debe mantenerse a nivel
conceptual.

Puede representar:

- módulos;
- responsabilidades;
- relaciones;
- organización lógica;
- estructura conceptual.

No debe definir todavía detalles completos de implementación.

---

### Fase de Diseño

Orientada a la solución técnica que será implementada.

#### SRS de Diseño

Puede ampliar o concretar los requisitos con restricciones técnicas,
interfaces y decisiones necesarias para implementación.

#### SAD de Diseño

Debe contener el nivel técnico detallado, incluyendo cuando corresponda:

- arquitectura definitiva;
- tecnologías;
- componentes;
- servicios;
- APIs;
- clases de diseño;
- persistencia;
- interfaces;
- despliegue;
- seguridad técnica;
- integración;
- secuencias técnicas.

## 13. Regla general de trazabilidad

Toda decisión funcional debe poder seguirse mediante la cadena:

Necesidad
→ Requerimiento
→ Regla de Negocio
→ Caso de Uso
→ Narrativa
→ Secuencia
→ Análisis de Objetos
→ Módulo / Paquete
→ Mockup
→ Implementación futura

Si un elemento aparece en una etapa pero no puede trazarse hacia su origen,
debe considerarse una inconsistencia documental.

## 14. Prioridad de coherencia documental

Ante cualquier modificación funcional, actualizar en este orden:

1. Proceso / Diagrama de Actividades.
2. Requerimientos y Reglas de Negocio.
3. Casos de Uso.
4. Narrativas.
5. Matrices de trazabilidad.
6. Diagrama General de Casos de Uso.
7. Diagrama de Paquetes.
8. Diagramas de Secuencia.
9. Diagramas de Análisis de Objetos.
10. Modelo conceptual / Diagrama de Clases.
11. Mockups.
12. Documentos consolidados SRS / SAD.

No actualizar directamente un diagrama derivado sin verificar primero la
fuente funcional que lo origina.
