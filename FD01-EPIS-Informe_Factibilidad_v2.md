# 1. Descripción del Proyecto

## 1.1. Nombre del proyecto

La denominación oficial del proyecto es:

**Sistema de Gestión de Configuración de Software - TraceFlow SCM**

El acrónimo oficial adoptado para todas las referencias técnicas, operativas y documentales es **TraceFlow SCM**.

---

## 1.2. Duración del proyecto

En el análisis de temporalidad del proyecto se distinguen tres horizontes claramente diferenciados:

1. **Duración académica del desarrollo:** Comprende el semestre académico **2026-II** de la Escuela Profesional de Ingeniería de Sistemas (EPIS) de la Universidad Privada de Tacna. En los cálculos de costeo y depreciación preliminares registrados en el repositorio se establece un ciclo lectivo de desarrollo de **3.5 meses** (aproximadamente 14 a 16 semanas efectivas de trabajo).
2. **Horizonte de evaluación económica y financiera:** Definido formalmente para un periodo proyectado de **5 años (2026-2030)**, utilizado como marco temporal para el análisis de flujos de caja operativos y evaluación de rentabilidad de la inversión.
3. **Duración real de la implementación corporativa en ÉXODO S.A.C.:** **PENDIENTE DE VALIDACIÓN**. La documentación actual del repositorio no incluye un cronograma formal de despliegue, fases de prueba piloto, marcha blanca ni acta de inicio contractual que especifique la fecha de culminación del despliegue en los servidores de la empresa beneficiaria.

---

## 1.3. Descripción

**ÉXODO S.A.C.** es una empresa consultora peruana de tecnologías de la información dedicada al desarrollo y mantenimiento de software a medida para clientes de diversos sectores productivos. La organización estructura sus actividades en tres niveles: estratégico (Gerencia de Proyectos), táctico (Jefaturas de Proyecto) y operativo (equipos de desarrollo de software, aseguramiento de la calidad y soporte técnico).

El diagnóstico institucional evidencia que ÉXODO S.A.C. opera bajo un esquema empírico carente de un sistema formal de Gestión de la Configuración del Software (SCM). El código fuente, los esquemas de bases de datos y la documentación técnica de los proyectos se encuentran dispersos en los discos duros locales de los consultores y en cuentas individuales en diversas plataformas de almacenamiento. Las modificaciones se coordinan por canales informales (mensajería instantánea y acuerdos verbales) sin registro de trazabilidad, propiciando incidentes críticos de sobreescritura durante el trabajo concurrente, entregas a producción sin validación formal de calidad y la ausencia de líneas base estables a las cuales retornar ante contingencias operativas. Esta situación genera pérdidas recurrentes de tiempo y sobrecostos por retrabajo, cuya meta de reducción proyectada en el SRS es del 25% del tiempo del equipo técnico (`FD03`, Sección 3.2.2).

**TraceFlow SCM** es una solución de software web centralizada diseñada específicamente para gobernar, automatizar y estandarizar los procesos de control de configuración en entornos de consultoría tecnológica, adoptando como marcos metodológicos de buenas prácticas los estándares internacionales **IEEE Std 828** e **ISO/IEC/IEEE 12207**.

El propósito fundamental de TraceFlow SCM es garantizar la inmutabilidad, trazabilidad bidireccional y reproducibilidad de cada activo del ciclo de vida del software, erradicando las pérdidas de información y optimizando la productividad de los equipos de desarrollo.

Entre sus principales capacidades funcionales y técnicas destacan:
- Gestión integral del ciclo de vida de Solicitudes de Cambio (RFC) mediante flujos gobernados de aprobación y emisión de Órdenes de Cambio (ECN/ECO).
- Administración de activos bajo una arquitectura física y lógica de tres bibliotecas con segregación de madurez: Biblioteca de Trabajo (*Work*), Biblioteca de Soporte (*Support*) y Biblioteca Maestra (*Master*).
- Control de concurrencia basado en bloqueos de sincronización automáticos durante operaciones de Check-Out, impidiendo modificaciones simultáneas y sobreescrituras accidentales.
- Verificación criptográfica de integridad mediante algoritmos de hashing SHA-256 (`RNF-03`), certificando que los archivos no sufran alteraciones no autorizadas ni corrupción.
- Modelo de seguridad basado en roles (RBAC) con segregación estricta de funciones entre 7 perfiles canónicos de usuario.
- Congelamiento formal de Líneas Base (*Baselines*) etiquetadas con versionamiento semántico y protocolos automatizados de reversión (*rollback*) ante fallos no subsanados en etapas de prueba.

---

## 1.4. Objetivos

### 1.4.1. Objetivo general

Diseñar, evaluar la viabilidad integral y especificar la plataforma de software **TraceFlow SCM** para sistematizar, estandarizar y gobernar los procesos de Gestión de la Configuración del Software en la empresa consultora **ÉXODO S.A.C.**, asegurando la inmutabilidad, trazabilidad y control de los Elementos de Configuración de Software (ECS) a lo largo de su ciclo de vida productivo.

### 1.4.2. Objetivos Específicos

1. **Centralización de ECS:** Implementar un repositorio institucional estructurado y seguro que permita catalogar, identificar y resguardar de forma unificada el código fuente, los esquemas relacionales de base de datos y la documentación técnica de los proyectos de ÉXODO S.A.C.
2. **Control formal de cambios:** Establecer un flujo estandarizado para la recepción, análisis de impacto técnico y aprobación de Solicitudes de Cambio (RFC), asegurando que ninguna modificación sea integrada sin previa evaluación técnica y autorización formal documentada.
3. **Gestión jerárquica de bibliotecas y versionamiento:** Administrar el ciclo de madurez de los artefactos mediante la transferencia controlada entre tres bibliotecas aisladas (Trabajo, Soporte, Maestra) a través de operaciones auditables de Check-Out y Check-In.
4. **Congelamiento de Líneas Base (Baselines):** Proveer mecanismos formales para congelar versiones estables de los proyectos de software identificadas bajo versionamiento semántico (mayor.menor.parche), asegurando puntos de recuperación estables ante incidencias en producción.
5. **Trazabilidad bidireccional continua:** Garantizar la reconstrucción histórica del origen, justificación, responsable y orden de cambio asociada a cada modificación en los ECS, permitiendo atender auditorías técnicas en un plazo inferior a 24 horas.
6. **Segregación de funciones y control de concurrencia:** Delimitar las responsabilidades de acceso mediante un esquema RBAC de 7 roles canónicos e instrumentar bloqueos de sincronización transaccionales que eliminen los conflictos de edición concurrente.
7. **Aseguramiento de la Calidad (QA):** Establecer como compuerta técnica obligatoria la ejecución de pruebas de integración y validación funcional en la Biblioteca de Soporte, condicionando cualquier integración a la Biblioteca Maestra a la emisión de una Certificación de Conformidad.
8. **Validación formal de entregas y conformidad:** Establecer mecanismos de verificación y control de conformidad previos a la liberación final de los cambios autorizados, garantizando la satisfacción de los requerimientos y compromisos asumidos con los clientes de ÉXODO S.A.C.
9. **Integridad criptográfica y auditoría:** Implementar mecanismos automatizados de cálculo y contrastación de sumas de verificación SHA-256 sobre cada archivo gestionado, registrando todas las transacciones críticas en bitácoras inmutables.

---

# 2. Riesgos

La identificación de riesgos se fundamenta en las restricciones operativas diagnosticadas en ÉXODO S.A.C., la arquitectura técnica propuesta y las características del equipo de desarrollo C-SharkTeam.

| ID | Riesgo | Tipo | Probabilidad | Impacto | Medida de mitigación |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **RSK-01** | **Resistencia cultural al flujo formal de cambios:** Resistencia de los consultores a abandonar prácticas empíricas de edición directa y percibir el registro de RFC como una sobrecarga burocrática. | Operativo / Adopción | Alta | Alto | Conducir capacitaciones orientadas al beneficio individual (protección contra sobreescritura accidental), asegurar una interfaz intuitiva con curva de aprendizaje menor a 3 horas (`RNF-04`) y evaluar operativamente canales ágiles de tramitación para cambios rutinarios. |
| **RSK-02** | **Infraestructura de hardware no homologada:** Discrepancia entre las capacidades reales de cómputo/red de los servidores de ÉXODO S.A.C. y los requisitos del motor SCM (**PENDIENTE DE VALIDACIÓN**). | Infraestructura / Técnico | Media | Alto | Realizar un inventario técnico *in situ* de servidores; modularizar la arquitectura mediante servicios desacoplados o virtualización ligera evaluados en el diseño técnico con capacidad de despliegue híbrido on-premise / PaaS. |
| **RSK-03** | **Incertidumbre en flujos financieros y costos:** Falta de datos corporativos auditados sobre los ahorros reales por retrabajo y subvaluación del CAPEX en la formulación preliminar del SRS. | Económico | Alta | Alto | Formular colegiadamente el flujo de caja descontado neto corporativo con la Gerencia de ÉXODO S.A.C., reestructurando la planilla de desarrollo para integrar a los 4 miembros del C-SharkTeam. |
| **RSK-04** | **Sobrecarga de concurrencia y contención de bloqueos:** Bloqueos transaccionales prolongados o deadlocks sobre ECS transversales compartidos por varios proyectos en la Biblioteca de Trabajo. | Concurrencia / Técnico | Media | Alto | Implementar timeouts de bloqueo configurables, pruebas unitarias de estrés transaccional y habilitar mecanismos de liberación forzada justificada bajo autorización del Administrador de Configuración. |
| **RSK-05** | **Vulneración de confidencialidad de datos:** Acceso no autorizado o fuga de código fuente y documentación propietaria de clientes de ÉXODO S.A.C. | Seguridad | Baja | Alto | Aplicación estricta de políticas de control de acceso RBAC (`RF-01`), comunicaciones cifradas mediante protocolos HTTPS y SSH (`RNF-01`), y firmas criptográficas inalterables en bitácoras de auditoría (`RF-17`). |
| **RSK-06** | **Saturación de almacenamiento por retención indiscriminada:** Crecimiento desmedido del volumen de almacenamiento por acumulación indefinida de versiones intermedias y artefactos temporales en Soporte. | Almacenamiento | Media | Medio | Definir directivas automatizadas de purga para artefactos de compilación temporal, algoritmos de deduplicación de archivos y migración de Líneas Base históricas hacia almacenamiento frío (*cold storage*). |
| **RSK-07** | **Degradación de disponibilidad en entregas críticas:** Caída de servidores durante etapas de integración previa a entregas contractuales con clientes. | Disponibilidad | Baja | Alto | Programación automatizada de respaldos diarios del repositorio (`RNF-09`), arquitectura modular orientada a alta mantenibilidad (`RNF-08`) y acuerdos de nivel de servicio con proveedores PaaS para uptime del 99.9% (`RNF-02`). |
| **RSK-08** | **Contaminación por licenciamiento de código abierto:** Uso inadvertido de librerías de terceros con licencias de *copyleft recíproco estricto* (ej. GPL v3) que comprometan la propiedad intelectual de la empresa. | Legal / Técnico | Media | Alto | Ejecutar auditorías de dependencias de software con herramientas de escaneo automatizado para garantizar exclusivamente el uso de licencias permisivas (MIT, Apache 2.0, BSD). |

---

# 3. Análisis de la Situación actual

## 3.1. Planteamiento del problema

El estado operativo actual (**AS-IS**) de la empresa consultora **ÉXODO S.A.C.** se caracteriza por la administración empírica y desarticulada de sus activos de software. La relación entre causas, problema central y consecuencias se desglosa a continuación:

### 1. Causas Raíz Diagnosticadas
- **Almacenamiento Disperso y Descentralizado:** El código fuente, los esquemas de bases de datos y la documentación residen de forma atomizada en los equipos personales de los consultores y en cuentas individuales en servicios de almacenamiento comercial sin políticas corporativas unificadas.
- **Control de Versiones Empírico e Informal:** Inexistencia de un estándar formal de versionamiento; se emplean nomenclaturas arbitrarias y manuales sobre carpetas y archivos comprimidos (ejemplo: `Cliente_Modulo_Final_v2.zip`), generando confusión inmediata respecto a cuál es la versión vigente.
- **Canales Informales de Comunicación:** Los requerimientos de ajuste o corrección de defectos se coordinan mediante mensajería instantánea (chat), correos electrónicos personales o acuerdos verbales, sin registro formal de solicitud, justificación ni aprobación técnica previa.
- **Ausencia de Mecanismos de Exclusión Mutua:** No existen bloqueos de sincronización transaccionales, lo que propicia que múltiples consultores modifiquen simultáneamente los mismos archivos fuente.
- **Inexistencia de Líneas Base y Entornos Aislados:** No se definen puntos de congelamiento formal de versiones. Todo el trabajo se mezcla sin separación entre entornos de desarrollo, pruebas e integración definitiva.
- **Carencia de Certificación Formal de Calidad:** Las modificaciones son desplegadas a los ambientes de producción de los clientes sin validación previa, pruebas formales de integración ni inspección independiente de calidad.

### 2. Problema Central
**Desarticulación operacional e incapacidad de gobernar el ciclo de vida de los Elementos de Configuración de Software en ÉXODO S.A.C.**, generando descontrol sobre las versiones liberadas, conflictos de concurrencia y vulnerabilidad ante contingencias técnicas.

### 3. Consecuencias e Impactos Identificados
- **Pérdida Crítica de Avances por Sobreescritura:** La concurrencia desordenada provoca la eliminación involuntaria de líneas de código y funcionalidades previamente implementadas por otros desarrolladores al integrar archivos de forma manual.
- **Retrabajo Sistémico:** Los equipos de desarrollo experimentan un consumo improductivo continuo de horas de labor técnica en resolver conflictos de código, conciliar versiones divergentes y reconstruir código perdido por sobreescrituras accidentales. El SRS formaliza como meta de negocio reducir este retrabajo en un 25% (`FD03`, Sección 3.2.2), manteniéndose la medición cuantitativa histórica de dicha línea base en ÉXODO S.A.C. como **PENDIENTE DE VALIDACIÓN** al no existir registros de control de horas en el repositorio.
- **Imposibilidad de Retorno Estable (Rollback):** Ante incidentes críticos o fallos catastróficos en producción, la ausencia de Líneas Base auditadas y congeladas impide ejecutar un retorno seguro a un estado operativo anterior en plazos oportunos.
- **Incertidumbre e Incumplimiento Contractual:** Imposibilidad de certificar fehacientemente a los clientes qué versión de software fue entregada, en qué fecha y bajo qué autorización técnica, generando disputas contractuales y deterioro de la confianza institucional.

---

## 3.2. Consideraciones de hardware y software

A continuación se establece la diferenciación estricta entre la infraestructura disponible documentada, la infraestructura requerida y los componentes propuestos, evitando atribuir capacidades no verificadas a la empresa beneficiaria:

### Hardware actual documentado
- **Servidores de ÉXODO S.A.C.:** **PENDIENTE DE VALIDACIÓN**. Si bien en la Sección 3.5.1 del documento consolidado SRS (`FD03-EPIS-Informe_SRS.md`) se indica narrativamente que *"ÉXODO S.A.C. cuenta con servidores propios y acceso a servicios en la nube"*, el repositorio no contiene ninguna especificación técnica verificable sobre número de procesadores, arquitectura de CPU, cantidad de memoria RAM, capacidad y tecnología de almacenamiento (HDD/SSD), topología de red ni mecanismos de redundancia eléctrica.
- **Estaciones de trabajo de los consultores de ÉXODO S.A.C.:** **PENDIENTE DE VALIDACIÓN TÉCNICA / INFERIDO OPERATIVAMENTE**. Se asume operativamente que los consultores disponen de computadoras personales o corporativas para sus tareas habituales de codificación, pero el repositorio no contiene un inventario técnico *in situ* con especificaciones auditadas de dichos equipos (CPU, RAM, almacenamiento). *Nota documental:* La única infraestructura de clientes verificada documentalmente en el repositorio corresponde a los equipos personales de los 4 integrantes del equipo de desarrollo C-SharkTeam (`FD03`, Sección 3.5.1).

### Hardware requerido o propuesto
- **Servidor Central de Aplicaciones y Base de Datos (On-Premise o Instancia Virtual Dedicada):** **PROPUESTO**.
  - Procesador: Arquitectura x86-64 con un mínimo de 4 núcleos (quad-core) a 2.5 GHz o superior.
  - Memoria RAM: Mínimo 8 GB (recomendado 16 GB para soportar concurrencia de más de 50 proyectos simultáneos, `RNF-05`).
  - Almacenamiento: Mínimo 100 GB en unidades de estado sólido (SSD) en configuración RAID 1 o RAID 5 para alta disponibilidad y tolerancia a fallos.
  - Conectividad: Interfaz de red Gigabit Ethernet (1000 Mbps) con conexión a Internet de banda ancha simétrica y dirección IP estática.
- **Terminales Cliente de Consultores:** **PROPUESTO / ESTIMADO REFERENCIAL**.
  - Procesador dual-core x86-64 a 2.0 GHz, 8 GB de memoria RAM y 20 GB de espacio libre en disco para clonación de bibliotecas de trabajo locales.

### Software actual documentado
- **Entornos de Desarrollo Integrado (IDE):** **DISPONIBLE Y VERIFICADO**. Los equipos de ÉXODO S.A.C. utilizan de forma cotidiana herramientas de desarrollo estándar del mercado: Visual Studio Code, IntelliJ IDEA y Android Studio (`RNF-07`).
- **Sistemas de Control de Versiones Base:** **DISPONIBLE Y VERIFICADO**. El personal técnico posee familiaridad y dominio operativo básico del software Git como herramienta de versionamiento distribuido (`FD03`, Sección 3.5.1).
- **Navegadores Web:** **DISPONIBLE Y VERIFICADO**. Navegadores modernos compatibles con estándares HTML5/ECMAScript (Google Chrome, Mozilla Firefox, Microsoft Edge).

### Software / tecnologías requeridas o propuestas
- **Tecnologías Requeridas (Principios Arquitecturales y Normativos del Dominio SCM):** **REQUERIDO**.
  - Sistema Operativo de Servidor: Sistema operativo multiusuario de nivel empresarial (entorno Linux o Windows Server).
  - Motor de Base de Datos Relacional: Sistema gestor con soporte pleno para transacciones ACID, integridad referencial y procedimientos de almacenamiento.
  - Algoritmo Criptográfico: Implementación estándar de funciones de resumen criptográfico SHA-256 (`RNF-03`).
  - Protocolos de Comunicación Segura: HTTPS con soporte de cifrado TLS 1.3 y SSH v2 para operaciones de transferencia segura de código (`RNF-01`).
- **Tecnologías Propuestas (Sujetas a Optimización y Aprobación Técnica):** **PROPUESTO**.
  - Opciones de Sistema Operativo: Distribuciones Linux empresariales (Ubuntu Server 22.04 LTS / Rocky Linux 9) o Windows Server 2022.
  - Opciones de Base de Datos Relacional: PostgreSQL 15+ para entorno productivo o SQLite 3 en fase de pruebas locales.
  - Backend: Python con framework FastAPI/Django REST o Node.js con TypeScript y Express.
  - Plataforma de Infraestructura como Servicio / PaaS: Render y Supabase como alternativas evaluadas para alojamiento preliminar en la nube.
- **Tecnologías Por Definir:** **POR DEFINIR**.
  - Framework de Capa de Presentación: Selección definitiva entre React.js y Vue.js para la construcción de la Single Page Application (SPA).
  - Mecanismo de Almacenamiento Físico de Bibliotecas: Definición entre el sistema de archivos local del servidor del cliente (Local File System con particiones aisladas) o un servicio de almacenamiento de objetos compatible con API S3 (AWS S3 / MinIO).

---

# 4. Estudio de Factibilidad

## 4.1. Factibilidad Técnica

La evaluación técnica examina la viabilidad de diseñar, implementar y desplegar los mecanismos de TraceFlow SCM asegurando su operatividad, rendimiento y compatibilidad con las prácticas de ÉXODO S.A.C.

### 1. Arquitectura Propuesta y Desacoplamiento Modular
El sistema se estructura en una **arquitectura desacoplada en cuatro capas lógicas** (`DG-13`):
1. *Capa de Presentación:* Frontend Web SPA responsivo con interfaces diferenciadas para registro de RFC, consolas del CCB, tableros de control de bibliotecas y monitoreo de calidad.
2. *Capa de Servicios y Lógica de Negocio:* API RESTful basada en mensajes JSON para el control de proyectos aislados (`RF-02`), gestión de solicitudes (`RF-04`), emisión de órdenes de cambio (`RF-07`) y administración de usuarios RBAC (`RF-01`).
3. *Capa SCM Core, Motor de Concurrencia y Seguridad:* Componente especializado encargado del control de versiones, transiciones de bibliotecas, gestión de bloqueos transaccionales y cómputo de firmas SHA-256.
4. *Capa de Almacenamiento y Persistencia:* Gestor de base de datos relacional para metadatos, bitácoras de auditoría e inventario de ECS, coordinado con el almacenamiento de archivos de las bibliotecas.

### 2. Gestión de ECS y Esquema de Tres Bibliotecas
El sistema organiza los artefactos según su madurez mediante la administración estricta de tres bibliotecas físicas y lógicas (`RF-08`, `RN-04`):
- **Biblioteca de Trabajo (*Work*):** Espacio transitorio asignado al Ingeniero de Software para implementar las modificaciones autorizadas por una ECN.
- **Biblioteca de Soporte (*Support*):** Entorno intermedio controlado donde el Equipo de Calidad ejecuta pruebas de integración y validación funcional.
- **Biblioteca Maestra (*Master*):** Repositorio inmutable y restringido que custodia las versiones aprobadas y formalizadas en Líneas Base.

### 3. Control de Concurrencia y Bloqueos de Sincronización
Para erradicar la sobreescritura accidental, el sistema ejecuta un **bloqueo de sincronización automático** durante el Check-Out (`RF-09`, `RN-06`). Cuando un ECS pasa a la Biblioteca de Trabajo, ningún otro usuario puede extraerlo para modificación hasta que se complete el Check-In a Maestra o se ejecute un Rollback formal por fallo no subsanado (`RN-08`).

### 4. Seguridad, Integridad Criptográfica y Respaldo
- **Integridad SHA-256:** Cada Check-In calcula la firma criptográfica SHA-256 del ECS (`RNF-03`), validando que el archivo no haya sufrido alteraciones o corrupciones (`CU-26`).
- **Seguridad RBAC:** Control de acceso estricto que restringe las operaciones según los 7 roles canónicos (`RNF-01`).
- **Respaldo y Recuperación:** Copias de seguridad automáticas diarias programadas (`RNF-09`) y capacidad de reversión controlada (*rollback*) ante defectos detectados por QA (`RF-12`).

### 5. Escalabilidad, Capacidad Técnica y Dependencias
- *Escalabilidad:* El diseño relacional soporta más de 50 proyectos simultáneos de clientes de forma aislada sin degradación funcional (`RNF-05`).
- *Capacidad del Equipo C-SharkTeam:* Los cuatro integrantes poseen competencias técnicas demostradas en sus áreas de especialidad (`DG-01`): Joan Cristian Medina Quispe (coordinación, análisis, documentación, gobernanza SCM y modelado), Renzo Antonio Antayhua Mamani (backend, lógica de negocio, integración y mecanismos SCM), Renzo Fernando Loyola Vilca Choque (frontend, UX, navegación y construcción de interfaces/mockups) y Augusto Joaquin Rivera Muñoz (QA, pruebas, persistencia, auditoría y validación).
- *Dependencias Tecnológicas:* El sistema depende exclusivamente de componentes de software de amplio soporte industrial, reduciendo el riesgo de obsolescencia.

### Clasificación de Tecnologías:
- **Tecnología Requerida:** Arquitectura web en 4 capas, base de datos relacional ACID (PostgreSQL / SQLite), motor criptográfico SHA-256, API REST/JSON, protocolos seguros HTTPS/SSH.
- **Tecnología Propuesta:** Backend en Python (FastAPI/Django) o Node.js/TypeScript; Frontend en React o Vue.js; hosting PaaS en Render/Supabase.
- **Tecnología Todavía por Decidir:** Framework frontend definitivo (React vs. Vue.js) y almacenamiento físico persistente (File System local vs. Object Storage S3).

---

> ### **Conclusión de Factibilidad Técnica: VIABLE CON CONDICIONES**
> **Justificación documental:** El proyecto es técnicamente realizable. La arquitectura modular, el modelo de control de concurrencia y los mecanismos criptográficos cuentan con respaldo en las buenas prácticas de la ingeniería de software y coinciden con las capacidades técnicas del equipo C-SharkTeam. La viabilidad técnica queda **condicionada** a: (1) ejecutar el relevamiento técnico *in situ* de los servidores físicos de ÉXODO S.A.C., y (2) formalizar la selección definitiva del framework frontend.

---

## 4.2. Factibilidad Económica

La evaluación económica audita la veracidad y el sustento documental de los costos, beneficios y modelos de rentabilidad registrados previamente en el repositorio, determinando si los indicadores pueden reproducirse con la información disponible.

### 4.2.1. Costos Generales (Inversión Inicial - CAPEX)

La tabla a continuación resume los conceptos de inversión inicial identificados en la documentación preliminar (`FD03`, Tabla `TB-02`):

| Concepto | Cantidad | Costo unitario (S/.) | Costo total (S/.) | Sustento / Observación |
| :--- | :---: | :---: | :---: | :--- |
| **Esfuerzo de Desarrollo (Mano de obra)** | 500 horas | S/. 9.00 | S/. 4,500.00 | **PENDIENTE DE VALIDACIÓN DE ESFUERZO:** La cifra agregada de 500 horas consolidada en el SRS preliminar solo costea nominalmente a 2 desarrolladores (Joan Medina y Renzo Antayhua), omitiendo el esfuerzo de Renzo Loyola (Frontend) y Augusto Rivera (QA). No se deben inventar horas individuales sin una medición corporativa auditada. |
| **Depreciación de Equipos de Cómputo** | 3.5 meses | S/. 100.00 / mes | S/. 350.00 | Estimación sobre 4 equipos a razón de S/. 25.00 mensuales por equipo durante el periodo académico. |
| **Conectividad a Internet de Alta Velocidad** | 3.5 meses | S/. 100.00 / mes | S/. 350.00 | Costo compartido proporcional de servicios de telecomunicaciones para el equipo de desarrollo. |
| **Adquisición de Dominio Web** | 1 año | S/. 75.00 | S/. 75.00 | Cotización referencial de mercado para registro de dominio institucional (`.com` / `.pe`). |
| **Infraestructura de Despliegue Inicial** | Global | S/. 0.00 | S/. 0.00 | Uso de recursos de hardware existentes y cuentas de nivel gratuito en plataformas PaaS. |
| **Fondo de Imprevistos y Contingencias** | Estimado | S/. 200.00 | S/. 200.00 | Reserva presupuestal menor para gastos operativos y materiales no planificados. |
| **TOTAL CAPEX ESTIMADO PRELIMINAR** | — | — | **S/. 5,475.00** | **PENDIENTE DE VALIDACIÓN FINANCIERA** |

---

### 4.2.2. Costos Operativos Anuales (OPEX)

Los costos operativos recurrentes de mantenimiento y soporte de la plataforma se auditan clasificando cada componente según su grado de certidumbre técnica y contractual:

| Concepto | Costo mensual (S/.) | Costo anual (S/.) | Clasificación de Auditoría | Observación Técnica |
| :--- | :---: | :---: | :---: | :--- |
| **Alojamiento PaaS (Render / Supabase)** | S/. 70.00 | S/. 840.00 | **ALTERNATIVA TECNOLÓGICA / PENDIENTE DE COTIZACIÓN** | Corresponde a planes básicos en la nube. Si ÉXODO S.A.C. opta por servidores locales (on-premise), este costo se traslada a consumo eléctrico y mantenimiento interno de servidores. |
| **Renovación Anual de Dominio Web** | S/. 6.25 | S/. 75.00 | **ESTIMACIÓN** | Tarifa anual prorrateada mensual basada en precios promedio de mercado de registradores de dominios DNS. |
| **Soporte Preventivo y Difusión** | S/. 18.75 | S/. 225.00 | **ESTIMACIÓN** | Asignación nominal para reposición de insumos de respaldo y soporte correctivo menor. No existe contrato formal de soporte preventivo. |
| **TOTAL OPEX ANUAL PROYECTADO** | **S/. 95.00** | **S/. 1,140.00** | **ESTIMACIÓN SUJETA A ARQUITECTURA FINAL** | No existe ningún **costo confirmado al 100%** mediante contrato o factura vigente. |

*Nota:* No se asume Render o Supabase como plataformas definitivas; constituyen alternativas tecnológicas propuestas sujetas a la decisión de infraestructura de ÉXODO S.A.C.

---

### 4.2.3. Cuantificación de Beneficios y Ahorros Anuales

#### A. Beneficios Cuantificables
De acuerdo con los objetivos de negocio formalizados en el SRS (`FD03`, Sección 3.2.2), se proyectan los siguientes impactos:
1. **Reducción del 25% del tiempo de retrabajo** invertido por los consultores en resolver conflictos de integración y recuperar archivos perdidos.
2. **Reducción del 30% en las incidencias contractuales** reportadas por clientes derivadas de entregas de versiones incorrectas o no certificadas.
3. **Disminución del tiempo de respuesta a menos de 24 horas** para la reconstrucción de trazabilidad y atención de auditorías de configuración.
4. **Erradicación del 100% de pérdidas de código** por sobreescrituras accidentales gracias al bloqueo transaccional.

> [!WARNING]
> **REGLA FINANCIERA CRÍTICA:** No es metodológicamente válido convertir estos porcentajes en importes monetarios en moneda nacional (soles) debido a que el repositorio **no contiene información documentada sobre**:
> - La tarifa o costo medio por hora-hombre de los consultores de ÉXODO S.A.C.
> - La cantidad exacta de consultores asignados a la cartera de proyectos.
> - El número total de horas anuales consumidas históricamente por retrabajo.
> - El costo promedio monetizado de una penalidad o incidencia contractual con clientes.
> 
> En consecuencia, la valorización monetaria de los beneficios queda catalogada formalmente como **PENDIENTE DE VALIDACIÓN FINANCIERA**.

#### B. Beneficios Cualitativos
- Fortalecimiento de la reputación de marca y confiabilidad institucional de ÉXODO S.A.C. ante clientes externos.
- Preservación del conocimiento técnico y memoria corporativa del software ante la rotación natural de personal.
- Disminución sustancial del estrés y frustración laboral originados por la pérdida involuntaria de trabajo técnico.
- Transparencia en la atribución de responsabilidades y erradicación de conflictos interpersonales en el equipo de desarrollo.
- Facilidad de incorporación e inducción de nuevos desarrolladores gracias a la estandarización de procesos.

---

### 4.2.4. Flujo de Caja Proyectado (Horizonte a 5 Años)

Para cumplir con la regla de no inventar datos financieros, se presenta la estructura formal del flujo de caja, declarando como pendientes de validación aquellos rubros que carecen de sustento matemático demostrable:

| Concepto | Año 0 (S/.) | Año 1 (S/.) | Año 2 (S/.) | Año 3 (S/.) | Año 4 (S/.) | Año 5 (S/.) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Inversión Inicial (CAPEX)** | -5,475.00* | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| **Costos Operativos (OPEX)** | 0.00 | -1,140.00 | -1,140.00 | -1,140.00 | -1,140.00 | -1,140.00 |
| **Beneficios / Ahorros Anuales Monetizados** | 0.00 | *P.V.F.* | *P.V.F.* | *P.V.F.* | *P.V.F.* | *P.V.F.* |
| **Flujo de Caja Neto ($F_t$)** | **-5,475.00\*** | **P.V.F.** | **P.V.F.** | **P.V.F.** | **P.V.F.** | **P.V.F.** |

*\* Inversión preliminar sujeta a reestructuración por omisión de horas de desarrollo.*  
*P.V.F.: PENDIENTE DE VALIDACIÓN FINANCIERA.*

---

### 4.2.5. Indicadores de Rentabilidad Financiera

Para auditar los indicadores publicados en la Tabla `TB-02` de `docs/TABLES.md` y la Sección 3.5.2 de `FD03-EPIS-Informe_SRS.md`, se evalúa la reproducibilidad matemática de cada cálculo:

#### Formulación Explícita del Valor Actual Neto (VAN):
$$\text{VAN} = -I_0 + \sum_{t=1}^{5} \frac{F_t}{(1 + k)^t}$$

Donde se documentan los parámetros:
- **$I_0$ (Inversión Inicial):** $\text{S/. } 5,475.00$ (inversión documentada preliminar en TB-02; incompleta por omisión de 2 desarrolladores).
- **$F_t$ (Flujo de Caja Neto en el año $t$):** **Indeterminado / No documentado en soles** para cada periodo $t \in \{1, 2, 3, 4, 5\}$, debido a que los beneficios anuales no están monetizados.
- **$k$ (Tasa de Descuento / Costo de Oportunidad del Capital - COK):** $12.00\%$ ($0.12$ anual, valor referencial sin sustento sectorial en el repositorio).
- **$t$ (Horizonte temporal):** Periodo anual de evaluación ($t = 1, 2, 3, 4, 5$).

Al ser $F_t$ una variable cuantitativa indeterminada en todos los periodos, la sumatoria $\sum_{t=1}^{5} \frac{F_t}{(1.12)^t}$ no puede resolverse y, por ende, el VAN publicado (+S/. 10,801.64) no puede reproducirse matemáticamente.

#### Matriz de Auditoría de Indicadores Financieros:

| Indicador | Valor anterior | Valor recalculado | Estado | Observación |
| :--- | :---: | :---: | :---: | :--- |
| **Valor Actual Neto (VAN)** | +S/. 10,801.64 | *No recalculable* | **NO REPRODUCIBLE** | Requiere la serie documentada de flujos netos $F_1 \dots F_5$. La fórmula $\text{VAN} = -I_0 + \sum_{t=1}^{5} \frac{F_t}{(1+k)^t}$ es insoluble al carecer de beneficios monetarios anuales verificables de ÉXODO S.A.C. |
| **Tasa Interna de Retorno (TIR)** | 68.20% | *No recalculable* | **NO REPRODUCIBLE** | Insoluble matemáticamente sin el vector numérico de flujos netos anuales. Además, un despeje analítico demuestra que una TIR de 68.20% resulta contradictoria con el VAN y Payback publicados. |
| **Relación Beneficio / Costo (B/C)** | 1.97 | *No recalculable* | **NO REPRODUCIBLE** | Error metodológico grave detectado: el valor 1.97 coincide exactamente con la división $\text{VAN} / I_0 = 10,801.64 / 5,475.00 = 1.9729$ (Índice de Valor Actual Neto) y no con el ratio $\text{B/C} = \text{VPI} / \text{VPC}$. Asimismo, la justificación textual aludía a "la facultad y los estudiantes" de un proyecto ajeno. |
| **Periodo de Recuperación (Payback)** | 1 año y 9.7 meses | *No recalculable* | **NO REPRODUCIBLE** | Imposible interpolar el mes exacto de retorno sin la serie de flujos de caja netos acumulados año a año. Aritméticamente discrepante con el flujo implícito del VAN. |

---

> ### **Conclusión de Factibilidad Económica: PENDIENTE DE VALIDACIÓN FINANCIERA**
> **Justificación documental:** Conforme a los principios de rigor analítico, **no es posible emitir todavía una conclusión financiera cuantitativa definitiva favorable** sobre el proyecto TraceFlow SCM. Los cuatro indicadores publicados previamente (VAN, TIR, B/C y Payback) son técnicamente no reproducibles a partir de la documentación del repositorio. Para validar financieramente el proyecto se requiere que la Gerencia de ÉXODO S.A.C. y el equipo de desarrollo elaboren un flujo de caja corporativo que monetice los ahorros de retrabajo a partir de tarifas horarias reales y complete la estructura del CAPEX.

---

## 4.3. Factibilidad Operativa

La factibilidad operativa evalúa la receptividad organizacional de **ÉXODO S.A.C.**, la adaptación del personal, la segregación de responsabilidades y la compatibilidad del flujo propuesto con los ritmos de trabajo de la consultora.

### 1. Actores y Segregación de Responsabilidades
El sistema se gobierna estrictamente sobre los **7 roles canónicos oficiales** definidos en la norma [`docs/DOCUMENTATION_RULES.md`](docs/DOCUMENTATION_RULES.md) (Sección 5):
1. **`Solicitante / Usuario Final` (`PU-01`):** Cliente de ÉXODO S.A.C. o usuario interno; registra la RFC, subsana observaciones, realiza la validación de conformidad del entregable y es notificado al cierre.
2. **`Analista de Requerimientos / Gestor` (`PU-02`):** Recepciona la solicitud, valida la suficiencia de datos, categoriza criticidad y evalúa preliminarmente la pertinencia del cambio.
3. **`Arquitecto / Especialista Técnico` (`PU-03`):** Analiza dependencias e impacto sobre la arquitectura, esfuerzo en horas, cronograma, costos y riesgos; emite el Informe Técnico de Impacto vinculante (`RF-05`, `RN-05`).
4. **`Comité de Control de Cambios (CCB)` (`PU-04`):** Órgano colegiado de decisión; evalúa el informe técnico de impacto y dictamina la aprobación o rechazo de solicitudes de cambio (`RF-06`, `RF-07`).
5. **`Administrador de Configuración / Bibliotecario` (`PU-05`):** Custodio del software; ejecuta Check-Out y Check-In, activa/libera bloqueos de sincronización (`RN-06`), congela Líneas Base (`RN-02`) y ejecuta rollbacks ante fallos no subsanados (`RN-08`).
6. **`Ingeniero de Software / Desarrollador` (`PU-06`):** Implementa el cambio autorizado en la Biblioteca de Trabajo y realiza pruebas unitarias locales (`CU-14`, `CU-15`).
7. **`Equipo de Calidad / Testing` (`PU-07`):** Ente independiente; ejecuta pruebas de integración y validación funcional en Biblioteca de Soporte; emite de forma obligatoria la Certificación de Conformidad (`RN-09`).

### 2. Evaluación Operativa del Flujo de Gestión de Cambios (SCM / GCS)

El proceso base documentado en el SRS vigente (`FD03`, Sección 4.2 y Diagrama `DG-03`) canaliza el 100% de las Solicitudes de Cambio (RFC) a través del Comité de Control de Cambios (CCB), fijando como compuerta técnica previa al Check-In la Certificación de Conformidad emitida por el Equipo de Calidad (Testing).

#### Diagnóstico Operativo y Recomendaciones de Optimización:
Desde la perspectiva de viabilidad organizacional, la evaluación operativa concluye que someter la totalidad de las modificaciones cotidianas (incluyendo correcciones tipográficas o ajustes rutinarios menores) a la deliberación del comité colegiado generaría cuellos de botella administrativos y resistencia al uso del sistema. Por ello, este informe de factibilidad establece las siguientes **recomendaciones y condiciones operativas**:

1. **Bifurcación Operativa entre Cambios Mayores y Menores (Recomendación Operativa):**
   - *Cambios Mayores (Afectación de la Triple Restricción):* Modificaciones que alteren el **alcance contractual**, el **cronograma/tiempo**, el **costo presupuestado** o la arquitectura del software. Deben mantener obligatoriamente la convocatoria y aprobación del CCB colegiado.
   - *Cambios Menores (Operativos / Rutinarios):* Correcciones menores o ajustes que no impacten la triple restricción. Se recomienda establecer una ruta de aprobación ágil y delegada (Analista de Requerimientos o Arquitecto) para no saturar al CCB ni entorpecer los compromisos de entrega.

2. **Compuerta de Aceptación del Usuario (UAT) antes del Cierre (Recomendación Operativa):**
   - Si bien el SRS actual (`FD03`) culmina la validación técnica en el Equipo de Calidad (`RN-09`), para prevenir discrepancias contractuales con los clientes de ÉXODO S.A.C. se recomienda operativamente que el Solicitante / Usuario Final (`PU-01`) ejecute una prueba de aceptación (UAT) previa al Check-In definitivo en la Biblioteca Maestra.

$$\text{Secuencia Operativa Recomendada: } \text{RFC} \longrightarrow \text{Validación} \longrightarrow \text{Impacto} \longrightarrow \text{Clasificación} \longrightarrow \text{Aprobación (CCB / Delegada)} \longrightarrow \text{Trabajo} \longrightarrow \text{QA} \longrightarrow \text{Validación de Usuario} \longrightarrow \text{Check-In Maestra} \longrightarrow \text{Línea Base} \longrightarrow \text{Cierre}$$

> [!NOTE]
> **Condición de Gobernanza Documental:** La discriminación entre cambios menores y mayores, y la compuerta formal de aceptación de usuario (UAT) constituyen recomendaciones operativas originadas en este estudio de factibilidad. **Su adopción como requerimientos funcionales formales del sistema está condicionada a su sincronización e incorporación en una actualización posterior del SRS (`FD03-EPIS-Informe_SRS.md`)**.

### 3. Adaptación, Capacitación y Sostenibilidad
- **Adaptación y Cultura:** El personal no altera sus editores locales habituales (IDEs). El bloqueo transaccional es valorado positivamente por los consultores al proteger su código de sobreescrituras accidentales.
- **Capacitación:** Curva de inducción menor a 3 horas (`RNF-04`), orientada exclusivamente al flujo de solicitudes y a las 9 reglas de negocio.
- **Sostenibilidad:** Se salvaguarda la memoria corporativa e histórica de los proyectos en la empresa, mitigando el impacto de la rotación de consultores.

---

> ### **Conclusión de Factibilidad Operativa: VIABLE CON CONDICIONES**
> **Justificación documental:** Operativamente viable. La plataforma formaliza la segregación de responsabilidades sobre 7 roles canónicos de RBAC y mantiene una meta de inducción inferior a 3 horas (`RNF-04`). La viabilidad queda **condicionada** a formalizar en el SRS (`FD03`) la recomendación de una ruta ágil para cambios menores y la compuerta de validación de entrega con el usuario solicitante, evitando cuellos de botella burocráticos.

---

## 4.4. Factibilidad Legal

La evaluación legal analiza la plataforma frente a la normativa peruana vigente y los compromisos contractuales asumidos por **ÉXODO S.A.C.**, adoptando una redacción prudente basada en mecanismos de soporte:

### 1. Propiedad Intelectual y Derechos de Autor (D.L. N.° 822)
El Decreto Legislativo N.° 822 (Ley sobre el Derecho de Autor) establece que los derechos patrimoniales sobre los programas de ordenador creados bajo relación laboral o por encargo corresponden al empleador o comitente, salvo estipulación en contrario. 
- *Aporte del sistema:* TraceFlow SCM proporciona mecanismos de registro y bitácoras inmutables que apoyan la acreditación de la autoría moral de los consultores y la custodia de la propiedad patrimonial transferida a ÉXODO S.A.C. y sus clientes contratantes.
- *Condición pendiente:* **PENDIENTE DE VALIDACIÓN LEGAL**. Se requiere la redacción y suscripción formal de los convenios contractuales de cesión de derechos patrimoniales de software entre los integrantes del equipo C-SharkTeam y ÉXODO S.A.C.

### 2. Protección de Datos Personales (Ley N.° 29733)
Dado que los sistemas desarrollados por ÉXODO S.A.C. pueden procesar o contener información sensible de clientes finales, la plataforma debe alinearse a la Ley N.° 29733.
- *Aporte del sistema:* El sistema facilita la segregación de accesos mediante RBAC (`RNF-01`) y protocolos cifrados HTTPS/SSH, impidiendo que consultores no autorizados accedan a bases de datos o código que contenga credenciales o datos protegidos.
- *Condición pendiente:* **PENDIENTE DE VALIDACIÓN LEGAL**. Deberá formularse la política de privacidad del sistema y evaluarse la necesidad de registrar el banco de datos personales de usuarios ante la Autoridad Nacional de Protección de Datos Personales (MINJUS).

### 3. Contratos con Clientes y Acuerdos de Nivel de Servicio (SLA)
TraceFlow SCM proporciona mecanismos de trazabilidad y auditoría cronológica (`RF-16`, `RF-17`) que permiten demostrar fehacientemente qué versión de software fue entregada a un cliente, en qué fecha exacta, bajo qué resultados de pruebas de QA y con qué aprobación formal, mitigando contingencias por disputas de incumplimiento contractual.

### 4. Licenciamiento de Software y Dependencias de Código Abierto
- *Directiva de licenciamiento:* Para salvaguardar los activos de ÉXODO S.A.C., el proyecto deberá priorizar el uso de librerías y componentes bajo licencias de código abierto *permisivas* (MIT, Apache 2.0, BSD).
- *Alerta legal:* Se debe evitar la inclusión de librerías bajo licencias con *copyleft recíproco estricto* (tales como GNU GPL v3), dado que podrían imponer legalmente la obligación de liberar y abrir el código fuente de los desarrollos propietarios de ÉXODO S.A.C. o de sus clientes.

---

> ### **Conclusión de Factibilidad Legal: VIABLE CON CONDICIONES**
> **Justificación documental:** El sistema es legalmente viable en tanto provee controles técnicos de soporte para la trazabilidad y la seguridad exigidas por el D.L. 822 y la Ley 29733. La viabilidad queda **condicionada** a: (1) formalizar los contratos de cesión patrimonial entre el equipo desarrollador y ÉXODO S.A.C., (2) aprobar la política de privacidad de usuarios, y (3) auditar que las librerías externas descarten licencias de copyleft severo.

---

## 4.5. Factibilidad Social

La evaluación social analiza exclusivamente los impactos de TraceFlow SCM sobre las personas, el clima organizacional y la cultura de trabajo dentro de **ÉXODO S.A.C.**:

### 1. Colaboración y Clima Laboral
En la situación actual (AS-IS), los incidentes de sobreescritura accidental generan fricciones, reproches mutuos y desconfianza entre los consultores al no poder determinarse quién alteró o eliminó código de un proyecto. TraceFlow SCM transforma esta dinámica al proveer bloqueos de sincronización y bitácoras objetivas de auditoría, fomentando una cultura de trabajo transparente y colaborativa basada en reglas claras.

### 2. Orden del Trabajo y Reducción del Estrés Laboral
La pérdida imprevista de horas de programación debido a versiones cruzadas o caídas en producción genera estrés agudo, sobretiempo no remunerado y frustración en el personal técnico. La implementación de Líneas Base estables y la garantía de que el código asignado en la Biblioteca de Trabajo no será sobreescrito por terceros proporciona tranquilidad y previsibilidad operativa al consultor.

### 3. Responsabilidad Objetiva y Reconocimiento
El registro inmutable de autores en cada Check-In (`RF-09`) y la vinculación a órdenes de cambio (ECN) permiten que la labor individual sea formalmente reconocida dentro de la organización, erradicando atribuciones erróneas de fallos y facilitando evaluaciones de desempeño justas y fundamentadas en evidencia técnica.

### 4. Habilitación del Trabajo Remoto Distribuido
TraceFlow SCM actúa como un facilitador indispensable para el teletrabajo seguro en ÉXODO S.A.C., permitiendo que los consultores laboren de manera descentralizada sin riesgo de desincronización de versiones, apoyando la conciliación entre la vida personal y laboral del equipo.

---

> ### **Conclusión de Factibilidad Social: VIABLE**
> **Justificación documental:** Plenamente viable. La plataforma mejora el clima organizacional, reduce el estrés laboral al erradicar el retrabajo no remunerado, objetiviza la atribución de responsabilidades y consolida un entorno de trabajo colaborativo y remoto seguro.

---

## 4.6. Factibilidad Ambiental

La factibilidad ambiental evalúa de forma independiente los efectos de la plataforma sobre los recursos físicos y energéticos, adoptando un enfoque estrictamente cualitativo de Green IT:

### 1. Digitalización Integral y Política de Cero Papel
TraceFlow SCM elimina por completo el uso de documentación física impresa en los procesos de configuración de ÉXODO S.A.C. La tramitación de Solicitudes de Cambio (RFC), las actas de decisión del CCB, los informes técnicos de impacto del arquitecto, los certificados de conformidad de QA y los reportes de auditoría se gestionan, firman y custodian en formato 100% digital, eliminando el consumo de papel, tintas de impresión y residuos de archivo físico.

### 2. Reutilización de Infraestructura y Extensión de Vida Útil
La arquitectura modular liviana de la plataforma está concebida para operar eficientemente sobre las estaciones de trabajo preexistentes de los consultores y sobre servidores convencionales. Esto evita la necesidad de renovar anticipadamente el parque informático de ÉXODO S.A.C., mitigando la generación acelerada de residuos de aparatos eléctricos y electrónicos (RAEE).

### 3. Consumo de Almacenamiento y Medidas de Optimización
La operación de tres bibliotecas físicas y la generación de Líneas Base incrementan la demanda de almacenamiento digital. Para mitigar el impacto energético de los centros de datos, se contemplan las siguientes medidas cualitativas:
- **Deduplicación de artefactos:** Almacenamiento por referencia de archivos no modificados entre versiones consecutivas.
- **Compresión de Líneas Base:** Empaquetado comprimido de versiones congeladas para reducir el espacio en disco.
- **Políticas de Depuración:** Purga periódica automatizada de archivos temporales, logs intermedios y binarios de prueba en la Biblioteca de Soporte.
- **Almacenamiento en Frío:** Transferencia de Líneas Base históricas descontinuadas hacia esquemas de almacenamiento de bajo consumo energético (*cold storage*).

### 4. Uso de Centros de Datos con Eficiencia Energética
En caso de optar por un despliegue en plataformas cloud PaaS (como Render o Supabase), se aprovechan centros de datos modernos que operan bajo certificaciones ambientales internacionales y coeficientes de efectividad energética avanzados (PUE < 1.2), optimizando el consumo eléctrico por transacción en comparación con servidores locales obsoletos sin control de climatización.

---

> ### **Conclusión de Factibilidad Ambiental: VIABLE**
> **Justificación documental:** Viable cualitativamente. Promueve activamente la política de Cero Papel, extiende la vida útil del equipamiento informático de la consultora e incorpora criterios de eco-eficiencia digital en la gestión y purga de almacenamiento en servidores.

---

# 5. Conclusiones

1. **Viabilidad Técnica Favorable pero Condicionada:** El desarrollo de TraceFlow SCM es técnicamente realizable. La arquitectura modular en 4 capas, el motor de exclusión mutua mediante bloqueos transaccionales en Check-Out, el esquema jerárquico de tres bibliotecas y la verificación criptográfica SHA-256 son técnicamente viables y alineados con las capacidades del equipo C-SharkTeam. Su viabilidad definitiva queda condicionada a la ejecución de un relevamiento físico *in situ* de los servidores de ÉXODO S.A.C. y a la elección final del framework frontend.
2. **Viabilidad Económica Pendiente de Validación Financiera:** La dimensión económica no puede dictaminarse como aprobada en la etapa actual. Los indicadores de rentabilidad financiera (VAN de +S/. 10,801.64 y TIR de 68.20%) no pueden reproducirse matemáticamente debido a la ausencia de una serie de flujos de caja netos anuales sustentados en el repositorio. Asimismo, el presupuesto de inversión inicial (CAPEX) omitió al 50% de la mano de obra desarrolladora. Se requiere formular el modelo de flujos de caja corporativo con datos auditados de ÉXODO S.A.C.
3. **Viabilidad Operativa Favorable Sujeta a Optimización:** El sistema responde a las necesidades operacionales de ÉXODO S.A.C., asegurando una estricta segregación de funciones entre los 7 roles canónicos de RBAC y una curva de inducción menor a 3 horas. Para evitar la congestión burocrática diagnosticada en el flujo base del SRS (donde el 100% de cambios pasa por el CCB colegiado), la viabilidad operativa queda condicionada a formalizar en una actualización posterior del SRS (`FD03`) la recomendación de una ruta ágil para cambios menores y la compuerta de validación de entrega con el usuario solicitante.
4. **Viabilidad Legal con Requerimientos Contractuales:** La plataforma proporciona mecanismos idóneos para respaldar la atribución moral y patrimonial del software (D.L. 822), el control de acceso a datos protegidos (Ley 29733) y el cumplimiento de SLAs contractuales. Su viabilidad se supedita a formalizar los contratos de cesión patrimonial entre el C-SharkTeam y ÉXODO S.A.C., y a auditar las dependencias de código abierto para evitar copyleft recíproco restrictivo.
5. **Impactos Sociales y Ambientales Altamente Favorables:** En el plano social, la herramienta reduce significativamente el estrés laboral y el sobretiempo no remunerado al erradicar la pérdida de código por sobreescritura, fomentando un clima laboral transparente y habilitando el teletrabajo seguro. En el plano ambiental, promueve la eliminación del papel en trámites de ingeniería y optimiza la retención de almacenamiento digital bajo preceptos de Green IT.
6. **Condiciones Mandatorias Previas a la Implementación:** Antes de autorizar el inicio de la fase de codificación y despliegue corporativo (Hito FD04), deberán satisfacerse formalmente las siguientes compuertas: (a) emisión del acta de inspección de hardware de ÉXODO S.A.C., (b) aprobación gerencial del flujo de caja descontado neto a 4 desarrolladores, (c) designación oficial de los integrantes del CCB, (d) firma de convenios de propiedad intelectual y confidencialidad, y (e) sincronización formal en el SRS (`FD03`) de las recomendaciones operativas sobre cambios menores y validación con el usuario.

---

# Referencias Bibliográficas

### Normativa Legal Peruana
- Congreso de la República del Perú. (1996). *Decreto Legislativo N.° 822: Ley sobre el Derecho de Autor*. Diario Oficial El Peruano, 24 de abril de 1996.
- Congreso de la República del Perú. (2011). *Ley N.° 29733: Ley de Protección de Datos Personales*. Diario Oficial El Peruano, 3 de julio de 2011.

### Estándares Internacionales de Ingeniería de Software
- IEEE Computer Society. (2012). *IEEE Std 828-2012: IEEE Standard for Configuration Management in Systems and Software Engineering*. IEEE Standards Association. https://doi.org/10.1109/IEEESTD.2012.6170935
- ISO/IEC/IEEE. (2017). *ISO/IEC/IEEE 12207:2017 Systems and software engineering — Software life cycle processes*. International Organization for Standardization.
- ISO/IEC/IEEE. (2018). *ISO/IEC/IEEE 29148:2018 Systems and software engineering — Life cycle processes — Requirements engineering*. International Organization for Standardization.
- ISO/IEC. (2014). *ISO/IEC 25010:2011 Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. International Organization for Standardization.

### Bibliografía Técnica Especializada
- Pressman, R. S., & Maxim, B. R. (2020). *Ingeniería del software: Un enfoque práctico* (9.ª ed.). McGraw-Hill Interamericana.
- Sommerville, I. (2016). *Software Engineering* (10.ª ed.). Pearson Education.
- Stallings, W. (2017). *Cryptography and Network Security: Principles and Practice* (7.ª ed.). Pearson.

### Fuentes Oficiales del Repositorio TraceFlow
- C-SharkTeam. (2026). *docs/DOCUMENTATION_RULES.md: Reglas de Gobernanza Documental - TraceFlow SCM* (Versión 1.0). Repositorio TraceFlow.
- C-SharkTeam. (2026). *docs/TABLES.md: Catálogo Centralizado de Tablas y Matrices - TraceFlow SCM* (Versión 1.0). Repositorio TraceFlow.
- C-SharkTeam. (2026). *docs/DIAGRAMS.md: Catálogo Centralizado de Diagramas PlantUML - TraceFlow SCM* (Versión 1.0). Repositorio TraceFlow.
- C-SharkTeam. (2026). *FD03-EPIS-Informe_SRS.md: Sistema de Gestión de Configuración de Software - TraceFlow SCM - Documento de Especificación de Requerimientos de Software* (Versión 1.0). Repositorio TraceFlow.

