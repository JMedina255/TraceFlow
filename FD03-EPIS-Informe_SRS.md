<!-- Conversión a Markdown del documento PDF original. -->

# Sistema de Gestión de Configuración de Software - TraceFlow SCM


> Documento de Especificación de Requerimientos de Software (SRS) - Versión 1.0


<!-- Página 1 del PDF original -->


UNIVERSIDAD PRIVADA DE TACNA FACULTAD DE INGENIERÍA ESCUELA DE INGENIERÍA DE SISTEMAS “Sistema de Gestión de Configuración de Software - TraceFlow SCM”

**Curso:**

Gestión de la Configuración de Software

**Docente:**

Dr. RICARDO EDUARDO VALCARCEL ALVARADO

**AUTOR:**

ANTAYHUA MAMANI, Renzo Antonio (2022073504) MEDINA QUISPE, Joan Cristian (2022074255) LOYOLA VILCA CHOQUE, Renzo Fernando (2021072615) RIVERA MUÑOZ, Augusto Joaquin (2022073505) TACNA – PERÚ 2026


<!-- Página 2 del PDF original -->


| CONTROL DE VERSIONES |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | JCM/RAA/ RFL/AJR | RVA | RVA | 16/09/2026 | Versión 1.0 |

Sistema de Gestión de Configuración de Software - TraceFlow SCM Documento de Especificación de Requerimientos de Software Versión 1.0


<!-- Página 3 del PDF original -->


| CONTROL DE VERSIONES |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | JCM/RAA/ RFL/AJR | RVA | RVA | 16/09/2026 | Versión 1.0 |

## Índice general

# 1. Introducción 5

# 2. Generalidades de la Empresa 6

## 2.1. Nombre de la Empresa 6

## 2.2. Visión 6

## 2.3. Misión 6

## 2.4. Organigrama 7

# 3. Visionamiento de la Empresa 8

## 3.1. Descripción del Problema 8

## 3.2. Objetivos de Negocios 9

### 3.2.1. Objetivo General de Negocio 9

### 3.2.2. Objetivos Específicos de Negocio 9

## 3.3. Objetivos de Diseño 10

### 3.3.1. Objetivo General de Negocio 10

### 3.3.2. Objetivos Específicos de Negocio 10

## 3.4. Alcance del proyecto 10

### 3.4.1. Alcance Funcional 11

### 3.4.2. Alcance No Funcional 11

### 3.4.3. Alcance Tecnológico 11

### 3.4.4. Delimitación del Proyecto 12

## 3.5. Viabilidad del Sistema 12

## 3.6. Información obtenida del Levantamiento de Información 16

# 4. Análisis de Procesos 17

## 4.1. Diagrama del Proceso Actual - Diagrama de actividades 17

## 4.2. Diagrama del Proceso Propuesto - Diagrama de actividades Inicial 18

# 5. Especificación de Requerimientos de Software 22

## 5.1. Cuadro de Requerimientos Funcionales 22

## 5.2. Cuadro de Requerimientos No funcionales 24

## 5.3. Reglas de Negocio 25

# 6. Fase de Desarrollo 28

## 6.1. Perfiles de Usuario 29

### 6.1.1. Diagrama de Paquetes 31

### 6.1.2. Diagrama de Casos de Uso 33

### 6.1.3. Escenarios de Caso de Uso (narrativa) 35

## 6.2. Modelo Lógico 94

### 6.2.1. Diagrama de Secuencia 95


<!-- Página 4 del PDF original -->


### 6.2.2. Diagrama de Clases 114

Conclusiones 115 Bibliografía 117


<!-- Página 5 del PDF original -->


# Informe de Especificación de Requisitos de Software

# 1. Introducción

El presente documento contiene la especificación de requerimientos de software (SRS) para el desarrollo del Sistema de Gestión de Configuración de Software - TraceFlow SCM, concebido para optimizar y formalizar los procesos operativos de la empresa consultora ÉXODO S.A.C. en el marco del semestre académico 2026-II en la EPIS-UPT. En el contexto productivo de ÉXODO S.A.C., la prestación de servicios de desarrollo y mantenimiento de software a medida se realiza actualmente sin un sistema formal ni centralizado de Gestión de la Configuración del Software (SCM). El código fuente, los esquemas de bases de datos y la documentación técnica de los proyectos se encuentran dispersos entre los equipos locales de los consultores y cuentas personales en diversas plataformas, careciendo de un estándar estricto de versionamiento e identificación de artefactos. Esta desarticulación operativa ocasiona la coexistencia de múltiples copias divergentes, pérdidas críticas de avances por sobreescritura durante el trabajo concurrente y la ausencia de líneas base (baselines) estables a las cuales retornar ante incidentes imprevistos en los entornos de producción de los clientes. Para resolver esta brecha y mitigar los riesgos de retrabajo y pérdida de información, el equipo de desarrollo C-Shark Team formula la presente especificación de requisitos con la finalidad de diseñar e implementar una solución integral . TraceFlow SCM provee una plataforma web centralizada que automatiza y estandariza el flujo integral de Solicitudes de Cambio (RFC) bajo la supervisión del Comité de Control de Cambios (CCB), gestiona la transferencia controlada de Elementos de Configuración (ECS) entre las bibliotecas de Trabajo, Soporte y Maestra mediante Check-Out/Check-In, impone bloqueos de sincronización para evitar conflictos de concurrencia y garantiza la trazabilidad e integridad criptográfica (SHA-256) de todos los activos de software liberados.


<!-- Página 6 del PDF original -->


# 2. Generalidades de la Empresa

## 2.1. Nombre de la Empresa

La empresa objeto del presente proyecto es ÉXODO S.A.C., una consultora peruana dedicada al desarrollo de software a medida, mantenimiento de sistemas y prestación de servicios de tecnologías de la información para clientes de distintos sectores productivos.

## 2.2. Visión

ÉXODO S.A.C. tiene como visión consolidarse como una empresa referente en desarrollo de software en la región sur del Perú, reconocida por la calidad, la trazabilidad y la confiabilidad de las soluciones tecnológicas que entrega a sus clientes.

## 2.3. Misión

Brindar soluciones de software a medida que resuelvan problemas reales de negocio, aplicando buenas prácticas de ingeniería de software, control de calidad y gestión de configuración, garantizando la satisfacción y confianza de nuestros clientes.


<!-- Página 7 del PDF original -->


## 2.4. Organigrama

ÉXODO S.A.C. presenta una estructura organizacional funcional orientada a la ejecución de proyectos de software. En el contexto del sistema TraceFlow SCM, los actores relevantes se ubican en los niveles estratégico (Gerencia de Proyectos), táctico (Jefaturas de Proyecto) y operativo (equipos de desarrollo, control de calidad y soporte).

**Organigrama del C-SharkTeam**

Nota: Elaboración Propia

**Estructura del Equipo de Desarrollo**

Para el análisis, especificación y construcción del sistema TraceFlow SCM, el equipo de desarrollo se estructura de manera especializada asignando

**responsabilidades técnicas a sus cuatro integrantes:**

Dirección de Proyecto y Gobernanza SCM: Liderada por Joan Cristian Medina Quispe, responsable de la coordinación general del ciclo de vida del software, modelado de procesos de control de cambios (RFC/ECN), definición de políticas de bibliotecas (Trabajo, Soporte y Maestra) y arquitectura de seguridad basada en roles (RBAC). Ingeniería de Backend y Servicios de Integración: A cargo de Renzo Antonio Antayhua Mamani, responsable del desarrollo de la lógica de negocio centralizada, microservicios para el motor de versionamiento, algoritmos de validación de integridad criptográfica (SHA-256) y mecanismos de bloqueo de concurrencia para evitar sobreescrituras en la Biblioteca de Trabajo.


![Página 7 - diagrama o elemento visual del documento original](assets/page-007.png)


<!-- Página 8 del PDF original -->


Ingeniería de Frontend y Experiencia de Usuario (UI/UX): Liderada por Renzo Fernando Loyola Vilca Choque, responsable de la construcción de la interfaz web responsiva, tableros de control para la trazabilidad de cambios, consolas de gestión para el Comité de Control de Cambios (CCB) y formularios dinámicos para el registro y subsanación de solicitudes. Aseguramiento de la Calidad (QA), Auditoría y Persistencia: A cargo de Augusto Joaquin Rivera Muñoz, responsable del diseño y modelado de persistencia de datos relacionales, administración de esquemas de trazabilidad histórica, implementación del módulo de registro de auditoría de acciones del sistema y definición de la suite de pruebas unitarias y de integración. Entorno Cliente / Beneficiario (ÉXODO S.A.C.):Jefes de Proyecto y Administradores SCM: Supervisión de proyectos aislados y custodia de las Bibliotecas Maestras.Comité de Control de Cambios (CCB): Evaluación colegiada y emisión de Órdenes de Cambio.Consultores y Desarrolladores de Software: Usuarios operativos que ejecutan Check-Out/Check-In e implementan las modificaciones asignadas.


<!-- Página 9 del PDF original -->


# 3. Visionamiento de la Empresa

## 3.1. Descripción del Problema

Actualmente, ÉXODO S.A.C. gestiona el desarrollo de software para sus clientes sin un sistema formal de Gestión de la Configuración. El código fuente, la documentación y los artefactos de cada proyecto se encuentran dispersos entre los equipos de cómputo de los consultores y cuentas personales en distintas plataformas, sin un repositorio centralizado ni un estándar de identificación de versiones. Esta situación provoca la coexistencia de múltiples copias de un mismo componente sin un registro histórico confiable, generando conflictos al integrar el trabajo de distintos desarrolladores, pérdida de avances por sobreescritura de archivos y retrasos en la entrega de los proyectos comprometidos con los clientes. Asimismo, la ausencia de un flujo formal de control de cambios y de líneas base claramente definidas impide identificar con certeza qué versión de un producto se encuentra en producción, quién autorizó una modificación específica o cómo revertir un cambio que introdujo un defecto crítico, comprometiendo la calidad del servicio y la relación de confianza con los clientes de ÉXODO S.A.C.


<!-- Página 10 del PDF original -->


## 3.2. Objetivos de Negocios

### 3.2.1. Objetivo General de Negocio

Optimizar la calidad y la continuidad de los servicios de desarrollo de software que ÉXODO S.A.C. entrega a sus clientes, mediante la implementación de un sistema de gestión de configuración que reduzca los riesgos de pérdida de información y los costos asociados a la corrección de errores por versiones conflictivas.

### 3.2.2. Objetivos Específicos de Negocio

- Reducción de Retrabajo: Disminuir en un 25% el tiempo invertido por

los equipos de desarrollo en la resolución de conflictos de código y en la recuperación de archivos perdidos.

- Garantía de Integridad: Asegurar que el 100% de las versiones

entregadas a los clientes correspondan a versiones validadas y aprobadas mediante el flujo formal de control de cambios.

- Mejora de la Transparencia: Establecer una trazabilidad total que permita

identificar el origen, autor y justificación de cualquier cambio realizado en un proyecto en menos de 24 horas.

- Estandarización de Procesos: Unificar los flujos de trabajo de los

distintos equipos de proyecto de ÉXODO S.A.C. bajo una única política de control de cambios.

- Satisfacción del Cliente: Reducir en un 30% las incidencias relacionadas

con entregas de versiones incorrectas o no autorizadas al cliente.

## 3.3. Objetivos de Diseño

### 3.3.1. Objetivo General de Negocio

Definir la arquitectura lógica y funcional de TraceFlow SCM, un sistema robusto de gestión de configuración que centralice, proteja y organice los artefactos de software de los proyectos de ÉXODO S.A.C., asegurando una estructura escalable que facilite el control de cambios sin afectar la productividad de los equipos de desarrollo.


<!-- Página 11 del PDF original -->


### 3.3.2. Objetivos Específicos de Negocio

- Diseño de Repositorio Centralizado: Definir una estructura de

almacenamiento jerárquica que permita organizar el código fuente, la documentación técnica y los recursos de cada proyecto de cliente.

- Establecimiento de Líneas Base (Baselines): Diseñar mecanismos de

control para identificar y congelar versiones estables del software, garantizando puntos de recuperación confiables.

- Modelado del Flujo de Cambios: Estructurar un proceso formal de

solicitud, evaluación y aprobación de cambios que garantice que ninguna modificación sea integrada sin previa validación técnica.

- Definición de Roles y Permisos: Diseñar un esquema de seguridad

basado en roles que restrinja el acceso a los repositorios críticos y asegure que solo el personal autorizado libere versiones oficiales.

- Trazabilidad y Auditoría: Diseñar mecanismos de registro e integridad

que permitan reconstruir el historial completo de un elemento de configuración.

## 3.4. Alcance del proyecto

El presente proyecto abarca el análisis y definición funcional de TraceFlow SCM, un Sistema de Gestión de Configuración de Software diseñado específicamente para las necesidades de ÉXODO S.A.C. El alcance se centra en establecer las reglas, procesos y controles necesarios para administrar el ciclo de vida de los artefactos digitales de los proyectos de la empresa y de sus clientes.

### 3.4.1. Alcance Funcional

- Identificación de Elementos de Configuración (ECS): registro y

catalogación de los componentes de software (código fuente, documentación, esquemas de base de datos) de cada proyecto.

- Gestión de Versiones: mantenimiento de un historial completo de

cambios mediante operaciones de Check-in y Check-out, con posibilidad de retorno a estados anteriores.


<!-- Página 12 del PDF original -->


- Control de Cambios: flujo formal para solicitar, evaluar y aprobar

modificaciones antes de su integración al proyecto.

- Gestión de Líneas Base: funcionalidad para crear y congelar versiones

estables destinadas a la entrega o despliegue oficial al cliente.

- Gestión de Incidencias y Soporte: registro y seguimiento de incidencias

reportadas por los equipos internos o por los clientes.

- Generación de Reportes y Auditoría: emisión de informes sobre el estado

de la configuración y trazabilidad de las acciones realizadas.

### 3.4.2. Alcance No Funcional

- Seguridad y Acceso: restricción de permisos basada en roles

(Administrador SCM, Jefe de Proyecto, Desarrollador, QA, Auditor).

- Disponibilidad: el sistema debe operar con un tiempo de actividad

objetivo del 99.9% durante los periodos críticos de desarrollo y entrega.

- Integridad de Datos: garantía de que los artefactos almacenados no

sufran corrupciones durante transferencias, fusiones o respaldos.

- Escalabilidad: capacidad de soportar el crecimiento de la cartera de

proyectos de ÉXODO S.A.C. (más de 50 proyectos simultáneos).

- Usabilidad: curva de aprendizaje mínima para los nuevos consultores o

practicantes que se incorporen a los equipos de proyecto.

### 3.4.3. Alcance Tecnológico

- Arquitectura de Repositorios: análisis basado en sistemas de control de

versiones distribuidos (Git).

- Entornos de Desarrollo: compatibilidad con las herramientas utilizadas

por los equipos de ÉXODO S.A.C. (Visual Studio Code, IntelliJ IDEA, Android Studio).

- Integración: compatibilidad con herramientas de automatización de

compilación, pruebas y despliegue (CI/CD).

- Almacenamiento: evaluación de necesidades de almacenamiento en

servidores propios o servicios en la nube (GitHub, GitLab, Azure DevOps).


<!-- Página 13 del PDF original -->


### 3.4.4. Delimitación del Proyecto

- Delimitación Espacial: el proyecto se circunscribe a las áreas de

desarrollo y gestión de proyectos de ÉXODO S.A.C.

- Delimitación Temporal: el análisis abarca el ciclo académico

correspondiente al semestre 2026-II.

- Delimitación Social: el sistema está dirigido al personal de desarrollo,

jefes de proyecto, personal de control de calidad y auditores de ÉXODO S.A.C.

- Frontera Técnica: se excluye explícitamente el soporte de hardware, la

administración de redes externas y la gestión comercial o contable de la empresa.

## 3.5. Viabilidad del Sistema

La evaluación de viabilidad analiza la factibilidad técnica, económica,

**operativa, legal, social y ambiental del software antes de iniciar su construcción:**

1. Viabilidad Técnica

Infraestructura: ÉXODO S.A.C. cuenta con servidores propios y acceso a servicios en la nube, lo que facilita la implementación de un repositorio centralizado. Capacidad Técnica: los equipos de desarrollo manejan herramientas estándar de control de versiones (Git), por lo que la curva de aprendizaje para adoptar TraceFlow SCM es baja. Compatibilidad: es técnicamente viable integrar las políticas de control de cambios con los entornos de desarrollo actuales sin interrumpir los proyectos en curso.

2. Viabilidad Económica

El análisis financiero se calculó para un horizonte de evaluación a 5 años (2026-2030) con una tasa de descuento (COK) del 12.00%, considerando los costos reales de desarrollo asumidos por el equipo C-SharkTeam durante el

**semestre 2026-II:**


<!-- Página 14 del PDF original -->


| Indicador Financiero | Valor Proyectado | Interpretación Técnica / Financiera |
| --- | --- | --- |
| Inversión Inicial (CAPEX) | S/. 5,475.00 | Cubre 500 horas de desarrollo (Joan Medina y Renzo Antayhua a razón de S/. 9.00/hr), depreciación de equipos (3.5 meses), conectividad, dominio web e imprevistos. |
| Costo Operativo Anual (OPEX) | S/. 1,140.00 | Mantenimiento de infraestructura PaaS (Render/Supabase), renovación de dominio, soporte preventivo y materiales de difusión. |
| Valor Actual Neto (VAN) | +S/. 10,801.64 | Estrictamente positivo (VAN > 0), ratificando que el proyecto generará valor económico y retención institucional por encima de la tasa exigida. |
| Tasa Interna de Retorno (TIR) | 68.20% | Supera ampliamente el COK referencial (12.00%), otorgando un margen de seguridad amplio frente a variaciones de costos. |
| Relación Beneficio / Costo (B/C) | 1.97 | Por cada sol invertido en el ciclo del proyecto, se generarán S/. 1.97 en beneficios y ahorros valorizados para la facultad y los estudiantes. |
| Periodo de Recuperación (Payback) | 1 año y 9.7 meses | La inversión inicial se recuperará plenamente durante el transcurso del segundo año de operación |

3. Viabilidad Operativa

Apoyo Institucional: existe respaldo de la Gerencia de Proyectos de ÉXODO S.A.C. para formalizar el control de sus activos digitales.


<!-- Página 15 del PDF original -->


Facilidad de Integración: el flujo propuesto se adapta a las rutinas actuales de los consultores, quienes percibirán el sistema como una herramienta de protección de su trabajo. Sostenibilidad: la definición de roles claros (Jefe de Proyecto, Desarrollador, QA, Auditor) permite que el sistema se mantenga vigente ante la rotación de personal.

4. Viabilidad Legal

1. Propiedad Intelectual y Derechos de Autor: de acuerdo con el Decreto

Legislativo N.° 822 (Ley sobre el Derecho de Autor), el software desarrollado por los consultores de ÉXODO S.A.C. en el ejercicio de sus funciones pertenece a la empresa o al cliente contratante según lo pactado contractualmente. TraceFlow SCM garantiza que dicha propiedad intelectual quede debidamente registrada, versionada y resguardada.

2. Protección de Datos Personales: el análisis del sistema considera el

cumplimiento de la Ley N.° 29733 (Ley de Protección de Datos Personales), dado que los proyectos gestionados por ÉXODO S.A.C. pueden incluir información sensible de los clientes finales, por lo que el acceso al código y a la documentación debe restringirse únicamente al personal autorizado.

3. Contratos con Clientes: el sistema apoya el cumplimiento de los acuerdos de

nivel de servicio (SLA) pactados con los clientes, al permitir demostrar mediante trazabilidad y auditoría qué versión fue entregada, cuándo y bajo qué aprobación.

4. Uso de Software y Licenciamiento: el análisis prioriza el uso de

herramientas bajo licencias de código abierto (GPL, MIT) para el control de versiones, evitando el uso de software no licenciado y mitigando riesgos de sanciones por infracción de derechos de autor.


<!-- Página 16 del PDF original -->


5. Viabilidad Social

1. Optimización de Recursos de Hardware: la centralización del desarrollo en

repositorios institucionales evita la necesidad de adquirir nuevo hardware, extendiendo la vida útil de los equipos actuales.

2. Reducción de la Huella de Carbono Digital: un flujo de trabajo ordenado

reduce compilaciones fallidas y procesos redundantes, disminuyendo el consumo energético de los servidores.

3. Digitalización y Cero Papel: la automatización de solicitudes de cambio,

actas y reportes elimina la necesidad de documentación impresa.

4. Promoción del Trabajo Remoto: un sistema de configuración robusto

facilita el trabajo colaborativo a distancia entre los equipos de ÉXODO S.A.C. y sus clientes, reduciendo desplazamientos innecesarios.

5. Viabilidad Ambiental

1. Optimización de Recursos de Hardware: la centralización del desarrollo en

repositorios institucionales evita la necesidad de adquirir nuevo hardware, extendiendo la vida útil de los equipos actuales.

2. Reducción de la Huella de Carbono Digital: un flujo de trabajo ordenado

reduce compilaciones fallidas y procesos redundantes, disminuyendo el consumo energético de los servidores.

3. Digitalización y Cero Papel: la automatización de solicitudes de cambio, actas

y reportes elimina la necesidad de documentación impresa.

4. Promoción del Trabajo Remoto: un sistema de configuración robusto facilita

el trabajo colaborativo a distancia entre los equipos de ÉXODO S.A.C. y sus clientes, reduciendo desplazamientos innecesarios.


<!-- Página 17 del PDF original -->


## 3.6. Información obtenida del Levantamiento de Información

# 1. Diagnóstico de la Situación Actual:

- Almacenamiento: el código de los proyectos está disperso en equipos

locales y cuentas personales, sin un repositorio institucional centralizado.

- Control de Versiones: es inexistente o empírico; se emplean nombres de

carpetas (por ejemplo, “Proyecto_Cliente_Final_v2”) en lugar de un estándar de versionamiento.

- Flujo de Cambios: las modificaciones se coordinan de forma verbal o por

chat, sin registro de quién, cuándo o por qué se alteró un componente.

- Sincronización: existe un alto índice de pérdida de avances por

sobreescritura de archivos al trabajar varios consultores en un mismo proyecto.

# 2. Necesidades Identificadas (Requerimiento)

**Cuadro de Necesidades Identificadas**

| Área | Problema detectado | Requerimiento del Sistema |
| --- | --- | --- |
| Código | Pérdida de fuentes | Repositorio centralizado y seguro. |
| Cambios | Modificaciones arbitrarias | Flujo de aprobación (Solicitudes de Cambio). |
| Versiones | Confusión sobre la versión vigente | Etiquetado de Líneas Base (Baselines). |
| Auditoría | No se identifica al responsable de una falla | Registro de auditoría y trazabilidad total. |
| Entregas | Entregas al cliente sin validación previa | Aprobación formal antes de la liberación. |

Nota: Elaboración Propia


<!-- Página 18 del PDF original -->


# 4. Análisis de Procesos

## 4.1. Diagrama del Proceso Actual - Diagrama de actividades

El proceso actual es empírico y desorganizado, pues el código reside en equipos personales sin estándares de versionamiento. La integración se realiza por medios informales (correo, chat, USB), lo que provoca pérdida de avances por sobreescritura. Al no existir líneas base, ante una falla en producción no es posible identificar ni recuperar de forma inmediata una versión estable anterior, afectando la calidad del servicio entregado a los clientes de ÉXODO S.A.C.

**Diagrama de Actividades del Proceso Actual**

Nota: Elaboración Propia


![Página 18 - diagrama o elemento visual del documento original](assets/page-018.png)


<!-- Página 19 del PDF original -->


## 4.2. Diagrama del Proceso Propuesto - Diagrama de actividades Inicial

El proceso propuesto formaliza el ciclo de vida completo de una Solicitud de Cambio (RFC) mediante siete roles especializados. El Solicitante identifica la necesidad de cambio y completa el formulario de RFC. El Analista de Requerimientos / Gestor recepciona la solicitud, valida que la información esté completa (solicitando subsanación en caso contrario) y clasifica su tipo y criticidad. El Arquitecto / Especialista Técnico realiza el análisis de impacto y genera el Informe Técnico correspondiente. El Comité de Control de Cambios (CCB) evalúa la viabilidad técnica y decide la aprobación; si el cambio es rechazado por inviabilidad o por decisión del comité, se notifica formalmente al solicitante y el trámite se cierra. Una vez aprobado, se emite la Orden de Cambio (ECN/ECO) y el Administrador de Configuración / Bibliotecario efectúa el Check-Out del Elemento de Configuración (ECS) desde la Biblioteca de Soporte hacia la Biblioteca de Trabajo, aplicando un bloqueo de sincronización que evita sobreescrituras. El Ingeniero de Software / Desarrollador implementa el cambio y ejecuta pruebas unitarias locales, tras lo cual el Equipo de Calidad / Testing ejecuta pruebas de integración y validación funcional. Si la validación no es conforme, se habilita un ciclo de corrección y re-testeo; si el re-test también falla, se ejecuta un Rollback en la Biblioteca de Trabajo, se restaura el estado previo del ECS y se cancela la Orden de Cambio por fallo no subsanado. Si la validación es conforme, el Administrador de Configuración realiza el Check-In del ECS verificado hacia la Biblioteca Maestra / Soporte, establece una nueva Línea Base, libera el bloqueo de sincronización y registra el cierre formal del cambio, notificando al solicitante la implementación exitosa


<!-- Página 20 del PDF original -->


**Diagrama de Actividades del Proceso Propuesto**


![Página 20 - diagrama o elemento visual del documento original](assets/page-020.png)


<!-- Página 21 del PDF original -->


![Página 21 - diagrama o elemento visual del documento original](assets/page-021.png)


<!-- Página 22 del PDF original -->


# 5. Especificación de Requerimientos de Software

## 5.1. Cuadro de Requerimientos Funcionales

A continuación se detalla el cuadro de Requerimientos Funcionales (RF-01 a RF-18) de TraceFlow SCM, elaborado a partir del levantamiento de información y de los escenarios de caso de uso descritos previamente. Cada requerimiento especifica el módulo funcional al que pertenece, una descripción de la capacidad que el sistema debe ofrecer y su nivel de prioridad, sirviendo como base para la definición de los casos de uso y del alcance de la implementación.

**Tabla: Cuadro de Requerimientos Funcionales**

| ID | Requerimiento Funcional | Descripción | Prioridad |
| --- | --- | --- | --- |
| RF-01 | Gestión de Usuarios y Roles | El sistema debe permitir registrar usuarios y asignar los roles del flujo de cambios (Solicitante, Analista de Requerimientos/Gestor, Arquitecto/Especialista Técnico, CCB, Administrador de Configuración/Bibliotecario, Ingeniero de Software/Desarrollador, Equipo de Calidad/Testing), restringiendo las acciones disponibles según el rol. | Alta |
| RF-02 | Gestión de Proyectos | El sistema debe permitir crear y administrar múltiples proyectos de clientes de ÉXODO S.A.C. de forma aislada entre sí. | Alta |
| RF-03 | Identificación de ECS | El sistema debe permitir registrar y clasificar los Elementos de Configuración (código, documentos, esquemas de BD) de cada proyecto. | Alta |
| RF-04 | Registro de Solicitudes de Cambio (RFC) | El sistema debe permitir al Solicitante registrar una Solicitud de Cambio indicando descripción, justificación, prioridad, ECS afectado y fecha, y permitir su subsanación cuando la información esté incompleta. | Alta |
| RF-05 | Clasificación y Análisis de Impacto | El sistema debe permitir al Analista de Requerimientos clasificar el tipo y criticidad de la solicitud, y al Arquitecto/Especialista Técnico registrar el análisis de impacto (arquitectura, esfuerzo, costo, tiempo y riesgos) en un Informe Técnico de Impacto. | Alta |
| RF-06 | Evaluación y Aprobación por el CCB | El sistema debe permitir al Comité de Control de Cambios evaluar la viabilidad técnica de una solicitud, aprobarla o rechazarla, y registrar las causales de no aprobación cuando corresponda. | Alta |


<!-- Página 23 del PDF original -->


| ID | Requerimiento Funcional | Descripción | Prioridad |
| --- | --- | --- | --- |
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


<!-- Página 24 del PDF original -->


## 5.2. Cuadro de Requerimientos No funcionales

El siguiente cuadro presenta los Requerimientos No Funcionales (RNF-01 a RNF-09) que establecen los atributos de calidad exigidos a TraceFlow SCM, tales como seguridad, disponibilidad, integridad, usabilidad, escalabilidad, rendimiento, compatibilidad, mantenibilidad y respaldo. Estos requerimientos condicionan las decisiones de arquitectura y diseño técnico que se adoptarán en las siguientes fases del proyecto, y se derivan directamente de los objetivos de negocio y de diseño planteados por ÉXODO S.A.C.

**Tabla: Cuadro de Requerimientos No Funcionales**

| ID | Atributo de Calidad | Descripción | Prioridad |
| --- | --- | --- | --- |
| RNF-01 | Seguridad | El sistema debe utilizar protocolos de transferencia segura (HTTPS/SSH) y control de acceso basado en roles (RBAC). | Alta |
| RNF-02 | Disponibilidad | El sistema debe garantizar un tiempo de actividad (uptime) del 99.9% durante los periodos críticos de proyecto. | Alta |
| RNF-03 | Integridad | El sistema debe verificar la integridad de los artefactos almacenados mediante checksums (SHA-256). | Alta |
| RNF-04 | Usabilidad | La interfaz debe permitir que un nuevo consultor se familiarice con el flujo de trabajo en menos de 3 horas. | Media |
| RNF-05 | Escalabilidad | El sistema debe soportar más de 50 proyectos simultáneos sin degradar el rendimiento de las operaciones. | Media |
| RNF-06 | Rendimiento | Las operaciones de consulta de historial o comparación de versiones no deben exceder los 3 segundos de respuesta. | Baja |
| RNF-07 | Compatibilidad | El sistema debe ser compatible con entornos de desarrollo de uso común (Visual Studio Code, IntelliJ IDEA, Android Studio). | Alta |
| RNF-08 | Mantenibilidad | La arquitectura debe permitir actualizaciones y parches sin requerir la detención total del servicio. | Media |
| RNF-09 | Respaldo | El sistema debe programar copias de seguridad automáticas diarias del repositorio central. | Alta |

Nota: Elaboración Propia


<!-- Página 25 del PDF original -->


## 5.3. Reglas de Negocio

Las Reglas de Negocio (RN-01 a RN-09) formalizan las políticas y restricciones que TraceFlow SCM debe hacer cumplir de manera obligatoria dentro del flujo de gestión de configuración, tales como la aprobación previa del CCB, la identificación unívoca de versiones, el bloqueo de sincronización y la validación de QA antes de integrar un ECS a la Biblioteca Maestra. Cada regla identifica la autoridad responsable de su cumplimiento y la situación problemática que motivó su definición, evidenciando la trazabilidad entre el diagnóstico inicial de ÉXODO S.A.C. y las restricciones incorporadas al sistema.

**Cuadro de las Reglas de Negocio**

| ID | Nombre de la Regla | Descripción | Autoridad | Situación Actual |
| --- | --- | --- | --- | --- |
| RN-01 | Aprobación Obligatoria de Integración | Ningún ECS puede integrarse a la Biblioteca Maestra/Soporte de un proyecto sin la revisión y aprobación de una Solicitud de Cambio por el CCB. | Comité de Control de Cambios (CCB) | Se integraban cambios directamente sin revisión previa. |
| RN-02 | Identificación Unívoca de Versiones | Toda línea base establecida tras un Check-In a la Biblioteca Maestra debe estar identificada con un estándar de versionamiento (mayor.menor.parche). | Administrador de Configuración / Bibliotecario | Se usaban nombres de carpetas y archivos comprimidos con nombres arbitrarios. |
| RN-03 | Trazabilidad de Cambios | Todo Check-in registrado debe incluir un mensaje descriptivo y estar asociado a una Orden de Cambio (ECN/ECO) previamente emitida. | Analista de Requerimientos / Gestor | No existía registro de quién ni por qué se modificaba el código. |
| RN-04 | Restricción de Bibliotecas Congeladas | Un ECS almacenado en la Biblioteca Maestra no puede modificarse directamente; cualquier corrección exige un nuevo ciclo completo de RFC, Check-Out y Check-In. | Administrador de Configuración / Bibliotecario | Los consultores editaban directamente los archivos entregados al cliente. |
| RN-05 | Evaluación Técnica Obligatoria | Ninguna Solicitud de Cambio puede pasar a evaluación del CCB sin contar previamente con un Informe Técnico de Impacto elaborado por el Arquitecto/Especialista Técnico. | Arquitecto / Especialista Técnico | Los cambios se aprobaban sin un análisis técnico documentado. |


<!-- Página 26 del PDF original -->


| ID | Nombre de la Regla | Descripción | Autoridad | Situación Actual |
| --- | --- | --- | --- | --- |
| RN-06 | Bloqueo de Sincronización Obligatorio | Todo ECS que ingresa a la Biblioteca de Trabajo mediante Check-Out debe quedar bloqueado para otros usuarios hasta su Check-In o rollback. | Administrador de Configuración / Bibliotecario | Varios consultores editaban el mismo archivo de forma simultánea, generando sobreescrituras. |
| RN-07 | Diferenciación de Resultados de Cierre | Toda Solicitud de Cambio debe cerrarse con uno de tres resultados formales y mutuamente excluyentes: Rechazo Técnico (inviabilidad detectada por el CCB), Rechazo Administrativo (decisión del CCB pese a viabilidad técnica) o Cancelación por Fallo No Subsanado (re-test fallido tras corrección). | Comité de Control de Cambios (CCB) / Administrador de Configuración | No existía distinción entre los motivos de cierre de un cambio no exitoso. |
| RN-08 | Reversión Obligatoria ante Fallo No Subsanado | Si el re-test posterior a una corrección no es superado exitosamente, el Administrador de Configuración debe ejecutar un rollback del ECS en la Biblioteca de Trabajo antes de cancelar la Orden de Cambio. | Administrador de Configuración / Bibliotecario | El código con errores permanecía en el entorno de trabajo sin reversión formal. |
| RN-09 | Validación de QA Previa al Check-In a Biblioteca Maestra | Ningún ECS puede pasar de la Biblioteca de Trabajo a la Biblioteca Maestra/Soporte sin la certificación de conformidad del Equipo de Calidad/Testing. | Equipo de Calidad / Testing | El código se entregaba al cliente sin pruebas formales previas. |

Nota: Elaboración Propia

**Estados del Ciclo de Vida de una Solicitud de Cambio**

En concordancia con el flujo de gestión de cambios adoptado por TraceFlow

**SCM, toda Solicitud de Cambio transita por los siguientes estados principales:**

- Registrado: la solicitud fue creada por el Solicitante y recepcionada por

el Analista de Requerimientos.

- En Subsanación: la información de la solicitud está incompleta y se

encuentra en espera de datos adicionales.

- Clasificado: el Analista de Requerimientos definió el tipo y la criticidad

del cambio.


<!-- Página 27 del PDF original -->


- En Análisis Técnico: el Arquitecto/Especialista Técnico está elaborando

el Informe Técnico de Impacto.

- En Evaluación CCB: el Comité de Control de Cambios está evaluando la

viabilidad y aprobación del cambio.

- Rechazado (Técnico): el CCB determinó que el cambio no es

técnicamente viable.

- Rechazado (Administrativo): el CCB decidió no aprobar el cambio pese

a ser técnicamente viable.

- Aprobado – Orden Emitida: se emitió la Orden de Cambio (ECN/ECO) y

el ECS fue trasladado a la Biblioteca de Trabajo.

- En Implementación: el Ingeniero de Software está desarrollando el

cambio sobre el ECS.

- En Validación QA: el Equipo de Calidad está ejecutando pruebas de

integración y validación funcional.

- En Corrección: se detectaron no conformidades y el cambio está en ciclo

de corrección y re-testeo.

- Cancelado (Fallo No Subsanado): el re-test no fue superado y se ejecutó

rollback sobre el ECS.

- Cerrado – Implementado: el ECS certificado fue integrado a la

Biblioteca Maestra, se estableció una nueva línea base y el cambio quedó cerrado formalmente.


<!-- Página 28 del PDF original -->


# 6. Fase de Desarrollo

El ciclo de vida del proyecto TraceFlow SCM adopta la metodología UWE (UML-Based Web Engineering), orientada a aplicaciones web adaptativas, ejecutándose en un periodo intensivo de 15.5 semanas (108 días calendario) correspondiente al semestre académico 2026-II (del 29 de agosto al 14 de diciembre de 2026). Se estructura en 5 fases secuenciales e iterativas que cubren desde el análisis de requisitos hasta el despliegue en la nube y la prueba piloto con los equipos de ÉXODO S.A.C. El desglose de fases organiza el avance técnico del equipo de TraceFlow SCM, articulando el modelado conceptual (RFC, ECS, bibliotecas y líneas base) y la arquitectura en la etapa inicial para respaldar la implementación del motor de control de cambios en Node.js/TypeScript y de la interfaz web en React, culminando con la validación de usabilidad (SUS) y una prueba piloto sobre un proyecto real de la cartera de clientes de ÉXODO S.A.C.

| Fase | Duración | Periodo | Enfoque UWE | Entregables principales |
| --- | --- | --- | --- | --- |
| 1. Análisis de Requisitos y Modelado Conceptual | 3 semanas | 29 ago – 18 sep 2026 | Modelo Conceptual (clases de dominio, casos de uso) | SRS, escenarios de caso de uso, modelo lógico, diagrama de clases preliminar |
| 2. Diseño (Navegación, Presentación y Arquitectura) | 3.5 semanas | 19 sep – 9 oct 2026 | Modelo de Navegación y de Presentación | SAD, diagramas de secuencia, prototipos de interfaz, modelo de navegación web |
| 3. Implementación | 5 semanas | 10 oct – 13 nov 2026 | Construcción del sistema | Módulos de RFC, ECS/bibliotecas, líneas base, auditoría; repositorio versionado |


<!-- Página 29 del PDF original -->


| Fase | Duración | Periodo | Enfoque UWE | Entregables principales |
| --- | --- | --- | --- | --- |
| 4. Pruebas y Validación | 2.5 semanas | 14 nov – 30 nov 2026 | Verificación funcional y de usabilidad | Casos de prueba ejecutados, informe de defectos, evaluación de usabilidad (SUS) |
| 5. Despliegue Cloud y Prueba Piloto | 1.5 semanas | 1 dic – 14 dic 2026 | Despliegue e implantación | Ambiente productivo desplegado, informe de prueba piloto, acta de cierre |

Nota: Elaboración Propia Cada fase conserva un carácter iterativo respecto de la anterior: los hallazgos obtenidos durante la Implementación pueden retroalimentar ajustes menores al Modelo Conceptual o al Modelo de Navegación, y los defectos detectados en la fase de Pruebas y Validación son corregidos antes de avanzar al Despliegue Cloud y Prueba Piloto, replicando así el ciclo formal de control de cambios (RFC → análisis de impacto → aprobación → implementación → validación QA → liberación) que el propio sistema TraceFlow SCM está diseñado para gestionar.

## 6.1. Perfiles de Usuario

El siguiente cuadro describe los siete perfiles de usuario (PU-01 a PU-07) que interactúan con TraceFlow SCM, correspondientes a los actores identificados en los casos de uso: Solicitante, Analista de Requerimientos/Gestor, Arquitecto/Especialista Técnico, Comité de Control de Cambios (CCB), Administrador de Configuración/Bibliotecario, Ingeniero de Software/Desarrollador y Equipo de Calidad/Testing. Para cada perfil se especifica su nivel técnico esperado y las funciones concretas que puede ejecutar en el sistema, información que sustenta la definición de los permisos y del control de acceso basado en roles (RBAC).


<!-- Página 30 del PDF original -->


**Tabla: Matriz de Perfiles y Roles de Usuario del Sistema**

| ID | Tipo de Usuario | Descripción | Nivel Técnico | Funciones en el Sistema |
| --- | --- | --- | --- | --- |
| PU-01 | Solicitante | Persona (interna o del cliente) que identifica una necesidad de cambio y origina el trámite mediante un RFC. | Básico | Registrar Solicitudes de Cambio (RFC), subsanar información observada, consultar el estado y recibir notificaciones de cierre o rechazo. |
| PU-02 | Analista de Requerimientos / Gestor | Responsable de la recepción, validación formal y clasificación inicial de las solicitudes de cambio. | Avanzado | Registrar y validar RFC, solicitar subsanación de datos, clasificar tipo y criticidad, registrar causales de no aprobación, actualizar el plan de gestión del proyecto. |
| PU-03 | Arquitecto / Especialista Técnico | Responsable del análisis de impacto técnico de los cambios propuestos. | Experto | Realizar análisis de impacto en arquitectura y dependencias, estimar esfuerzo/costo/tiempo, generar el Informe Técnico de Impacto. |
| PU-04 | Comité de Control de Cambios (CCB) | Grupo de decisión que evalúa la viabilidad técnica y aprueba o rechaza formalmente los cambios. | Avanzado | Evaluar el informe técnico, aprobar o rechazar solicitudes, emitir Órdenes de Cambio (ECN/ECO). |
| PU-05 | Administrador de Configuració n / Bibliotecario | Responsable de administrar las bibliotecas (Trabajo, Soporte, Maestra), los bloqueos y las líneas base. | Experto | Ejecutar Check-Out/Check-In entre bibliotecas, aplicar y liberar bloqueos de sincronización, ejecutar rollback, establecer líneas base y registrar el cierre formal del cambio. |
| PU-06 | Ingeniero de Software / Desarrollador | Consultor que implementa técnicamente el cambio aprobado sobre el ECS. | Medio | Implementar el cambio, ejecutar pruebas unitarias locales, corregir defectos reportados por QA. |
| PU-07 | Equipo de Calidad / Testing | Responsable de validar funcional y técnicamente el cambio antes de su liberación. | Medio | Ejecutar pruebas de integración y validación funcional, certificar conformidad, reportar no conformidades, re-testear correcciones. |

Nota: Elaboración Propia La delimitación de perfiles asegura una adecuada segregación de funciones, donde el mentoreado resuelve dudas temáticas, el mentor gestiona y dicta las


<!-- Página 31 del PDF original -->


clases acumulando horas, y la administración supervisa la calidad del servicio tutorial y formaliza las certificaciones.

### 6.1.1. Diagrama de Paquetes

El sistema se organiza en ocho paquetes principales: Gobernanza y Seguridad, Gestión de Proyectos, Gestión de Configuración (ECS), Gestión de Bibliotecas (Trabajo, Soporte y Maestra), Control de Cambios, Soporte e Incidencias, Trazabilidad y Auditoría, y Reportes. El paquete de Gestión de Bibliotecas administra los ECS y es orquestado por Control de Cambios mediante las operaciones de Check-Out y Check-In descritas en el flujo de gestión de cambios; los paquetes de negocio dependen de Gobernanza y Seguridad para la autenticación y el control de acceso, mientras que Trazabilidad y Auditoría recibe eventos desde Control de Cambios y desde la Gestión de Configuración


![Página 31 - diagrama o elemento visual del documento original](assets/page-031.png)


<!-- Página 32 del PDF original -->


**Diagrama de Paquetes Arquitecturales - Sistema TraceFlow SCM**

Nota: Elaboración Propia


![Página 32 - diagrama o elemento visual del documento original](assets/page-032.png)


<!-- Página 33 del PDF original -->


### 6.1.2. Diagrama de Casos de Uso

Se identifican los siete roles definidos en el flujo de gestión de cambios de TraceFlow SCM (Solicitante, Analista de Requerimientos/Gestor, Arquitecto/Especialista Técnico, Comité de Control de Cambios, Administrador de Configuración/Bibliotecario, Ingeniero de Software/Desarrollador y Equipo de Calidad/Testing), que interactúan con los casos de uso agrupados en seis paquetes funcionales: Gestión de Usuarios y Proyectos, Registro y Evaluación de la RFC, Gestión de ECS y Bibliotecas, Implementación y Validación, Líneas Base y Rollback, e Incidencias/Trazabilidad/Reportes.

**Diagrama de Casos de Uso General - Sistema TraceFlow SCM**

Nota: Elaboración Propia


![Página 33 - diagrama o elemento visual del documento original](assets/page-033.png)


<!-- Página 34 del PDF original -->


**Diagrama de Administración de Usuarios y Proyectos**

Nota: Elaboración Propia

**Diagrama de Gestión de Incidencias y Solicitudes de Cambio (RFC) - Sistema**

TraceFlow SCM Nota: Elaboración Propia


![Página 34 - diagrama o elemento visual del documento original](assets/page-034.png)


<!-- Página 35 del PDF original -->


**Diagrama de SCM Core (Gestión de ECS, Bibliotecas y Líneas Base) - Sistema**

TraceFlow SCM Nota: Elaboración Propia

**Diagrama de Implementación y Validación de la Calidad - Sistema TraceFlow**

SCM Nota: Elaboración Propia


<!-- Página 36 del PDF original -->


**Diagrama de Trazabilidad, Auditoría e Integridad - Sistema TraceFlow SCM**

Nota: Elaboración Propia

### 6.1.3. Escenarios de Caso de Uso (narrativa)

| Campo | Descripción |
| --- | --- |
| Código | CUS01 |
| Nombre | Gestionar usuarios y roles |
| Tipo | Secundario, administrativo |
| Requerimiento asociado | RF-01 – Gestión de Usuarios y Roles |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Usuarios del sistema |
| Módulo relacionado | Gestión de Usuarios y Proyectos |
| Propósito | Permitir administrar las cuentas de usuario y asignar los roles correspondientes dentro de TraceFlow SCM. |
| Descripción | El Administrador registra usuarios, modifica sus datos y asigna uno de los roles definidos en el flujo de gestión de configuración. El sistema restringe las funcionalidades |


<!-- Página 37 del PDF original -->


disponibles de acuerdo con el rol asignado. Resultado esperado El usuario queda registrado o actualizado con los permisos correspondientes a su rol.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona la opción “Gestionar usuarios y roles”. | El sistema muestra el listado de usuarios registrados y las opciones de administración. |
| 2 | Selecciona la opción para registrar un nuevo usuario. | El sistema muestra el formulario de registro de usuario. |
| 3 | Ingresa los datos requeridos y selecciona el rol correspondiente. | El sistema valida los datos y determina los permisos asociados al rol seleccionado. |
| 4 | Confirma el registro. | El sistema registra al usuario y habilita las funcionalidades correspondientes a su rol. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Se requiere modificar el rol de un usuario existente. | El Administrador selecciona al usuario y cambia el rol asignado. | El sistema actualiza los permisos conservando la trazabilidad del usuario. |
| FA02 | Se requiere desactivar una cuenta sin eliminar su historial. | El Administrador selecciona la opción de desactivación. | El sistema bloquea el acceso de la cuenta y conserva sus acciones |


<!-- Página 38 del PDF original -->


históricas.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Existen datos obligatorios incompletos. | El sistema no registra al usuario e indica los campos pendientes. |
| E02 | El correo o identificador ingresado ya está registrado. | El sistema rechaza el registro e informa que el usuario ya existe. |
| E03 | El usuario que realiza la operación no posee permisos suficientes. | El sistema bloquea la operación y registra el intento en auditoría. |

| Campo | Descripción |
| --- | --- |
| Código | CUS02 |
| Nombre | Crear y administrar proyectos |
| Tipo | Primario, administrativo |
| Requerimiento asociado | RF-02 – Gestión de Proyectos |
| Actor principal | Analista de Requerimientos / Gestor |
| Actores secundarios | Administrador de Configuración / Bibliotecario |
| Módulo relacionado | Gestión de Usuarios y Proyectos |
| Propósito | Permitir crear y mantener los proyectos de clientes que serán gestionados de forma independiente en TraceFlow SCM. |
| Descripción | El Analista registra un proyecto indicando sus datos principales, cliente y responsables. El sistema crea un espacio lógico |


<!-- Página 39 del PDF original -->


independiente para administrar sus ECS, solicitudes de cambio, órdenes y líneas base. Resultado esperado El proyecto queda registrado y disponible para la gestión de configuración de forma aislada respecto de los demás proyectos.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Analista selecciona la opción “Crear proyecto”. | El sistema muestra el formulario de registro del proyecto. |
| 2 | Ingresa el nombre, cliente, descripción y responsables del proyecto. | El sistema valida que la información obligatoria esté completa. |
| 3 | Confirma la creación del proyecto. | El sistema genera un identificador único y crea el espacio lógico del proyecto. |
| 4 | Revisa el proyecto registrado. | El sistema muestra el detalle y habilita las opciones de administración correspondientes. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Se requiere actualizar información general de un proyecto. | El Analista selecciona el proyecto y modifica los campos permitidos. | El sistema actualiza la información conservando el identificador y la trazabilidad. |
| FA02 | El proyecto ha finalizado y ya no debe recibir nuevos | El Analista solicita cambiar su estado a cerrado o inactivo. | El sistema restringe nuevas operaciones y |


<!-- Página 40 del PDF original -->


cambios. mantiene disponible el historial de consulta.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Faltan datos obligatorios del proyecto. | El sistema no registra el proyecto y resalta los campos pendientes. |
| E02 | El identificador o nombre interno del proyecto ya está en uso. | El sistema solicita utilizar un identificador diferente. |
| E03 | Ocurre un error durante la creación del espacio lógico. | El sistema cancela la creación y notifica que la operación debe reintentarse. |

| Campo | Descripción |
| --- | --- |
| Código | CUS03 |
| Nombre | Consultar proyecto |
| Tipo | Secundario, consulta |
| Requerimiento asociado | RF-02 – Gestión de Proyectos |
| Actor principal | Analista de Requerimientos / Gestor |
| Actores secundarios | Personal autorizado del proyecto |
| Módulo relacionado | Gestión de Usuarios y Proyectos |
| Propósito | Permitir consultar la información general y el estado de un proyecto registrado en TraceFlow SCM. |
| Descripción | El Analista busca un proyecto |


<!-- Página 41 del PDF original -->


mediante criterios de consulta y accede a sus datos, responsables, estado y referencias de configuración disponibles según sus permisos. Resultado esperado El sistema presenta la información actualizada del proyecto seleccionado sin modificar su contenido.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Analista accede a la opción de consulta de proyectos. | El sistema muestra los filtros de búsqueda disponibles. |
| 2 | Ingresa uno o más criterios de búsqueda. | El sistema lista los proyectos que coinciden con los criterios y a los que tiene acceso. |
| 3 | Selecciona un proyecto del listado. | El sistema muestra los datos generales, responsables y estado del proyecto. |
| 4 | Revisa la información requerida. | El sistema mantiene disponibles las opciones de consulta asociadas al proyecto. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La búsqueda devuelve una cantidad elevada de proyectos. | El Analista aplica filtros adicionales. | El sistema actualiza el listado con los nuevos criterios. |
| FA02 | El Analista desea consultar un proyecto cerrado. | Selecciona la opción de incluir proyectos inactivos o cerrados. | El sistema incorpora esos proyectos en los resultados de |


<!-- Página 42 del PDF original -->


consulta.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existen proyectos que coincidan con los criterios. | El sistema informa que no se encontraron resultados. |
| E02 | El usuario intenta consultar un proyecto para el cual no posee permisos. | El sistema deniega el acceso al detalle del proyecto. |

| Campo | Descripción |
| --- | --- |
| Código | CUS04 |
| Nombre | Registrar Solicitud de Cambio (RFC) |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-04 – Registro de Solicitudes de Cambio (RFC) |
| Actor principal | Solicitante |
| Actores secundarios | Analista de Requerimientos / Gestor |
| Módulo relacionado | Registro y Evaluación de la RFC |
| Propósito | Permitir registrar formalmente una necesidad de cambio sobre un proyecto o Elemento de Configuración. |
| Descripción | El Solicitante completa una RFC indicando descripción, justificación, prioridad, ECS afectado y fecha. El sistema registra la solicitud e inicia el flujo formal de evaluación de |


<!-- Página 43 del PDF original -->


cambios. Resultado esperado La RFC queda registrada con estado “Registrado” y disponible para la validación y clasificación del Analista.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Solicitante selecciona la opción “Registrar Solicitud de Cambio (RFC)”. | El sistema muestra el formulario de registro de la solicitud. |
| 2 | Completa la descripción, justificación, prioridad, ECS afectado y fecha. | El sistema valida los datos ingresados y la existencia del ECS seleccionado. |
| 3 | Revisa la información y confirma el registro. | El sistema genera un identificador único para la RFC y la guarda con estado “Registrado”. |
| 4 | Consulta la confirmación de registro. | El sistema notifica al Analista de Requerimientos / Gestor que existe una nueva RFC pendiente de revisión. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El Solicitante desea corregir información antes de enviar la RFC. | Modifica los campos del formulario antes de confirmar. | El sistema conserva los cambios y vuelve a validar la información. |
| FA02 | La solicitud corresponde a una incidencia previamente registrada. | El Solicitante o Analista selecciona la incidencia relacionada. | El sistema vincula la RFC con el ticket de incidencia de origen. |


<!-- Página 44 del PDF original -->


**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Uno o más campos obligatorios están vacíos. | El sistema no registra la RFC y señala los campos que deben completarse. |
| E02 | El ECS indicado no existe o no pertenece al proyecto seleccionado. | El sistema rechaza la selección y solicita elegir un ECS válido. |
| E03 | Ocurre una interrupción durante el registro. | El sistema informa que la RFC no pudo registrarse y permite reintentar la operación. |

| Campo | Descripción |
| --- | --- |
| Código | CUS05 |
| Nombre | Validar y clasificar la solicitud |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-04, RF-05 – Registro, Clasificación y Análisis de Impacto |
| Actor principal | Analista de Requerimientos / Gestor |
| Actores secundarios | Solicitante |
| Módulo relacionado | Registro y Evaluación de la RFC |
| Propósito | Verificar que la RFC contenga información suficiente y clasificar el tipo y criticidad del cambio. |
| Descripción | El Analista revisa la información registrada en la RFC. Si está completa, determina el tipo y la |


<!-- Página 45 del PDF original -->


criticidad; si requiere información adicional, solicita la subsanación al Solicitante. Resultado esperado La RFC queda en estado “Clasificado” y preparada para el análisis técnico, o en “En Subsanación” si requiere datos adicionales.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Analista selecciona una RFC con estado “Registrado”. | El sistema muestra el detalle de la solicitud y el ECS relacionado. |
| 2 | Revisa que la descripción, justificación, prioridad y demás datos sean suficientes. | El sistema permite validar la completitud de la información. |
| 3 | Define el tipo y la criticidad del cambio. | El sistema registra la clasificación seleccionada. |
| 4 | Confirma la validación de la solicitud. | El sistema actualiza el estado a “Clasificado” y la remite al análisis técnico. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La información de la RFC es incompleta o poco clara. | El Analista registra las observaciones y solicita subsanación. | El sistema cambia el estado a “En Subsanación” y notifica al Solicitante. |
| FA02 | El Solicitante completa la información observada. | Corrige los datos y reenvía la solicitud. | El sistema devuelve la RFC al Analista para una nueva |


<!-- Página 46 del PDF original -->


validación.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | La RFC fue cerrada o cancelada previamente. | El sistema impide modificar su clasificación. |
| E02 | No se puede acceder al ECS asociado a la solicitud. | El sistema informa la inconsistencia y no permite finalizar la validación. |
| E03 | El Analista intenta clasificar sin completar los datos obligatorios de clasificación. | El sistema solicita completar la información faltante. |

| Campo | Descripción |
| --- | --- |
| Código | CUS06 |
| Nombre | Realizar análisis de impacto técnico |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-05 – Clasificación y Análisis de Impacto |
| Actor principal | Arquitecto / Especialista Técnico |
| Actores secundarios | Analista de Requerimientos / Gestor |
| Módulo relacionado | Registro y Evaluación de la RFC |
| Propósito | Determinar las consecuencias técnicas, esfuerzo, costo, tiempo y riesgos asociados a la implementación de una RFC. |
| Descripción | El Arquitecto revisa la RFC |


<!-- Página 47 del PDF original -->


clasificada y analiza la arquitectura, dependencias, esfuerzo, costo, tiempo y riesgos. Con esta información genera el Informe Técnico de Impacto requerido para la evaluación del CCB. Resultado esperado El Informe Técnico de Impacto queda registrado y la RFC queda disponible para evaluación del Comité de Control de Cambios.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Arquitecto selecciona una RFC con estado “Clasificado”. | El sistema muestra la solicitud, el ECS afectado y la información de contexto disponible. |
| 2 | Analiza la arquitectura, dependencias y componentes relacionados. | El sistema permite registrar los impactos técnicos identificados. |
| 3 | Registra estimaciones de esfuerzo, costo, tiempo y riesgos. | El sistema consolida los datos en el Informe Técnico de Impacto. |
| 4 | Finaliza y confirma el análisis. | El sistema registra el informe, actualiza el estado a “En Análisis Técnico” completado y habilita la evaluación del CCB. |

**Flujos Alternativos:**

Código Situación Acción del actor Respuesta del sistema FA01 El Arquitecto Consulta el historial El sistema requiere revisar de versiones y muestra la antecedentes del cambios trazabilidad ECS. relacionados. disponible para


<!-- Página 48 del PDF original -->


complementar el análisis. FA02 Se identifica El Arquitecto El sistema impacto sobre más incorpora los registra las de un ECS. elementos dependencias e adicionales en el impactos informe. asociados a cada elemento.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Falta información necesaria para completar el análisis. | El sistema impide finalizar el informe e indica los datos pendientes. |
| E02 | El ECS relacionado ya no está disponible para consulta. | El sistema informa la inconsistencia y suspende el cierre del análisis. |
| E03 | Se intenta remitir al CCB una RFC sin Informe Técnico completo. | El sistema bloquea la remisión hasta completar el informe. |

| Campo | Descripción |
| --- | --- |
| Código | CUS07 |
| Nombre | Evaluar viabilidad y aprobar/rechazar |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-06 – Evaluación y Aprobación por el CCB |
| Actor principal | Comité de Control de Cambios (CCB) |


<!-- Página 49 del PDF original -->


| Actores secundarios | Arquitecto / Especialista Técnico, Analista de Requerimientos / Gestor, Solicitante |
| --- | --- |
| Módulo relacionado | Registro y Evaluación de la RFC |
| Propósito | Permitir al CCB determinar la viabilidad del cambio y registrar formalmente su aprobación o rechazo. |
| Descripción | El CCB revisa la RFC y el Informe Técnico de Impacto, evalúa la viabilidad y toma una decisión. Cuando el cambio no es aprobado, registra la causal correspondiente para conservar la trazabilidad del cierre. |
| Resultado esperado | La RFC queda aprobada para emitir una Orden de Cambio o cerrada como rechazo técnico o administrativo, según corresponda. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El CCB selecciona una RFC lista para evaluación. | El sistema muestra la solicitud y el Informe Técnico de Impacto. |
| 2 | Revisa la viabilidad, riesgos y estimaciones del cambio. | El sistema habilita las opciones de aprobación y rechazo. |
| 3 | Selecciona la opción “Aprobar”. | El sistema registra la decisión del Comité. |
| 4 | Confirma la decisión. | El sistema deja la RFC aprobada y habilita la emisión de la Orden de Cambio (ECN/ECO). |

**Flujos Alternativos:**


<!-- Página 50 del PDF original -->


| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El cambio es considerado técnicamente inviable. | El CCB selecciona rechazo técnico y registra la causal. | El sistema cierra la RFC como “Rechazado (Técnico)” y notifica al Solicitante. |
| FA02 | El cambio es viable, pero el CCB decide no autorizarlo. | El CCB registra la causal administrativa. | El sistema cierra la RFC como “Rechazado (Administrativo )” y notifica al Solicitante. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | La RFC no cuenta con un Informe Técnico de Impacto completo. | El sistema impide iniciar la decisión formal del CCB. |
| E02 | Se intenta rechazar una solicitud sin registrar la causal. | El sistema exige la justificación antes de confirmar el rechazo. |
| E03 | La RFC cambió de estado mientras estaba siendo evaluada. | El sistema actualiza la información y solicita revisar nuevamente antes de decidir. |

| Campo | Descripción |
| --- | --- |
| Código | CUS08 |
| Nombre | Emitir Orden de Cambio (ECN/ECO) |


<!-- Página 51 del PDF original -->


| Tipo | Primario, esencial |
| --- | --- |
| Requerimiento asociado | RF-07 – Gestión de Órdenes de Cambio |
| Actor principal | Comité de Control de Cambios (CCB) |
| Actores secundarios | Analista de Requerimientos / Gestor, Administrador de Configuración / Bibliotecario |
| Módulo relacionado | Registro y Evaluación de la RFC |
| Propósito | Formalizar la autorización para implementar una modificación previamente aprobada por el CCB. |
| Descripción | Una vez aprobada la RFC, el CCB genera la Orden de Cambio ECN/ECO. La orden queda vinculada con la solicitud y el ECS afectado y sirve como autorización formal para iniciar las operaciones de configuración. |
| Resultado esperado | La Orden de Cambio queda emitida, vinculada a la RFC y disponible para iniciar el Check-Out del ECS. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El CCB selecciona una RFC aprobada. | El sistema verifica el estado de aprobación y muestra los datos del cambio. |
| 2 | Selecciona la opción “Emitir Orden de Cambio”. | El sistema prepara la ECN/ECO con la información asociada a la RFC. |
| 3 | Revisa las instrucciones de ejecución y confirma la | El sistema genera el identificador de la Orden de |


<!-- Página 52 del PDF original -->


emisión. Cambio y la vincula al ECS.

# 4. Finaliza la emisión. El sistema actualiza el estado a

“Aprobado – Orden Emitida” y notifica a los responsables de ejecución.

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La Orden requiere instrucciones técnicas adicionales. | El CCB completa las observaciones antes de confirmar. | El sistema incorpora las instrucciones en la ECN/ECO. |
| FA02 | Se requiere consultar el detalle de la RFC antes de emitir. | El CCB abre la solicitud relacionada. | El sistema muestra la trazabilidad de la aprobación sin abandonar el proceso de emisión. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | La RFC no está aprobada. | El sistema impide emitir una Orden de Cambio. |
| E02 | Ya existe una Orden de Cambio vigente para la misma RFC. | El sistema informa la duplicidad y no genera una nueva orden. |
| E03 | Falla el registro de la Orden. | El sistema no cambia el estado de la RFC y permite reintentar la emisión. |

Campo Descripción


<!-- Página 53 del PDF original -->


| Código | CUS09 |
| --- | --- |
| Nombre | Registrar ECS |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-03 – Identificación de ECS |
| Actor principal | Arquitecto / Especialista Técnico |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Gestión de ECS y Bibliotecas |
| Propósito | Permitir identificar y catalogar los Elementos de Configuración administrados por cada proyecto. |
| Descripción | El usuario registra un ECS indicando el proyecto, nombre, tipo de elemento y versión inicial. El sistema le asigna una identificación única y lo incorpora al inventario de configuración. |
| Resultado esperado | El ECS queda registrado, clasificado y disponible para las operaciones de versionamiento y control de cambios. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Arquitecto selecciona la opción “Registrar ECS”. | El sistema muestra el formulario de identificación del elemento. |
| 2 | Indica proyecto, nombre, tipo y versión inicial del ECS. | El sistema valida la información y la pertenencia al proyecto. |
| 3 | Adjunta o referencia el | El sistema valida que el |


<!-- Página 54 del PDF original -->


artefacto que será controlado. elemento sea accesible.

# 4. Confirma el registro. El sistema genera el

identificador único del ECS y lo incorpora al inventario del proyecto.

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El ECS corresponde a documentación o esquema de base de datos en lugar de código. | El usuario selecciona el tipo de ECS correspondiente. | El sistema adapta los datos de clasificación al tipo seleccionado. |
| FA02 | El usuario desea registrar varios ECS relacionados. | Registra cada elemento e indica sus relaciones. | El sistema conserva las asociaciones entre los ECS del proyecto. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El ECS ya se encuentra registrado en el proyecto. | El sistema informa la posible duplicidad y no crea un nuevo identificador. |
| E02 | La versión inicial ingresada no cumple el formato configurado. | El sistema solicita corregir la versión antes de continuar. |
| E03 | El artefacto referenciado no puede ser localizado. | El sistema no completa el registro y solicita verificar la referencia. |

Campo Descripción


<!-- Página 55 del PDF original -->


| Código | CUS10 |
| --- | --- |
| Nombre | Efectuar Check-Out (Soporte → Trabajo) |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-08, RF-09 – Gestión de Bibliotecas y Control de Versiones |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Gestión de ECS y Bibliotecas |
| Propósito | Trasladar de forma controlada un ECS desde la Biblioteca de Soporte hacia la Biblioteca de Trabajo para implementar una Orden de Cambio. |
| Descripción | El Administrador selecciona una Orden de Cambio vigente y ejecuta el Check-Out del ECS asociado. El sistema registra la operación y coloca el elemento en la Biblioteca de Trabajo para su modificación controlada. |
| Resultado esperado | El ECS queda disponible en la Biblioteca de Trabajo, asociado a la Orden de Cambio y preparado para aplicar el bloqueo de sincronización. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona una Orden de Cambio vigente. | El sistema muestra el ECS o los ECS asociados a la orden. |
| 2 | Selecciona el ECS y solicita | El sistema verifica su |


<!-- Página 56 del PDF original -->


|  | efectuar el Check-Out. | ubicación, estado y disponibilidad. |
| --- | --- | --- |
| 3 | Confirma la operación. | El sistema traslada una copia controlada del ECS a la Biblioteca de Trabajo. |
| 4 | Revisa la confirmación. | El sistema registra autor, fecha, versión y Orden de Cambio asociada al Check-Out. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La Orden de Cambio afecta a más de un ECS. | El Administrador selecciona los elementos requeridos. | El sistema procesa cada Check-Out de forma individual y conserva su trazabilidad. |
| FA02 | Se requiere consultar la versión vigente antes de efectuar el Check-Out. | El Administrador abre el historial del ECS. | El sistema muestra las versiones disponibles y permite regresar a la operación. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El ECS ya tiene un Check-Out activo. | El sistema rechaza la operación e informa el bloqueo existente. |
| E02 | La Orden de Cambio fue cancelada o no está vigente. | El sistema impide efectuar el Check-Out. |
| E03 | El ECS no se encuentra en la | El sistema cancela la operación y solicita |


<!-- Página 57 del PDF original -->


Biblioteca de Soporte. revisar su ubicación actual.

| Campo | Descripción |
| --- | --- |
| Código | CUS11 |
| Nombre | Aplicar bloqueo de sincronización |
| Tipo | Incluido, esencial |
| Requerimiento asociado | RF-09 – Control de Versiones y Bloqueos de Sincronización |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Gestión de ECS y Bibliotecas |
| Propósito | Evitar la edición concurrente de un mismo ECS mientras se encuentra en la Biblioteca de Trabajo. |
| Descripción | Después del Check-Out, el Administrador aplica un bloqueo de sincronización sobre el ECS. Mientras el bloqueo está vigente, otros usuarios no pueden iniciar una modificación concurrente del mismo elemento. |
| Resultado esperado | El ECS queda bloqueado para otros usuarios hasta que se realice su Check-In o rollback. |

**Flujo Principal:**

N.º Acción del actor Respuesta del sistema

# 1. El Administrador finaliza el El sistema identifica el


<!-- Página 58 del PDF original -->


|  | Check-Out de un ECS. | elemento trasladado a la Biblioteca de Trabajo. |
| --- | --- | --- |
| 2 | Solicita aplicar el bloqueo de sincronización. | El sistema comprueba que no exista otro bloqueo vigente sobre el mismo ECS. |
| 3 | Confirma la aplicación del bloqueo. | El sistema registra el usuario, fecha y Orden de Cambio asociada. |
| 4 | Consulta el estado del ECS. | El sistema muestra el elemento como bloqueado para edición concurrente. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Se completa correctamente el Check-In del ECS. | El Administrador confirma la finalización de la operación. | El sistema libera automáticament e el bloqueo de sincronización. |
| FA02 | Se ejecuta un rollback sobre el ECS. | El Administrador completa la reversión. | El sistema libera el bloqueo una vez restaurado el estado anterior. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Ya existe un bloqueo activo sobre el ECS. | El sistema impide aplicar un segundo bloqueo y muestra su responsable. |
| E02 | El ECS no se encuentra en la Biblioteca de Trabajo. | El sistema no permite aplicar el bloqueo. |


<!-- Página 59 del PDF original -->


E03 No se puede registrar El sistema revierte la el bloqueo. operación y mantiene el ECS sin habilitar para modificación.

| Campo | Descripción |
| --- | --- |
| Código | CUS12 |
| Nombre | Efectuar Check-In (Trabajo → Maestra/Soporte) |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-08, RF-09 – Gestión de Bibliotecas y Control de Versiones |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Equipo de Calidad / Testing |
| Módulo relacionado | Gestión de ECS y Bibliotecas |
| Propósito | Integrar un ECS verificado desde la Biblioteca de Trabajo hacia la Biblioteca Maestra/Soporte mediante una operación controlada de Check-In. |
| Descripción | El Administrador selecciona el ECS cuya conformidad fue certificada por QA, verifica la Orden de Cambio y realiza el Check-In. El sistema registra una nueva versión y deja el elemento preparado para establecer una línea base. |
| Resultado esperado | El ECS certificado queda incorporado a la Biblioteca Maestra/Soporte con una nueva versión registrada y trazable. |


<!-- Página 60 del PDF original -->


**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona el ECS certificado por QA. | El sistema muestra la versión de trabajo y verifica la certificación de conformidad. |
| 2 | Solicita efectuar el Check-In. | El sistema valida la Orden de Cambio, el bloqueo y los datos de la nueva versión. |
| 3 | Confirma la operación e ingresa el mensaje descriptivo del cambio. | El sistema integra el ECS en la Biblioteca Maestra/Soporte y registra autor, fecha y descripción. |
| 4 | Revisa la confirmación. | El sistema habilita la creación y congelamiento de la nueva línea base. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El Check-In involucra varios ECS certificados. | El Administrador selecciona el conjunto correspondiente. | El sistema procesa y registra cada elemento de manera independiente. |
| FA02 | Se requiere revisar el resultado de QA antes de confirmar. | El Administrador consulta la certificación asociada. | El sistema muestra la evidencia de conformidad y permite volver al Check-In. |

**Eventos de Excepción:**

Código Evento de excepción Respuesta del sistema E01 El ECS no posee El sistema bloquea el certificación de Check-In.


<!-- Página 61 del PDF original -->


|  | conformidad de QA. |  |
| --- | --- | --- |
| E02 | El ECS fue modificado después de la certificación. | El sistema rechaza la operación y solicita una nueva validación. |
| E03 | No se registra un mensaje descriptivo o una Orden de Cambio válida. | El sistema no permite completar el Check-In. |

| Campo | Descripción |
| --- | --- |
| Código | CUS13 |
| Nombre | Consultar historial de versiones |
| Tipo | Secundario, consulta |
| Requerimiento asociado | RF-09, RF-16 – Control de Versiones y Trazabilidad |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Arquitecto / Especialista Técnico, Ingeniero de Software / Desarrollador |
| Módulo relacionado | Gestión de ECS y Bibliotecas |
| Propósito | Permitir consultar las versiones históricas y las operaciones realizadas sobre un ECS. |
| Descripción | El usuario autorizado selecciona un ECS y accede a su historial de versiones. El sistema muestra las versiones registradas, fechas, autores, mensajes de cambio y relaciones con las Órdenes de Cambio. |


<!-- Página 62 del PDF original -->


Resultado esperado Se presenta el historial completo y trazable del ECS sin modificar ninguna versión.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El usuario accede a la consulta de ECS. | El sistema muestra los criterios de búsqueda disponibles. |
| 2 | Busca y selecciona un ECS. | El sistema muestra la versión actual y sus datos generales. |
| 3 | Selecciona la opción “Historial de versiones”. | El sistema lista las versiones, autores, fechas y mensajes registrados. |
| 4 | Selecciona una versión del historial. | El sistema muestra el detalle y las relaciones de trazabilidad correspondientes. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El usuario desea comparar dos versiones. | Selecciona dos registros del historial. | El sistema muestra la información disponible para identificar sus diferencias y cambios asociados. |
| FA02 | El usuario filtra el historial por periodo o autor. | Define los filtros de consulta. | El sistema actualiza el listado con los registros coincidentes. |

**Eventos de Excepción:**

Código Evento de excepción Respuesta del sistema


<!-- Página 63 del PDF original -->


| E01 | El ECS no posee versiones anteriores. | El sistema informa que únicamente se encuentra disponible la versión inicial. |
| --- | --- | --- |
| E02 | El usuario no posee permisos sobre el proyecto. | El sistema deniega la consulta del historial. |
| E03 | El historial no puede recuperarse temporalmente. | El sistema informa el error y permite reintentar la consulta. |

| Campo | Descripción |
| --- | --- |
| Código | CUS14 |
| Nombre | Implementar cambio en el ECS |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-07, RF-09 – Orden de Cambio y Control de Versiones |
| Actor principal | Ingeniero de Software / Desarrollador |
| Actores secundarios | Administrador de Configuración / Bibliotecario |
| Módulo relacionado | Implementación y Validación |
| Propósito | Ejecutar técnicamente las modificaciones autorizadas en la Orden de Cambio sobre el ECS ubicado en la Biblioteca de Trabajo. |
| Descripción | El Desarrollador accede al ECS con Check-Out vigente, revisa las instrucciones de la ECN/ECO e implementa las modificaciones autorizadas. El sistema mantiene la |


<!-- Página 64 del PDF original -->


relación entre la versión de trabajo y la Orden de Cambio. Resultado esperado Se obtiene una nueva versión de trabajo del ECS preparada para la ejecución de pruebas unitarias locales.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Desarrollador accede al ECS asignado en la Biblioteca de Trabajo. | El sistema verifica que exista un Check-Out y bloqueo asociado a la Orden de Cambio. |
| 2 | Consulta las instrucciones de la ECN/ECO. | El sistema muestra el alcance y la información técnica autorizada. |
| 3 | Implementa las modificaciones indicadas sobre el ECS. | El sistema mantiene la versión de trabajo vinculada a la Orden de Cambio. |
| 4 | Marca la implementación como lista para pruebas unitarias. | El sistema registra el avance y habilita la etapa de pruebas locales. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Durante la implementación se detecta una dependencia adicional. | El Desarrollador registra la observación técnica. | El sistema conserva la observación asociada a la Orden de Cambio para su seguimiento. |
| FA02 | El Desarrollador necesita consultar una versión | Accede al historial del ECS. | El sistema permite la consulta sin |


<!-- Página 65 del PDF original -->


anterior. alterar la versión de trabajo vigente.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El ECS está bloqueado por otro usuario o no corresponde al Desarrollador. | El sistema deniega la modificación. |
| E02 | La Orden de Cambio fue cancelada durante la implementación. | El sistema impide continuar y notifica el cambio de estado. |
| E03 | El ECS de trabajo no puede ser accedido. | El sistema informa la incidencia y evita registrar una implementación incompleta. |

| Campo | Descripción |
| --- | --- |
| Código | CUS15 |
| Nombre | Ejecutar pruebas unitarias locales |
| Tipo | Secundario, validación |
| Requerimiento asociado | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| Actor principal | Ingeniero de Software / Desarrollador |
| Actores secundarios | Equipo de Calidad / Testing |
| Módulo relacionado | Implementación y Validación |
| Propósito | Comprobar localmente el comportamiento de las unidades |


<!-- Página 66 del PDF original -->


|  | modificadas antes de remitir el ECS a las pruebas de integración. |
| --- | --- |
| Descripción | El Desarrollador ejecuta pruebas unitarias sobre la versión de trabajo modificada y registra sus resultados. Si existen fallos, realiza las correcciones necesarias antes de continuar al proceso de QA. |
| Resultado esperado | Las pruebas unitarias quedan registradas y el ECS queda preparado para las pruebas de integración cuando los resultados son satisfactorios. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Desarrollador selecciona la versión de trabajo implementada. | El sistema muestra el ECS y la Orden de Cambio relacionados. |
| 2 | Ejecuta las pruebas unitarias locales definidas para el cambio. | El sistema permite registrar los resultados obtenidos. |
| 3 | Verifica que las pruebas sean satisfactorias. | El sistema guarda los resultados y la evidencia registrada. |
| 4 | Confirma la finalización de las pruebas locales. | El sistema marca la versión como preparada para validación por QA. |

**Flujos Alternativos:**

Código Situación Acción del actor Respuesta del sistema FA01 Una o más pruebas El Desarrollador El sistema unitarias fallan. corrige el código y actualiza los vuelve a ejecutar resultados las pruebas. manteniendo el


<!-- Página 67 del PDF original -->


historial de intentos. FA02 Se incorporan El Desarrollador El sistema pruebas adicionales registra y ejecuta agrega sus durante la las nuevas pruebas. resultados al corrección. registro de la versión de trabajo.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No se pueden completar las pruebas unitarias. | El sistema mantiene el ECS en estado de implementación y no lo habilita para QA. |
| E02 | Se intenta finalizar con pruebas fallidas. | El sistema advierte los resultados pendientes y bloquea el avance. |
| E03 | Se pierde la conexión al registrar resultados. | El sistema informa que los resultados no fueron confirmados y permite reintentarlo. |

| Campo | Descripción |
| --- | --- |
| Código | CUS16 |
| Nombre | Ejecutar pruebas de integración |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| Actor principal | Equipo de Calidad / Testing |
| Actores secundarios | Ingeniero de Software / Desarrollador |


<!-- Página 68 del PDF original -->


| Módulo relacionado | Implementación y Validación |
| --- | --- |
| Propósito | Verificar que el cambio funcione correctamente al integrarse con los demás componentes y cumpla la validación funcional esperada. |
| Descripción | El Equipo de Calidad selecciona la versión preparada por el Desarrollador, ejecuta pruebas de integración y validación funcional y registra los resultados y evidencias de la evaluación. |
| Resultado esperado | Los resultados de las pruebas quedan registrados y el cambio queda preparado para certificación o para reportar una no conformidad. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | QA selecciona el ECS pendiente de validación. | El sistema muestra la versión, Orden de Cambio y resultados de pruebas previas. |
| 2 | Ejecuta las pruebas de integración y validación funcional. | El sistema permite registrar resultados y evidencias de cada prueba. |
| 3 | Consolida los resultados de la ejecución. | El sistema identifica si existen pruebas fallidas o hallazgos. |
| 4 | Confirma que los resultados son satisfactorios. | El sistema habilita la opción de certificar la conformidad del cambio. |

**Flujos Alternativos:**

Código Situación Acción del actor Respuesta del sistema FA01 Se detectan QA registra los El sistema defectos durante hallazgos deriva el flujo


<!-- Página 69 del PDF original -->


las pruebas. detectados. hacia el reporte de no conformidad. FA02 Se requiere repetir QA ejecuta El sistema una prueba por nuevamente la conserva el evidencia prueba nuevo resultado insuficiente. seleccionada. junto con el registro anterior.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El entorno de pruebas no está disponible. | El sistema mantiene la validación pendiente y registra la interrupción. |
| E02 | La versión del ECS no coincide con la preparada para QA. | El sistema bloquea la ejecución hasta validar la versión correcta. |
| E03 | No se puede guardar la evidencia de una prueba. | El sistema impide cerrar la ejecución hasta completar el registro requerido. |

| Campo | Descripción |
| --- | --- |
| Código | CUS17 |
| Nombre | Certificar conformidad del cambio |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-10 – Gestión de Pruebas y Certificación de Conformidad |
| Actor principal | Equipo de Calidad / Testing |
| Actores secundarios | Administrador de Configuración / |


<!-- Página 70 del PDF original -->


|  | Bibliotecario |
| --- | --- |
| Módulo relacionado | Implementación y Validación |
| Propósito | Formalizar que la versión modificada del ECS ha superado las pruebas de integración y validación funcional. |
| Descripción | QA revisa los resultados registrados y, si no existen defectos pendientes, certifica la conformidad del cambio. La certificación queda asociada a la versión del ECS y habilita el Check-In a la Biblioteca Maestra/Soporte. |
| Resultado esperado | El cambio queda certificado por QA y el ECS queda habilitado para su Check-In controlado. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | QA abre los resultados de la validación del cambio. | El sistema muestra todas las pruebas y hallazgos asociados. |
| 2 | Verifica que no existan pruebas fallidas ni no conformidades abiertas. | El sistema habilita la opción de certificación cuando se cumplen las condiciones. |
| 3 | Selecciona “Certificar conformidad”. | El sistema solicita la confirmación de la certificación. |
| 4 | Confirma la certificación. | El sistema registra responsable y fecha y habilita el Check-In del ECS. |

**Flujos Alternativos:**

Código Situación Acción del actor Respuesta del sistema


<!-- Página 71 del PDF original -->


FA01 QA desea revisar Consulta el detalle El sistema evidencia adicional de las pruebas muestra los antes de certificar. registradas. resultados y permite volver a la pantalla de certificación. FA02 La conformidad QA selecciona la El sistema corresponde a un ejecución de re-test vincula la re-test exitoso. aprobada. certificación al ciclo de corrección correspondiente .

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Existen pruebas fallidas. | El sistema impide certificar la conformidad. |
| E02 | Existe una no conformidad abierta. | El sistema mantiene bloqueada la certificación hasta su resolución. |
| E03 | La versión del ECS cambió después de las pruebas. | El sistema invalida la certificación pendiente y solicita una nueva validación. |

| Campo | Descripción |
| --- | --- |
| Código | CUS18 |
| Nombre | Reportar no conformidad |
| Tipo | Alternativo, esencial |
| Requerimiento asociado | RF-10 – Gestión de Pruebas y Certificación de Conformidad |


<!-- Página 72 del PDF original -->


| Actor principal | Equipo de Calidad / Testing |
| --- | --- |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Implementación y Validación |
| Propósito | Registrar formalmente los defectos o hallazgos detectados durante la validación del cambio. |
| Descripción | Cuando una prueba no es satisfactoria, QA registra una no conformidad indicando el hallazgo y su evidencia. El sistema cambia el estado del cambio a corrección y notifica al Desarrollador responsable. |
| Resultado esperado | La no conformidad queda registrada, el cambio pasa a “En Corrección” y el Desarrollador recibe la información necesaria para subsanarla. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | QA identifica un resultado no conforme durante la validación. | El sistema habilita el registro de un hallazgo asociado a la prueba. |
| 2 | Describe el defecto e incorpora la evidencia disponible. | El sistema valida que la información mínima del hallazgo esté completa. |
| 3 | Confirma el reporte de no conformidad. | El sistema registra el hallazgo y lo vincula al ECS y a la Orden de Cambio. |
| 4 | Finaliza el registro. | El sistema actualiza el estado a “En Corrección” y notifica al Desarrollador. |


<!-- Página 73 del PDF original -->


**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | QA detecta varios hallazgos independientes. | Registra cada no conformidad por separado. | El sistema mantiene todos los hallazgos vinculados al mismo ciclo de validación. |
| FA02 | QA incorpora evidencia adicional luego del registro inicial. | Adjunta la nueva evidencia antes de iniciar el re-test. | El sistema actualiza el detalle de la no conformidad sin cambiar su estado. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El hallazgo no contiene descripción suficiente. | El sistema no permite registrar la no conformidad hasta completar la información. |
| E02 | La prueba relacionada no existe o pertenece a otra versión. | El sistema rechaza la asociación y solicita seleccionar el registro correcto. |
| E03 | La no conformidad ya fue cerrada. | El sistema impide modificar su resultado y solicita registrar un nuevo hallazgo si corresponde. |

Campo Descripción Código CUS19


<!-- Página 74 del PDF original -->


| Nombre | Reevaluar y re-testear |
| --- | --- |
| Tipo | Alternativo, esencial |
| Requerimiento asociado | RF-11 – Reevaluación y Re-testeo |
| Actor principal | Equipo de Calidad / Testing |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Implementación y Validación |
| Propósito | Comprobar que las correcciones aplicadas por el Desarrollador solucionen las no conformidades detectadas por QA. |
| Descripción | Después de una corrección, QA vuelve a ejecutar las pruebas relacionadas con los hallazgos. El ciclo puede finalizar con certificación de conformidad o, si el fallo persiste y se agotan los reintentos, derivar al rollback. |
| Resultado esperado | La corrección queda validada y habilita la certificación, o se registra el fallo persistente para iniciar el proceso de reversión. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | QA selecciona una no conformidad cuya corrección fue reportada. | El sistema muestra el hallazgo, la corrección y los resultados previos. |
| 2 | Ejecuta nuevamente las pruebas afectadas. | El sistema registra los resultados del re-test. |
| 3 | Confirma que el defecto fue solucionado. | El sistema marca la no conformidad como subsanada. |


<!-- Página 75 del PDF original -->


# 4. Finaliza el ciclo de re-test. El sistema habilita la

certificación de conformidad del cambio.

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El re-test vuelve a fallar y aún existen reintentos permitidos. | QA registra el resultado fallido y devuelve el hallazgo al Desarrollador. | El sistema inicia un nuevo ciclo de corrección y re-testeo. |
| FA02 | El re-test falla y se agotaron los reintentos definidos. | QA confirma el fallo persistente. | El sistema deriva el cambio al flujo de rollback y cancelación. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existe una corrección registrada para la no conformidad. | El sistema impide iniciar el re-test. |
| E02 | La versión a re-testear no corresponde a la corrección registrada. | El sistema bloquea la ejecución y solicita seleccionar la versión correcta. |
| E03 | No pueden registrarse los resultados del re-test. | El sistema mantiene la no conformidad abierta y permite reintentar el registro. |

Campo Descripción Código CUS20


<!-- Página 76 del PDF original -->


| Nombre | Crear y congelar línea base |
| --- | --- |
| Tipo | Primario, esencial |
| Requerimiento asociado | RF-13 – Gestión de Líneas Base |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Equipo de Calidad / Testing |
| Módulo relacionado | Líneas Base y Rollback |
| Propósito | Establecer una versión estable, identificada y recuperable del proyecto después de integrar un cambio verificado. |
| Descripción | Tras el Check-In de un ECS certificado, el Administrador crea una nueva línea base, asigna un identificador de versión conforme al estándar definido y congela su contenido para impedir modificaciones directas. |
| Resultado esperado | La nueva línea base queda registrada, identificada y congelada como versión estable del proyecto. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona el ECS integrado mediante Check-In. | El sistema verifica que la versión esté registrada y certificada. |
| 2 | Selecciona la opción “Crear línea base”. | El sistema solicita el identificador de versión correspondiente. |
| 3 | Ingresa la versión y confirma la composición de la línea | El sistema valida que el identificador sea único y |


<!-- Página 77 del PDF original -->


base. cumpla el formato configurado.

# 4. Confirma la creación. El sistema congela la línea

base y registra la versión resultante.

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La línea base incluye varios ECS verificados. | El Administrador selecciona los elementos que formarán parte de la versión. | El sistema registra la composición completa de la línea base. |
| FA02 | El Administrador desea revisar la versión anterior antes de crear la nueva. | Consulta el historial de líneas base. | El sistema muestra las versiones existentes y permite regresar al registro. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El identificador de versión ya existe. | El sistema rechaza el registro y solicita una versión distinta. |
| E02 | Uno de los ECS seleccionados no está certificado o no completó Check-In. | El sistema impide congelar la línea base. |
| E03 | La versión no cumple el estándar de versionamiento definido. | El sistema muestra el formato requerido y solicita corregirlo. |

Campo Descripción


<!-- Página 78 del PDF original -->


| Código | CUS21 |
| --- | --- |
| Nombre | Ejecutar rollback en Biblioteca de Trabajo |
| Tipo | Contingencia, esencial |
| Requerimiento asociado | RF-12 – Rollback y Cancelación de Órdenes de Cambio |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Equipo de Calidad / Testing, Ingeniero de Software / Desarrollador |
| Módulo relacionado | Líneas Base y Rollback |
| Propósito | Restaurar el ECS a su estado previo cuando un cambio no puede ser subsanado satisfactoriamente. |
| Descripción | Cuando el re-test falla definitivamente, el Administrador ejecuta el rollback sobre el ECS de la Biblioteca de Trabajo. El sistema recupera la versión anterior al Check-Out y registra la reversión. |
| Resultado esperado | El ECS queda restaurado al estado previo al cambio fallido y preparado para cancelar la Orden de Cambio. |

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador recibe la notificación de re-test no superado. | El sistema muestra la no conformidad persistente y la versión de trabajo afectada. |
| 2 | Selecciona la opción “Ejecutar rollback”. | El sistema identifica la versión previa al Check-Out. |


<!-- Página 79 del PDF original -->


# 3. Confirma la reversión. El sistema restaura el estado

anterior del ECS en la Biblioteca de Trabajo.

# 4. Revisa la confirmación. El sistema registra el rollback

en la trazabilidad y habilita la cancelación de la Orden de Cambio.

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Antes de confirmar, el Administrador desea revisar la versión que será restaurada. | Consulta el detalle de la versión previa. | El sistema muestra su información y permite regresar a la confirmación del rollback. |
| FA02 | La Orden afecta a varios ECS y solo uno requiere reversión. | El Administrador selecciona el ECS afectado. | El sistema ejecuta el rollback únicamente sobre el elemento seleccionado. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existe una versión anterior recuperable del ECS. | El sistema detiene el rollback y genera una alerta para revisión administrativa. |
| E02 | Se detecta una inconsistencia de integridad en la versión a restaurar. | El sistema cancela la reversión y solicita validar la integridad del artefacto. |


<!-- Página 80 del PDF original -->


E03 El rollback es El sistema no habilita interrumpido antes de la cancelación de la finalizar. Orden hasta confirmar la restauración completa.

| Campo | Descripción |
| --- | --- |
| Código | CUS22 |
| Nombre | Cancelar Orden de Cambio |
| Tipo | Contingencia, esencial |
| Requerimiento asociado | RF-12, RF-14 – Rollback, Cancelación y Cierre Formal |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Solicitante, Comité de Control de Cambios (CCB) |
| Módulo relacionado | Líneas Base y Rollback |
| Propósito | Cerrar formalmente una Orden de Cambio cuando el fallo no puede subsanarse y el ECS ya fue restaurado. |
| Descripción | Después de ejecutar el rollback obligatorio, el Administrador cancela la ECN/ECO por fallo no subsanado. El sistema actualiza el estado de la RFC y notifica el resultado al Solicitante. |
| Resultado esperado | La Orden queda cancelada y la Solicitud de Cambio queda cerrada con estado “Cancelado (Fallo No Subsanado)”. |

**Flujo Principal:**


<!-- Página 81 del PDF original -->


| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona la Orden de Cambio asociada al rollback ejecutado. | El sistema verifica que la reversión del ECS haya sido completada. |
| 2 | Selecciona la opción “Cancelar Orden de Cambio”. | El sistema solicita la confirmación y el motivo del cierre. |
| 3 | Confirma la cancelación por fallo no subsanado. | El sistema cancela la ECN/ECO y registra la causal. |
| 4 | Finaliza el cierre. | El sistema actualiza la RFC a “Cancelado (Fallo No Subsanado)” y notifica al Solicitante. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El Administrador requiere revisar la evidencia del re-test fallido. | Consulta los resultados de QA antes de confirmar. | El sistema muestra los hallazgos y permite volver al proceso de cancelación. |
| FA02 | La Orden contiene observaciones adicionales de cierre. | El Administrador registra las observaciones. | El sistema las incorpora al historial de la cancelación. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Se intenta cancelar la Orden antes de ejecutar el rollback requerido. | El sistema bloquea la cancelación. |
| E02 | La Orden ya se | El sistema no permite |


<!-- Página 82 del PDF original -->


encuentra cerrada o repetir la operación. cancelada. E03 No se puede notificar El sistema completa el al Solicitante. cierre y registra la notificación como pendiente de reintento.

| Campo | Descripción |
| --- | --- |
| Código | CUS23 |
| Nombre | Registrar incidencia |
| Tipo | Primario, soporte |
| Requerimiento asociado | RF-15 – Gestión de Incidencias y Soporte |
| Actor principal | Solicitante |
| Actores secundarios | Ingeniero de Software / Desarrollador |
| Módulo relacionado | Incidencias y Soporte |
| Propósito | Permitir registrar una falla o problema detectado en una versión liberada para su seguimiento formal. |
| Descripción | El usuario reporta una incidencia indicando su descripción y la versión afectada. El sistema crea un ticket y permite que el equipo responsable realice el seguimiento o lo derive a una RFC si requiere una modificación. |
| Resultado esperado | La incidencia queda registrada como ticket abierto con un identificador único y disponible para seguimiento. |

**Flujo Principal:**


<!-- Página 83 del PDF original -->


| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El usuario selecciona la opción “Registrar incidencia”. | El sistema muestra el formulario de reporte. |
| 2 | Ingresa la descripción del problema, proyecto y versión afectada. | El sistema valida la información y busca coincidencias básicas con incidencias existentes. |
| 3 | Confirma el registro. | El sistema genera un identificador único y crea el ticket con estado “Abierto”. |
| 4 | Revisa la confirmación del reporte. | El sistema muestra el resumen de la incidencia y la habilita para seguimiento. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El sistema encuentra incidencias similares. | El usuario revisa las sugerencias antes de confirmar. | El sistema permite consultar un ticket existente o continuar con un nuevo registro. |
| FA02 | El reporte es realizado por un miembro del equipo interno. | El Desarrollador registra la incidencia indicando el contexto técnico. | El sistema identifica al reportante y conserva la misma trazabilidad del ticket. |

**Eventos de Excepción:**

Código Evento de excepción Respuesta del sistema E01 No se ingresa una El sistema solicita descripción del completar la


<!-- Página 84 del PDF original -->


|  | problema. | información antes de registrar. |
| --- | --- | --- |
| E02 | La versión afectada no existe en el proyecto. | El sistema solicita seleccionar una versión válida. |
| E03 | Ocurre un error durante la creación del ticket. | El sistema informa que la incidencia no fue registrada y permite reintentar. |

| Campo | Descripción |
| --- | --- |
| Código | CUS24 |
| Nombre | Consultar estado de ticket |
| Tipo | Secundario, consulta |
| Requerimiento asociado | RF-15 – Gestión de Incidencias y Soporte |
| Actor principal | Solicitante |
| Actores secundarios | Analista de Requerimientos / Gestor |
| Módulo relacionado | Incidencias y Soporte |
| Propósito | Permitir al usuario conocer el estado actual y la evolución de una incidencia reportada. |
| Descripción | El Solicitante consulta sus tickets registrados y selecciona una incidencia para visualizar su estado, historial de atención y, cuando corresponda, la RFC derivada. |
| Resultado esperado | El usuario visualiza la información actualizada del ticket y las acciones registradas durante su tratamiento. |

**Flujo Principal:**


<!-- Página 85 del PDF original -->


| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Solicitante accede a la sección de incidencias o tickets. | El sistema lista los tickets asociados al usuario y sus estados. |
| 2 | Selecciona un ticket del listado. | El sistema muestra su descripción, versión afectada, estado e historial. |
| 3 | Revisa las actualizaciones de atención. | El sistema presenta las acciones registradas en orden cronológico. |
| 4 | Consulta la relación con una RFC, si existe. | El sistema muestra el identificador y estado de la Solicitud de Cambio vinculada. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | El usuario desea ver únicamente tickets abiertos. | Aplica el filtro de estado correspondiente. | El sistema actualiza el listado. |
| FA02 | El ticket fue derivado a una RFC. | El usuario selecciona el vínculo de la solicitud. | El sistema muestra el estado disponible de la RFC conforme a sus permisos. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | El ticket solicitado no existe. | El sistema informa que la incidencia no fue encontrada. |
| E02 | El ticket pertenece a otro usuario y no existe autorización de | El sistema deniega el acceso. |


<!-- Página 86 del PDF original -->


consulta. E03 El historial del ticket El sistema muestra el no puede recuperarse. estado conocido e informa la indisponibilidad temporal del detalle.

| Campo | Descripción |
| --- | --- |
| Código | CUS25 |
| Nombre | Derivar incidencia a RFC |
| Tipo | Alternativo, esencial |
| Requerimiento asociado | RF-15 – Gestión de Incidencias y Soporte |
| Actor principal | Analista de Requerimientos / Gestor |
| Actores secundarios | Solicitante |
| Módulo relacionado | Incidencias y Soporte |
| Propósito | Convertir una incidencia que requiere modificar un ECS en una Solicitud de Cambio formal. |
| Descripción | El Analista revisa el ticket y, cuando determina que su solución exige un cambio de configuración, deriva la incidencia a una nueva RFC. El sistema mantiene el vínculo entre ambos registros. |
| Resultado esperado | Se crea una RFC asociada a la incidencia y el ticket pasa a estado de tratamiento mediante el flujo formal de cambios. |

**Flujo Principal:**


<!-- Página 87 del PDF original -->


| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Analista selecciona una incidencia abierta. | El sistema muestra el detalle, la versión afectada y su historial. |
| 2 | Determina que la solución requiere modificar un ECS. | El sistema habilita la opción “Derivar incidencia a RFC”. |
| 3 | Confirma la derivación y completa la información inicial del cambio. | El sistema crea una nueva RFC vinculada al ticket original. |
| 4 | Finaliza la derivación. | El sistema actualiza la incidencia a “En Tratamiento” y muestra el identificador de la RFC generada. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | La incidencia puede resolverse sin modificar un ECS. | El Analista decide mantenerla dentro del flujo de soporte. | El sistema no crea una RFC y conserva el ticket para atención directa. |
| FA02 | La incidencia ya está relacionada con una RFC existente. | El Analista selecciona la solicitud correspondiente. | El sistema vincula el ticket con la RFC existente sin generar una nueva. |

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | Ya existe una RFC activa vinculada a la incidencia. | El sistema evita crear una solicitud duplicada. |
| E02 | La incidencia se | El sistema impide la |


<!-- Página 88 del PDF original -->


encuentra cerrada. derivación hasta que corresponda reabrirla. E03 Falta identificar el El sistema solicita ECS o proyecto completar los datos afectado. antes de generar la RFC.

| Campo | Descripción |
| --- | --- |
| Código | CUS26 |
| Nombre | Validar integridad (checksum) |
| Tipo | Secundario, control |
| Requerimiento asociado | RF-17, RNF-03 – Auditoría e Integridad |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Comité de Control de Cambios (CCB) |
| Módulo relacionado | Trazabilidad, Auditoría y Reportes |
| Propósito | Comprobar que un artefacto almacenado no haya sido alterado respecto del valor de integridad registrado. |
| Descripción | El Administrador selecciona un ECS o una versión de línea base y solicita validar su integridad. El sistema calcula el checksum SHA-256 actual y lo compara con el valor almacenado en el registro de configuración. |
| Resultado esperado | El sistema informa que el artefacto está “Íntegro” o genera una alerta de |


<!-- Página 89 del PDF original -->


integridad cuando los valores no coinciden.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El Administrador selecciona un ECS o una versión almacenada. | El sistema muestra la información del artefacto y su checksum registrado. |
| 2 | Solicita ejecutar la validación de integridad. | El sistema calcula el checksum SHA-256 del artefacto actual. |
| 3 | Espera el resultado de la comparación. | El sistema compara el valor calculado con el checksum almacenado. |
| 4 | Consulta el resultado. | El sistema muestra “Íntegro” cuando ambos valores coinciden y registra la validación. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Los checksums no coinciden. | El Administrador revisa la alerta generada. | El sistema marca una “Alerta de integridad” y registra el evento para auditoría. |
| FA02 | Se desea validar varios ECS de una línea base. | El Administrador selecciona los elementos correspondientes. | El sistema ejecuta la comprobación individual de cada artefacto y presenta los resultados. |

**Eventos de Excepción:**


<!-- Página 90 del PDF original -->


| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existe un checksum previo para el artefacto. | El sistema informa que no es posible efectuar la comparación. |
| E02 | El artefacto no puede ser leído o localizado. | El sistema registra el error de validación y no emite resultado de integridad. |
| E03 | La operación de cálculo es interrumpida. | El sistema informa que la validación no fue completada y permite reintentar. |

| Campo | Descripción |
| --- | --- |
| Código | CUS27 |
| Nombre | Auditar acciones del sistema |
| Tipo | Secundario, control |
| Requerimiento asociado | RF-16, RF-17 – Trazabilidad de Configuración y Auditoría |
| Actor principal | Comité de Control de Cambios (CCB) |
| Actores secundarios | Administrador de Configuración / Bibliotecario |
| Módulo relacionado | Trazabilidad, Auditoría y Reportes |
| Propósito | Permitir reconstruir las acciones críticas realizadas durante el ciclo de vida de la configuración. |
| Descripción | El usuario autorizado consulta el registro de auditoría mediante filtros de fecha, usuario, rol, proyecto o |


<!-- Página 91 del PDF original -->


tipo de acción. El sistema muestra los eventos y sus relaciones con ECS, RFC, Órdenes de Cambio y líneas base. Resultado esperado Se presenta un historial auditable de las acciones realizadas y los elementos de configuración afectados.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El usuario accede al módulo de auditoría. | El sistema presenta los filtros de consulta disponibles. |
| 2 | Define fecha, usuario, rol, proyecto o tipo de acción. | El sistema busca los eventos que cumplen los criterios. |
| 3 | Selecciona un evento del listado. | El sistema muestra responsable, fecha, acción ejecutada y ECS afectado. |
| 4 | Consulta sus relaciones de trazabilidad. | El sistema presenta las RFC, Órdenes de Cambio y líneas base vinculadas al evento. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Se requiere auditar específicamente un ECS. | El usuario filtra por identificador del elemento. | El sistema presenta únicamente los eventos relacionados con dicho ECS. |
| FA02 | Se requiere revisar la integridad de un artefacto durante la auditoría. | El usuario solicita la validación correspondiente. | El sistema deriva a la validación de checksum y registra el |


<!-- Página 92 del PDF original -->


resultado en auditoría.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existen eventos para los filtros seleccionados. | El sistema informa que no se encontraron resultados. |
| E02 | El usuario no posee permisos de auditoría. | El sistema deniega el acceso y registra el intento. |
| E03 | El registro histórico está temporalmente indisponible. | El sistema informa el error y permite reintentar la consulta. |

| Campo | Descripción |
| --- | --- |
| Código | CUS28 |
| Nombre | Generar reportes de estado |
| Tipo | Secundario, reporte |
| Requerimiento asociado | RF-18 – Generación de Reportes |
| Actor principal | Administrador de Configuración / Bibliotecario |
| Actores secundarios | Comité de Control de Cambios (CCB), Analista de Requerimientos / Gestor |
| Módulo relacionado | Trazabilidad, Auditoría y Reportes |
| Propósito | Generar información consolidada sobre el flujo de cambios, inventario de ECS y actas de cambios de los proyectos. |
| Descripción | El usuario selecciona el tipo de |


<!-- Página 93 del PDF original -->


reporte y define filtros como proyecto, periodo o estado. El sistema consulta la información de configuración y trazabilidad, genera el informe y habilita su exportación. Resultado esperado El reporte solicitado queda generado con información actualizada y disponible para consulta y exportación.

**Flujo Principal:**

| N.º | Acción del actor | Respuesta del sistema |
| --- | --- | --- |
| 1 | El usuario accede al módulo “Reportes”. | El sistema muestra los tipos de reportes disponibles. |
| 2 | Selecciona el tipo de informe y define proyecto, periodo u otros filtros. | El sistema valida los criterios ingresados. |
| 3 | Selecciona la opción “Generar reporte”. | El sistema consulta y consolida los registros que cumplen los filtros. |
| 4 | Revisa el resultado y solicita la exportación cuando corresponde. | El sistema muestra el reporte y genera el archivo en el formato habilitado. |

**Flujos Alternativos:**

| Código | Situación | Acción del actor | Respuesta del sistema |
| --- | --- | --- | --- |
| FA01 | Se requiere un inventario de ECS de un proyecto específico. | El usuario selecciona “Inventario de ECS” y el proyecto correspondiente. | El sistema presenta ECS, versiones, estados y bibliotecas registradas. |
| FA02 | Se requiere un reporte del flujo de cambios por | El usuario selecciona el rango de fechas y los | El sistema consolida las RFC |


<!-- Página 94 del PDF original -->


periodo. estados requeridos. registradas, aprobadas, rechazadas, canceladas y cerradas.

**Eventos de Excepción:**

| Código | Evento de excepción | Respuesta del sistema |
| --- | --- | --- |
| E01 | No existen datos para los filtros seleccionados. | El sistema informa que el reporte no contiene registros. |
| E02 | Ocurre un error durante la exportación. | El sistema conserva el reporte generado y permite reintentar la exportación. |
| E03 | El usuario solicita información de un proyecto sin autorización. | El sistema deniega el acceso a esos datos y no los incluye en el reporte. |


<!-- Página 95 del PDF original -->


## 6.2. Modelo Lógico


![Página 95 - diagrama o elemento visual del documento original](assets/page-095.png)


<!-- Página 96 del PDF original -->


### 6.2.1. Diagrama de Secuencia

**Diagrama de secuencia del caso de uso CUS01: Gestionar usuarios y roles**

Fuente: Elaboración propia.


![Página 96 - diagrama o elemento visual del documento original](assets/page-096.png)


<!-- Página 97 del PDF original -->


**Diagrama de secuencia del caso de uso CUS02: Crear y administrar proyectos**

Fuente: Elaboración propia.


![Página 97 - diagrama o elemento visual del documento original](assets/page-097.png)


<!-- Página 98 del PDF original -->


**Diagrama de secuencia del caso de uso CUS04: Registrar Solicitud de Cambio**

(RFC) Fuente: Elaboración propia.


![Página 98 - diagrama o elemento visual del documento original](assets/page-098.png)


<!-- Página 99 del PDF original -->


**Diagrama de secuencia del caso de uso CUS05: Validar y clasificar la solicitud**

Fuente: Elaboración propia.


![Página 99 - diagrama o elemento visual del documento original](assets/page-099.png)


<!-- Página 100 del PDF original -->


**Diagrama de secuencia del caso de uso CUS06: Realizar análisis de impacto**

técnico Fuente: Elaboración propia.


![Página 100 - diagrama o elemento visual del documento original](assets/page-100.png)


<!-- Página 101 del PDF original -->


**Diagrama de secuencia del caso de uso CUS07: Evaluar viabilidad y**

aprobar/rechazar Fuente: Elaboración propia.


![Página 101 - diagrama o elemento visual del documento original](assets/page-101.png)


<!-- Página 102 del PDF original -->


**Diagrama de secuencia del caso de uso CUS08: Emitir Orden de Cambio**

(ECN/ECO) Fuente: Elaboración propia.


![Página 102 - diagrama o elemento visual del documento original](assets/page-102.png)


<!-- Página 103 del PDF original -->


**Diagrama de secuencia del caso de uso CUS09: Registrar Elemento de**

Configuración (ECS) Fuente: Elaboración propia.


![Página 103 - diagrama o elemento visual del documento original](assets/page-103.png)


<!-- Página 104 del PDF original -->


**Diagrama de secuencia del caso de uso CUS10: Efectuar Check-Out de**

elementos de configuración Fuente: Elaboración propia.

**Diagrama de secuencia del CUS11: Aplicar bloqueo de sincronización**

Fuente: Elaboración propia.


![Página 104 - diagrama o elemento visual del documento original](assets/page-104.png)


<!-- Página 105 del PDF original -->


**Diagrama de secuencia del caso de uso CUS12: Efectuar Check-In de elementos**

de configuración Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS13: Consultar historial de versiones**

Fuente: Elaboración propia.


![Página 105 - diagrama o elemento visual del documento original](assets/page-105.png)


<!-- Página 106 del PDF original -->


**Diagrama de secuencia del caso de uso CUS14: Implementar cambio en el**

Elemento de Configuración (ECS) Fuente: Elaboración propia.


![Página 106 - diagrama o elemento visual del documento original](assets/page-106.png)


<!-- Página 107 del PDF original -->


**Diagrama de secuencia del caso de uso CUS15: Ejecutar pruebas unitarias**

locales Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS16: Ejecutar pruebas de integración**

Fuente: Elaboración propia.


![Página 107 - diagrama o elemento visual del documento original](assets/page-107.png)


<!-- Página 108 del PDF original -->


**Diagrama de secuencia caso de uso CUS17: Certificar conformidad del cambio**

Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS18: Reportar no conformidad**

Fuente: Elaboración propia.


![Página 108 - diagrama o elemento visual del documento original](assets/page-108.png)


<!-- Página 109 del PDF original -->


**Diagrama de secuencia del caso de uso CUS19: Reevaluar y re-testear**

Fuente: Elaboración propia.


![Página 109 - diagrama o elemento visual del documento original](assets/page-109.png)


<!-- Página 110 del PDF original -->


**Diagrama de secuencia del caso de uso CUS20: Crear y congelar línea base**

Fuente: Elaboración propia.

**Diagrama de secuencia del CUS21: Ejecutar rollback en Biblioteca de Trabajo**

Fuente: Elaboración propia.


![Página 110 - diagrama o elemento visual del documento original](assets/page-110.png)


<!-- Página 111 del PDF original -->


**Diagrama de secuencia del caso de uso CUS22: Cancelar Orden de Cambio**

Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS23: Registrar incidencia**

Fuente: Elaboración propia.


![Página 111 - diagrama o elemento visual del documento original](assets/page-111.png)


<!-- Página 112 del PDF original -->


**Diagrama de secuencia del caso de uso CUS24: Consultar estado de ticket**

Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS25: Derivar incidencia a RFC**

Fuente: Elaboración propia.


![Página 112 - diagrama o elemento visual del documento original](assets/page-112.png)


<!-- Página 113 del PDF original -->


**Diagrama de secuencia del CUS26: Validar integridad mediante checksum**

Fuente: Elaboración propia.

**Diagrama de secuencia del caso de uso CUS27: Auditar acciones del sistema**

Fuente: Elaboración propia.


![Página 113 - diagrama o elemento visual del documento original](assets/page-113.png)


<!-- Página 114 del PDF original -->


**Diagrama de secuencia del caso de uso CUS28: Generar reportes de estado**

Nota: Elaboración Propia


![Página 114 - diagrama o elemento visual del documento original](assets/page-114.png)


<!-- Página 115 del PDF original -->


### 6.2.2. Diagrama de Clases

Nota: Elaboración Propia

![Página 115 - diagrama de clases del documento original](assets/page-115.png)


<!-- Página 116 del PDF original -->


# Conclusiones

Estructuración Formal del Alcance y Gobernanza SCM: Se consolidó con precisión la especificación de requerimientos funcionales (RF) y no funcionales (RNF) bajo los lineamientos del estándar internacional ISO/IEC/IEEE 29148 e ISO/IEC 25010. Esta delimitación erradica la informalidad y la dispersión operativa previa en ÉXODO S.A.C., proporcionando un marco formal para la administración controlada del ciclo de vida de los Elementos de Configuración de Software (ECS) . Estandarización del Flujo de Control de Cambios y Segregación de Roles: La definición del flujo formal de Solicitudes de Cambio (RFC), desde su registro y clasificación hasta la evaluación técnica y aprobación por el Comité de Control de Cambios (CCB), asegura que ninguna modificación sea integrada de forma arbitraria . La posterior emisión de Órdenes de Cambio (ECN/ECO) y la asignación rigurosa de responsabilidades (Solicitante, Analista, Arquitecto, CCB, Administrador SCM, Desarrollador y QA) garantizan una estricta segregación de funciones . Control de Concurrencia, Gestión de Bibliotecas e Integridad: Se estableció el esquema de tres niveles de bibliotecas (Trabajo, Soporte y Maestra) operado mediante transiciones estrictas de Check-Out y Check-In. La incorporación obligatoria de bloqueos de sincronización elimina definitivamente los incidentes de sobreescritura y pérdida de código causados por modificaciones concurrentes , mientras que el cálculo de sumas de verificación criptográficas (SHA-256) garantiza la inalterabilidad e integridad técnica de los artefactos liberados. Trazabilidad Total, Gestión de Líneas Base y Capacidad de Rollback: El sistema proporciona mecanismos robustos para congelar versiones estables como Líneas Base (baselines) identificadas unívocamente tras la certificación de conformidad de QA. Asimismo, la formalización de protocolos de reversión (rollback) en la Biblioteca de Trabajo permite mitigar oportunamente fallos no subsanados en etapas de prueba antes de comprometer los entornos en producción, reduciendo drásticamente el retrabajo y las fallas operativas. Cumplimiento Normativo y Preparación para el Diseño Lógico: La especificación resguarda los derechos de propiedad intelectual de ÉXODO S.A.C. y de sus clientes


<!-- Página 117 del PDF original -->


conforme al Decreto Legislativo N° 822 (Ley sobre el Derecho de Autor) y asegura la confidencialidad de la información gestionada en cumplimiento de la Ley N° 29733 . El modelado detallado de los casos de uso (CUS01 al CUS28) con sus respectivos flujos principales, alternativos y de excepción minimiza ambigüedades funcionales, sirviendo de base sólida para las etapas de arquitectura lógica, diseño de persistencia e implementación .


<!-- Página 118 del PDF original -->


# Bibliografía

- Congreso de la República del Perú. (2011). Ley N° 29733: Ley de Protección

de Datos Personales. Diario Oficial El Peruano, 3 de julio de 2011.

- IEEE Computer Society. (1998). IEEE Std 830-1998: IEEE Recommended

Practice for Software Requirements Specifications. IEEE Standards Association.

- ISO/IEC/IEEE. (2018). ISO/IEC/IEEE 29148:2018 Systems and software

engineering - Life cycle processes - Requirements engineering. International Organization for Standardization.

- Pressman, R. S., & Maxim, B. R. (2020). Ingeniería del software: Un enfoque

práctico (9.ª ed.). McGraw-Hill Interamericana.

- Sommerville, I. (2016). Software Engineering (10.ª ed.). Pearson Education.

- Stallings, W. (2017). Cryptography and Network Security: Principles and

Practice (7.ª ed.). Pearson.