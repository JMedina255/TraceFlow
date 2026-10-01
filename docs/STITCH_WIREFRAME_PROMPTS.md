# Prompts para Wireframes de Baja Fidelidad — Stitch AI

> Proyecto: TraceFlow SCM  
> Fase: Diseño — Wireframes de baja fidelidad  
> Objetivo: generar en Stitch AI una maqueta estructural coherente con el SRS, SAD, UWE, diagrama de paquetes y diagramas de casos de uso, antes de construir la maqueta React.

---

# 1. Propósito de este archivo

Este documento NO reemplaza al SRS ni al SAD. Su función es traducir los artefactos aprobados del repositorio a instrucciones operativas listas para usar en Stitch AI.

La cadena de trazabilidad que debe respetarse en todas las generaciones es:

CU → Paquete DG-04 → NAV → PRES → SCREEN → WF → Stitch → futura maqueta React

Fuentes de verdad obligatorias:

1. FD03-EPIS-Informe_SRS.md
2. docs/TABLES.md
3. docs/DIAGRAMS.md
4. FD04-EPIS-Informe_SAD_Analisis.md
5. FD05-EPIS-Informe_SAD_Diseno.md
6. docs/adr/

Ante cualquier diferencia, Stitch NO debe inventar funcionalidad. Debe mantenerse la solución definida por las fuentes anteriores.

---

# 2. Reglas que Stitch debe respetar siempre

## 2.1 Nivel visual

Generar WIREFRAMES DE BAJA FIDELIDAD.

Usar:

- escala de grises;
- bloques rectangulares simples;
- bordes visibles;
- tipografía sans-serif neutra;
- jerarquía mediante tamaño y espaciado;
- placeholders sencillos;
- iconos solo cuando ayuden a comprender la función.

NO usar:

- identidad visual final;
- colores de marca definitivos;
- gradientes;
- ilustraciones decorativas;
- fotografías;
- efectos glassmorphism;
- sombras complejas;
- animaciones;
- diseño publicitario;
- landing page;
- estilo SaaS genérico desconectado del dominio SCM.

El resultado debe parecer un prototipo estructural, no una interfaz terminada.

## 2.2 Formato base

Prioridad: escritorio.

Referencia recomendada:
- viewport aproximado 1440 x 1024;
- sidebar persistente a la izquierda;
- topbar;
- breadcrumb;
- título de pantalla;
- área principal;
- barra o zona de acciones contextuales.

Tablet y móvil se trabajarán después. No generar múltiples breakpoints en esta fase salvo que se solicite expresamente.

## 2.3 Paquetes oficiales de DG-04

La arquitectura de información debe conservar los ocho paquetes principales del Diagrama de Paquetes DG-04:

1. Gobernanza y Seguridad
2. Gestión de Proyectos
3. Gestión de Configuración (ECS)
4. Gestión de Bibliotecas
5. Control de Cambios
6. Soporte e Incidencias
7. Trazabilidad y Auditoría
8. Reportes

No crear nuevos paquetes de navegación.

Las funciones de QA, UAT, Línea Base y Rollback existen por los casos de uso y módulos del SAD, pero deben integrarse en los flujos ya definidos; no deben inventarse como nuevos dominios funcionales independientes del DG-04.

## 2.4 Actores canónicos

Solo existen los siete actores funcionales definidos en TB-09:

- Solicitante
- Analista de Requerimientos / Gestor
- Arquitecto / Especialista Técnico
- Comité de Control de Cambios (CCB)
- Administrador de Configuración / Bibliotecario
- Ingeniero de Software / Desarrollador
- Equipo de Calidad / Testing

No crear actores como:
- Super Admin
- Security Admin
- QA Manager
- Project Owner
- Cliente genérico
- Auditor externo

salvo que una baseline futura los incorpore formalmente.

## 2.5 Estados oficiales de RFC

Usar EXCLUSIVAMENTE los 14 estados de TB-07:

1. Registrada
2. En Subsanación
3. Clasificada
4. En Análisis Técnico
5. En Evaluación
6. Autorizada
7. Orden Emitida
8. En Implementación
9. En Pruebas
10. En Aceptación
11. Desestimada
12. Rechazada
13. Cancelada
14. Implementada

No mostrar como estados de RFC:
- Observada
- Evaluada
- Certificada
- En Desarrollo
- Aprobada
- Cerrada

Si se necesita mostrar “QA Conforme”, “UAT Conforme”, “Lock Activo” u otra condición técnica, representarla como badge o condición auxiliar, NO como estado oficial de la RFC.

## 2.6 Bibliotecas oficiales

Usar únicamente:

- Biblioteca de Trabajo
- Biblioteca de Soporte
- Biblioteca Maestra

Flujos esenciales:

Check-Out:
Soporte → Trabajo

Check-In técnico:
Trabajo → Soporte

Check-In definitivo:
Soporte → Maestra
solo después de QA conforme + UAT conforme.

Rollback:
opera sobre la Biblioteca de Trabajo y no modifica la Biblioteca Maestra.

## 2.7 Regla de seguridad

Ocultar botones en frontend no constituye autorización.

Los wireframes solo representan visibilidad y experiencia por rol. La seguridad autoritativa pertenece al backend RBAC/SoD.

## 2.8 Datos de ejemplo

Todos los códigos, nombres, cantidades y fechas utilizados por Stitch deben considerarse DATOS DE MUESTRA NO NORMATIVOS.

Preferir valores neutrales:

- PRY-001
- RFC-2026-001
- ECN-2026-001
- ECS-001
- Usuario Ejemplo
- Proyecto de Ejemplo

No inventar empresas, productos bancarios, dominios funcionales, contratos o requisitos ajenos a TraceFlow SCM.

---

# 3. Shell global que debe reutilizarse

Usar este prompt primero para establecer el lenguaje estructural del producto:

## PROMPT BASE — SHELL GLOBAL

Diseña un wireframe desktop de baja fidelidad para una aplicación web empresarial llamada TraceFlow SCM, dedicada a gestión de configuración de software. Usa escala de grises, layout sobrio, sin colores de marca ni decoración final.

La pantalla autenticada debe tener:
- topbar con nombre TraceFlow SCM;
- selector o indicador de Proyecto Activo;
- área de notificaciones;
- usuario autenticado y rol canónico;
- sidebar persistente;
- breadcrumb;
- título de pantalla;
- badge de estado cuando aplique;
- área principal de contenido;
- zona inferior o superior de acciones contextuales.

Organiza el sidebar según los paquetes oficiales del sistema:
Gobernanza y Seguridad, Gestión de Proyectos, Gestión de Configuración (ECS), Gestión de Bibliotecas, Control de Cambios, Soporte e Incidencias, Trazabilidad y Auditoría, Reportes.

No inventes módulos nuevos. El menú visible debe poder adaptarse al rol autenticado.

Estilo: low fidelity wireframe, grayscale, UX corporativa, alta densidad de información, pensado para escritorio 1440 px.

---

# 4. Estrategia recomendada de generación en Stitch

Generar una pantalla por vez.

Orden recomendado:

Fase A — Base y gobernanza:
SCREEN-01, SCREEN-02, SCREEN-20.

Fase B — Proyectos y Control de Cambios:
SCREEN-03 a SCREEN-11.

Fase C — Configuración, Bibliotecas y Calidad:
SCREEN-12 a SCREEN-17.

Fase D — Soporte, Auditoría y Reportes:
SCREEN-18 y SCREEN-19.

Para mantener consistencia:
1. Generar primero SCREEN-02 Dashboard.
2. Usar esa pantalla como referencia visual para el shell de las demás.
3. En cada nueva generación pedir explícitamente “mantén el mismo shell, densidad, espaciado y patrón de navegación del Dashboard”.
4. No cambiar el sidebar arbitrariamente entre pantallas.
5. Las variantes de una misma pantalla deben generarse como edición de la pantalla base, no como diseños sin relación.

---

# 5. Prompts individuales listos para Stitch

## SCREEN-01 / WF-01 — Portal de Acceso

Trazabilidad:
- Paquete DG-04: Gobernanza y Seguridad
- NAV-01
- PRES-01
- CU asociado: acceso/autenticación del sistema
- Actores: los 7 actores canónicos

PROMPT STITCH:

Crea un wireframe desktop de baja fidelidad para la pantalla de inicio de sesión de TraceFlow SCM.

Debe ser una pantalla centrada, sobria y empresarial. Mostrar únicamente:
- nombre TraceFlow SCM;
- subtítulo “Sistema de Gestión de Configuración de Software”;
- campo Usuario o Correo Institucional;
- campo Contraseña;
- botón primario “Iniciar sesión”;
- región para mensajes de validación o credenciales inválidas.

No incluyas:
- registro público;
- login social;
- selección manual de rol;
- recuperación de contraseña;
- marketing;
- gráficos decorativos.

Usa escala de grises y controles claramente etiquetados. Esta pantalla pertenece al paquete Gobernanza y Seguridad.

---

## SCREEN-02 / WF-02 — Dashboard General Adaptativo

Trazabilidad:
- Paquetes: transversal a DG-04
- NAV-02
- PRES-02
- Actores: todos, contenido adaptado por rol

PROMPT STITCH:

Usa el shell global de TraceFlow SCM y crea un Dashboard General Adaptativo de baja fidelidad.

Debe mostrar:
- proyecto activo;
- rol actual;
- bloque de tareas pendientes según el rol;
- accesos rápidos hacia funciones autorizadas;
- actividad reciente del proyecto;
- alertas operativas relevantes.

Usa tarjetas simples solamente para datos derivados del sistema, por ejemplo:
- RFC pendientes de intervención;
- órdenes ECN activas;
- bloqueos de ECS activos;
- tareas QA/UAT cuando correspondan al rol.

No inventes KPIs comerciales, ventas, ingresos, productividad del personal ni métricas ajenas a SCM.

El dashboard debe poder variar según los siete actores sin cambiar el shell principal.

---

## SCREEN-03 / WF-03 — Directorio General de Proyectos

Trazabilidad:
- DG-04: Gestión de Proyectos
- DG-06
- CU-02
- NAV-03
- PRES-03

PROMPT STITCH:

Diseña la pantalla “Directorio General de Proyectos” de TraceFlow SCM como wireframe de baja fidelidad.

Usa el shell global.

Contenido:
- título “Proyectos”;
- búsqueda por nombre o código;
- filtro por estado;
- tabla o listado con Código, Nombre, Responsable/Gestor, Estado y Última actualización;
- acción contextual “Crear proyecto” visible únicamente para el Analista de Requerimientos / Gestor;
- acción “Ver proyecto” por fila.

No agregues gestión financiera ni portafolios empresariales no contemplados.

Esta pantalla corresponde a Gestión de Proyectos y CU-02.

---

## SCREEN-04 / WF-04 — Ficha Integral de Proyecto

Trazabilidad:
- DG-04: Gestión de Proyectos
- DG-06
- CU-02, CU-03
- NAV-04
- PRES-04

PROMPT STITCH:

Diseña el wireframe de la “Ficha Integral de Proyecto” en TraceFlow SCM.

Debe incluir:
- código y nombre del proyecto;
- estado del proyecto;
- información general;
- participantes autorizados;
- resumen del catálogo de ECS;
- acceso a líneas base del proyecto;
- acceso a solicitudes de cambio relacionadas.

Usa pestañas o secciones claras.

Acciones:
- consultar información;
- editar datos solo si el rol y CU-02 lo permiten;
- navegar al catálogo de ECS;
- navegar a líneas base.

No inventes campos comerciales o financieros no definidos en el SRS.

---

## SCREEN-05 / WF-05 — Bandeja de Solicitudes de Cambio RFC

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-04, CU-04.1, CU-05, CU-06, CU-07, CU-08, CU-30
- NAV-05
- PRES-03

PROMPT STITCH:

Diseña la “Bandeja de Solicitudes de Cambio RFC” de TraceFlow SCM.

Usa tabla de alta densidad con:
- Código RFC;
- Proyecto;
- Resumen;
- Clasificación Mayor/Menor cuando ya exista;
- Estado oficial TB-07;
- responsable actual;
- última actualización;
- acción “Ver expediente”.

Filtros:
- proyecto;
- estado oficial;
- clasificación;
- solicitante;
- búsqueda por código/texto.

Para Solicitante mostrar “Nueva RFC”.

Los únicos estados permitidos son:
Registrada, En Subsanación, Clasificada, En Análisis Técnico, En Evaluación, Autorizada, Orden Emitida, En Implementación, En Pruebas, En Aceptación, Desestimada, Rechazada, Cancelada, Implementada.

No inventes estados alternativos.

---

## SCREEN-06 / WF-06A/B/C — Expediente 360° de RFC

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-04, CU-04.1, CU-05, CU-06, CU-07, CU-08, CU-30
- NAV-06
- PRES-04 / PRES-07

PROMPT STITCH BASE:

Diseña el “Expediente 360° de RFC” de TraceFlow SCM en baja fidelidad.

Encabezado:
- Código RFC;
- Proyecto;
- Solicitante;
- Clasificación Mayor/Menor si existe;
- Estado oficial TB-07.

Pestañas:
- Resumen;
- ECS afectados;
- Informe de Impacto;
- Decisión;
- Orden ECN/ECO;
- QA;
- UAT;
- Historial.

Incluye un panel de “Acciones disponibles” dependiente del Actor + Estado.

No muestres todas las acciones a todos los roles.

VARIANTE A — REGISTRADA / EN SUBSANACIÓN / CLASIFICADA:
centrar las acciones del Gestor en validar completitud, clasificar o solicitar subsanación; para el Solicitante habilitar subsanación únicamente si el estado es En Subsanación.

VARIANTE B — EN ANÁLISIS TÉCNICO / EN EVALUACIÓN:
mostrar Informe de Impacto; si es Mayor, acceso al CCB; si es Menor, acceso al panel de doble conformidad Gestor + Arquitecto.

VARIANTE C — EN PRUEBAS / EN ACEPTACIÓN:
mostrar QA, no conformidades, certificación QA y UAT como información contextual. No confundir “QA Conforme” con un estado TB-07.

---

## SCREEN-07 / WF-07 — Registro y Subsanación de RFC

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-04, CU-04.1
- NAV-07, NAV-08
- PRES-06, PRES-05
- Actor: Solicitante

PROMPT STITCH:

Diseña un wireframe de formulario para “Registrar / Subsanar Solicitud de Cambio RFC”.

Estructura en secciones:
- proyecto;
- información general de la solicitud;
- descripción y justificación;
- ECS relacionados cuando aplique;
- resumen previo al envío;
- mensajes de validación.

La variante “Subsanar” debe reutilizar la misma estructura y resaltar claramente las observaciones que el Solicitante debe corregir.

No inventes campos nuevos que no estén definidos por CU-04/CU-04.1.

No muestres decisiones CCB, análisis técnico ni autorización dentro del formulario del Solicitante.

---

## SCREEN-08 / WF-08 — Análisis de Impacto Técnico

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-06
- RN-05
- NAV-09
- Actor: Arquitecto / Especialista Técnico

PROMPT STITCH:

Diseña la “Consola de Análisis de Impacto Técnico” para el Arquitecto.

Mostrar:
- referencia RFC;
- proyecto;
- ECS afectados;
- dependencias;
- evaluación de arquitectura;
- riesgos;
- esfuerzo/tiempo/costo;
- evaluación de Triple Restricción: Alcance, Tiempo y Costo;
- observaciones técnicas;
- acción “Registrar Informe de Impacto”.

La pantalla debe ser analítica y estructurada, no un dashboard genérico.

No incluir aprobación CCB aquí. Esta pantalla produce el informe técnico que servirá para la evaluación posterior.

---

## SCREEN-09 / WF-09 — Sala de Deliberación CCB

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-07
- NAV-10
- Actor: Comité de Control de Cambios

PROMPT STITCH:

Diseña la “Sala de Deliberación CCB” de TraceFlow SCM.

Mostrar:
- resumen de la RFC Mayor;
- Informe de Impacto;
- ECS afectados;
- Triple Restricción;
- historial relevante;
- área para registrar voto/decisión individual si corresponde al diseño vigente;
- justificación;
- listado de decisiones registradas;
- área de resolución formal Aprobación/Rechazo.

No inventes:
- porcentaje mínimo;
- quórum;
- mayoría calificada;
- reglas de votación no existentes.

La pantalla debe apoyar deliberación y resolución formal, no agregar reglas de gobernanza nuevas.

---

## SCREEN-10 / WF-10 — Autorización de Cambio Menor

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-30
- RN-01, RN-05
- NAV-11
- Actores: Gestor + Arquitecto

PROMPT STITCH:

Diseña la “Consola de Autorización de Cambio Menor”.

Mostrar dos paneles paralelos:

Panel Arquitecto:
- estado de conformidad;
- observaciones técnicas;
- acción Aprobar/Rechazar para el Arquitecto.

Panel Gestor:
- estado de conformidad;
- observaciones de gestión;
- acción Aprobar/Rechazar para el Gestor.

Resultado global:
- En Evaluación mientras falte una conformidad;
- Autorizada únicamente si ambas conformidades son positivas;
- Rechazada si el flujo formal determina rechazo.

Representar claramente la doble llave operativa. No fusionar ambos actores en un único aprobador.

---

## SCREEN-11 / WF-11 — Ficha de Orden de Cambio ECN/ECO

Trazabilidad:
- DG-04: Control de Cambios
- DG-07
- CU-08, CU-22
- NAV-12
- PRES-04

PROMPT STITCH:

Diseña la “Ficha de Orden de Cambio ECN/ECO”.

Mostrar:
- código ECN/ECO;
- RFC origen;
- proyecto;
- estado;
- desarrollador asignado;
- ECS autorizados;
- alcance aprobado;
- información temporal autorizada si está disponible;
- situación de custodia;
- acceso al flujo de Check-Out / Check-In según rol.

Acciones visibles por rol:
- CCB/Gestor: información de formalización;
- Bibliotecario: operaciones de custodia permitidas;
- Desarrollador: consultar su asignación;
- QA: consultar la orden para validación.

No permitir que el Desarrollador ejecute Check-Out o Check-In.

---

## SCREEN-12 / WF-12 — Explorador de ECS y Bibliotecas SCM

Trazabilidad:
- DG-04: Gestión de Configuración (ECS) + Gestión de Bibliotecas
- DG-08
- CU-09, CU-14, CU-26
- NAV-13, NAV-14, NAV-15

PROMPT STITCH:

Diseña un wireframe de “Explorador de ECS y Bibliotecas SCM”.

Estructura:
- selector de proyecto;
- catálogo de ECS;
- ficha del ECS seleccionado;
- versión actual;
- Biblioteca actual: Trabajo / Soporte / Maestra;
- checksum SHA-256;
- estado de bloqueo;
- ECN relacionada;
- acceso a historial;
- acción de verificar integridad para el Bibliotecario.

Representa las tres bibliotecas conceptualmente mediante secciones o pestañas. No imites necesariamente un explorador de archivos del sistema operativo.

No inventes una cuarta biblioteca.

---

## SCREEN-13 / WF-13A/B — Operaciones SCM Check-Out / Check-In

Trazabilidad:
- DG-04: Gestión de Bibliotecas
- DG-08
- CU-10, CU-11, CU-12
- RN-06, RN-09
- NAV-16, NAV-17
- Ejecutor: Administrador de Configuración / Bibliotecario

PROMPT STITCH — CHECK-OUT:

Diseña la variante Check-Out de la Consola de Operaciones SCM.

Mostrar:
- ECS;
- versión origen en Biblioteca de Soporte;
- ECN autorizada;
- desarrollador asignado;
- origen: Soporte;
- destino: Trabajo;
- aviso “Bloqueo exclusivo RN-06 se aplicará automáticamente”;
- botón “Confirmar Check-Out”.

El bloqueo NO debe ser un checkbox opcional.

El Desarrollador puede aparecer como receptor de la copia de Trabajo, pero no como ejecutor.

PROMPT STITCH — CHECK-IN:

Diseña la variante Check-In.

Permitir seleccionar una de dos operaciones:
A. Trabajo → Soporte
B. Soporte → Maestra

Mostrar:
- ECS;
- versión;
- hash SHA-256;
- origen;
- destino;
- notas de versión.

Para Soporte → Maestra mostrar precondiciones:
- QA Conforme;
- UAT Conforme.

Si falta alguna, la acción debe quedar bloqueada con explicación textual.

Solo el Administrador de Configuración / Bibliotecario ejecuta la operación.

---

## SCREEN-14 / WF-14 — Historial de Versiones y Diff

Trazabilidad:
- DG-04: Gestión de Bibliotecas / Gestión de Configuración
- DG-08
- CU-13
- NAV-18
- PRES-09

PROMPT STITCH:

Diseña el “Historial de Versiones y Comparador Diff”.

Pantalla de alta densidad para escritorio:
- identificación ECS;
- lista cronológica de versiones;
- autor;
- fecha;
- ECN asociada;
- biblioteca;
- checksum;
- selección de dos versiones;
- comparador lado a lado;
- resumen de diferencias.

No convertir esta pantalla en editor de código.

Debe servir para consulta/comparación de versiones y mantener trazabilidad SCM.

---

## SCREEN-15 / WF-15 — Validación QA y No Conformidades

Trazabilidad:
- DG-09: Implementación y Validación de Calidad
- CU-16, CU-17, CU-18, CU-19
- NAV-19, NAV-20
- Actor principal: Equipo de Calidad / Testing
- Desarrollador: consulta/corrección, no certificación

PROMPT STITCH:

Diseña una “Consola de Validación QA y No Conformidades”.

Secciones:
- ECN y ECS bajo prueba;
- resultados de pruebas de integración;
- listado de no conformidades;
- detalle de hallazgo;
- acción “Reportar No Conformidad” para QA;
- acción “Re-testear” para QA;
- acción “Certificar Conformidad QA” para QA si corresponde.

Mostrar indicador de Segregación de Funciones.

El Desarrollador puede consultar defectos asociados para corregirlos, pero NO debe poder certificar QA sobre su propio cambio.

No crear un estado RFC “Certificada”; el expediente continúa usando los estados TB-07.

---

## SCREEN-16 / WF-16 — Aceptación UAT

Trazabilidad:
- DG-09
- CU-29
- RN-09
- NAV-21
- Actor: Solicitante

PROMPT STITCH:

Diseña el “Centro de Aceptación UAT”.

Mostrar:
- RFC y ECN;
- resumen del cambio;
- certificación QA previa y su condición Conforme;
- criterios de aceptación;
- observaciones del Solicitante;
- decisión Aceptar/Rechazar;
- confirmación formal.

Si QA no es Conforme, bloquear el envío UAT.

Después de UAT conforme, indicar:
“El cambio queda habilitado para Check-In definitivo de Soporte a Maestra por el Administrador de Configuración.”

No indicar que UAT crea directamente una Línea Base.

---

## SCREEN-17 / WF-17 — Línea Base y Rollback

Trazabilidad:
- DG-08
- CU-20, CU-21
- RN-02, RN-08, RN-09
- NAV-22, NAV-23
- Actor: Administrador de Configuración / Bibliotecario

PROMPT STITCH:

Diseña una pantalla de gobernanza SCM dividida claramente en dos zonas.

Zona A — Línea Base:
- proyecto;
- etiqueta de línea base con formato mayor.menor.parche, ejemplo v1.0.0;
- versiones ECS ya presentes en Maestra;
- confirmación QA + UAT;
- botón “Congelar Línea Base”.

Zona B — Rollback:
- ECN;
- ECS afectado en Biblioteca de Trabajo;
- motivo;
- advertencia de pérdida de cambios no conformes;
- botón crítico “Ejecutar Rollback”.

Mostrar claramente:
“Rollback solo actúa sobre Biblioteca de Trabajo. No modifica Biblioteca Maestra.”

---

## SCREEN-18 / WF-18 — Mesa de Incidencias

Trazabilidad:
- DG-04: Soporte e Incidencias
- DG-07
- CU-23, CU-24, CU-25
- NAV-24, NAV-25

PROMPT STITCH:

Diseña la “Mesa de Incidencias” de TraceFlow SCM.

Parte superior:
- búsqueda;
- filtros;
- botón “Nueva Incidencia” para Solicitante.

Listado:
- Código;
- Resumen;
- Proyecto;
- Estado de ticket;
- última actualización;
- acción “Ver detalle”.

Panel o vista de detalle:
- descripción;
- evidencias disponibles;
- historial;
- RFC vinculada si existe.

Para el Gestor mostrar acción:
“Derivar a RFC”.

Al derivar, dirigir al flujo de registro RFC reutilizando los datos disponibles. No crear un ciclo de cambio alternativo.

---

## SCREEN-19 / WF-19 — Auditoría y Reportes

Trazabilidad:
- DG-04: Trazabilidad y Auditoría + Reportes
- DG-10
- CU-27, CU-28
- NAV-26, NAV-27

PROMPT STITCH:

Diseña la “Consola de Auditoría y Reportes SCM”.

Usar dos pestañas:

1. Auditoría
- filtros por actor, operación, entidad y periodo;
- tabla cronológica;
- timestamp;
- actor;
- rol;
- operación;
- entidad;
- ECN/RFC relacionada;
- estado de integridad;
- acción de verificar cadena SHA-256.

2. Reportes
- selección del tipo de reporte soportado;
- proyecto;
- periodo;
- vista previa;
- acción generar/exportar si está contemplada por el diseño.

No mezclar administración de usuarios en esta pantalla.

No agregar analítica comercial.

---

## SCREEN-20 / WF-20 — Administración de Usuarios y Roles

Trazabilidad:
- DG-04: Gobernanza y Seguridad
- DG-06
- CU-01
- NAV-28
- Actor: Administrador de Configuración / Bibliotecario

PROMPT STITCH:

Diseña la pantalla “Administración de Usuarios y Roles”.

Mostrar:
- búsqueda;
- filtro por rol canónico;
- estado de cuenta;
- tabla de usuarios;
- nombre;
- identificador/correo institucional;
- rol canónico;
- estado;
- acciones de gestión derivadas de CU-01.

El selector de rol debe usar únicamente los siete roles canónicos.

No crear Super Admin ni roles personalizados fuera de TB-09.

Mantener esta pantalla separada de Auditoría y Reportes.

---

# 6. Prompts de corrección para Stitch

Si Stitch genera elementos no permitidos, usar estos prompts de edición.

## Corrección de estados

Corrige esta pantalla y reemplaza todos los estados inventados por los estados oficiales de TraceFlow SCM. Solo pueden aparecer como estados RFC: Registrada, En Subsanación, Clasificada, En Análisis Técnico, En Evaluación, Autorizada, Orden Emitida, En Implementación, En Pruebas, En Aceptación, Desestimada, Rechazada, Cancelada, Implementada. QA Conforme y UAT Conforme son condiciones auxiliares, no estados RFC.

## Corrección de arquitectura de información

Reorganiza el sidebar para que coincida con los ocho paquetes oficiales de TraceFlow SCM: Gobernanza y Seguridad, Gestión de Proyectos, Gestión de Configuración (ECS), Gestión de Bibliotecas, Control de Cambios, Soporte e Incidencias, Trazabilidad y Auditoría, Reportes. No crees un noveno paquete.

## Corrección de roles

Elimina actores o roles inventados. Usa exclusivamente: Solicitante; Analista de Requerimientos / Gestor; Arquitecto / Especialista Técnico; Comité de Control de Cambios (CCB); Administrador de Configuración / Bibliotecario; Ingeniero de Software / Desarrollador; Equipo de Calidad / Testing.

## Corrección de Check-Out / Check-In

Corrige el flujo SCM. Check-Out es Soporte → Trabajo con bloqueo obligatorio RN-06. Check-In técnico es Trabajo → Soporte. Check-In definitivo es Soporte → Maestra y requiere QA conforme + UAT conforme. Solo el Administrador de Configuración / Bibliotecario ejecuta Check-Out y Check-In.

## Corrección de fidelidad

Reduce esta interfaz a wireframe de baja fidelidad. Elimina colores de marca, gradientes, fotografías, ilustraciones decorativas, sombras complejas, iconos comerciales y estilos finales. Conserva únicamente estructura, jerarquía, controles y navegación en escala de grises.

---

# 7. Criterio de aceptación de cada wireframe

Antes de aceptar una pantalla generada en Stitch, verificar:

| Criterio | Validación |
|---|---|
| Trazabilidad | SCREEN, NAV, PRES y CU coinciden |
| Paquete DG-04 | La función pertenece al paquete correcto |
| Actor | Solo roles canónicos y acciones permitidas |
| Estados | Solo estados TB-07 |
| Bibliotecas | Trabajo, Soporte y Maestra |
| Seguridad | Frontend no sustituye RBAC/SoD |
| Navegación | Respeta UWE NAV |
| Presentación | Respeta UWE PRES |
| Fidelidad | Continúa siendo low-fi |
| Funcionalidad | No inventa CU, módulos o botones |
| Ejemplos | Datos ilustrativos, no nuevos requisitos |
| React-ready | La estructura puede convertirse luego en componentes |

---

# 8. Registro de resultados de Stitch

Para cada pantalla aprobada registrar:

| Campo | Valor |
|---|---|
| SCREEN-ID | |
| WF-ID | |
| Prompt usado | |
| Fecha | |
| Variante | |
| Resultado Stitch | |
| Cambios requeridos | |
| Estado | BORRADOR / VALIDADO |
| Evidencia | enlace o captura |

Guardar las imágenes exportadas con nomenclatura consistente:

assets/wireframes/stitch/WF-01.png
assets/wireframes/stitch/WF-02.png
...
assets/wireframes/stitch/WF-20.png

Para variantes:

assets/wireframes/stitch/WF-06A.png
assets/wireframes/stitch/WF-06B.png
assets/wireframes/stitch/WF-06C.png
assets/wireframes/stitch/WF-13A.png
assets/wireframes/stitch/WF-13B.png

---

# 9. Preparación para la futura maqueta React

Los wireframes aprobados serán la fuente visual para la maqueta React.

No generar aún lógica de negocio real.

La primera maqueta React deberá reproducir:

- Shell global;
- navegación por paquetes;
- rutas SCREEN;
- layouts;
- tablas;
- formularios;
- tabs;
- modales;
- badges;
- estados vacíos/loading/error;
- visibilidad por rol simulada.

La implementación real de API, PostgreSQL, RBAC, StoragePort, Check-In/Out y auditoría pertenece a una etapa posterior.

Trazabilidad futura esperada:

SCREEN → componente/página React → NAV → CU → API-DRAFT

---

# 10. Nota de gobernanza

Este documento contiene PROMPTS DE GENERACIÓN y no modifica las baselines funcionales.

Si durante el trabajo visual surge la necesidad de una pantalla, acción, actor, estado o dato no existente en SRS/SAD:

NO incorporarlo automáticamente.

Registrar primero la necesidad y evaluar si:
- puede resolverse como variante de presentación;
- pertenece a un CU existente;
- o requiere un cambio formal de baseline.
