# Estándar Oficial de Programación y Convenciones Técnicas — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Documento:** `docs/ESTANDAR_PROGRAMACION.md`  
> **Rama:** `docs/alineacion-srs-sad-2026-11-12`  
> **Estado:** Candidato a Aprobación (DOC-02.3)  
> **Fecha:** 25 de noviembre de 2026  

---

## 1. Principios Generales Obligatorios

1. **Español como idioma del dominio:** Todos los identificadores propios del negocio (variables, funciones, métodos, clases de dominio, interfaces, DTOs, tablas, columnas, rutas nuevas y pruebas) se escriben en español claro, sin tildes, sin `ñ` en código/SQL (usar `n`, p. ej. `tamanoBytes`, `contrasena`) y sin caracteres especiales.
2. **Siglas normativas preservadas:** Se conservan `RFC`, `ECS`, `ECN`, `CCB`, `QA`, `UAT`, `RBAC`, `SoD`, `SCM`, `TLS`, `SHA-256`.
3. **Nombres descriptivos y coherentes:** Cada nombre debe expresar inequívocamente su intención de negocio conforme a [`GLOSARIO.md`](GLOSARIO.md) y [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md).
4. **Responsabilidad única (SRP) y separación por capas:** Controladores delgados, lógica de negocio y SoD en servicios, acceso SQL aislado en repositorios.
5. **Tipado estricto:** `strict: true` en TypeScript; prohibido `any` no justificado en contratos nuevos de dominio.
6. **Validación explícita y denegación por defecto:** Toda entrada HTTP y transición de estado se valida explícitamente; toda ruta y permiso no declarado explícitamente se deniega (`Default-Deny`).
7. **Sin fallback silencioso a datos simulados:** En `DATABASE_MODE=postgres`, cualquier indisponibilidad de PostgreSQL debe abortar o fallar explícitamente sin degradar silenciosamente a `mock`.
8. **Cero secretos en el código fuente:** Prohibido incluir contraseñas, tokens, claves privadas o cadenas `DATABASE_URL` reales en archivos versionados.
9. **Reutilización controlada:** Extraer utilidades comunes antes de duplicar lógica de validación, hash o mapeo.

---

## 2. Convenciones TypeScript

### 2.1 Tabla de Nomenclatura Base

| Elemento | Convención | Ejemplo normativo |
|---|---|---|
| Variables y parámetros | `camelCase` | `solicitudActual`, `idProyecto` |
| Funciones y métodos | `camelCase` (verbo + objeto) | `obtenerProyectosPorUsuario()`, `validarTransicionEstado()` |
| Clases | `PascalCase` | `RfcsService`, `ErrorApiTraceFlow` |
| Interfaces | `PascalCase` (sin prefijo `I`) | `SolicitudCambio`, `InformeImpactoTecnico` |
| Tipos y uniones | `PascalCase` | `EstadoRFC`, `Prioridad`, `NivelRiesgoTecnico` |
| Constantes globales / catálogos | `UPPER_SNAKE_CASE` | `ROLES_CANONICOS`, `CATALOGO_ESTADOS_RFC`, `PERMISOS_ACCION` |
| Archivos de lógica/servicios/tiendas | `kebab-case` | `solicitud-cambio.service.ts`, `autenticacion.repository.ts` |
| Archivos de componentes React | `PascalCase.tsx` *(o `kebab-case` si se aprueba AMB-07)* | `VistaDetalleRfc.tsx`, `RutaProtegida.tsx` |
| Directorios propios | `kebab-case` | `analisis-impacto/`, `control-cambios/` |

### 2.2 Criterios Semánticos Específicos
- **Booleanos:** Prefijo verbal `es`, `esta`, `tiene`, `puede` (`esPrincipal`, `estaBloqueado`, `tienePermiso`, `puedeAprobar`).
- **Colecciones y listas:** Siempre en plural (`proyectos`, `solicitudesCambio`, `elementosAfectados`).
- **Identificadores:** Prefijo `id` + entidad en singular (`idUsuario`, `idProyecto`, `idEcsObjetivo`, `idSolicitante`).
- **Fechas y marcas temporales:** Prefijo `fecha` (`fechaCreacion`, `fechaActualizacion`, `fechaCierre`, `fechaExpiracion`).
- **Funciones:** Deben iniciar con verbo en infinitivo (`crearSolicitud`, `verificarIntegridadCadena`, `calcularSumaSha256`).
- **Funciones asíncronas:** Declarar `async/await` con retorno explícito `Promise<T>`; no dejar promesas sin manejo de error.
- **DTOs:** Sufijo `Dto` (`CrearRfcDto`, `ClasificarRfcDto`, `RegistrarAnalisisImpactoDto`).
- **Manejo de errores:** Lanzar excepciones tipadas de dominio/HTTP (`ForbiddenException`, `NotFoundException`, `BadRequestException`, `ConflictException`) con mensajes accionables en español que citen la regla normativa violada (`SoD-01`, `RN-06`, etc.) sin filtrar SQL crudo ni secretos.
- **Comentarios y JSDoc:** Documentar *el porqué* normativo y las invariantes en clases/servicios/DTOs públicos; evitar comentarios redundantes sobre sintaxis obvia.

---

## 3. Estándares Backend NestJS (`backend/`)

1. **Sufijos técnicos obligatorios de NestJS:** Conservar `Module`, `Controller`, `Service`, `Repository`, `Guard`, `Filter`, `Interceptor`, `Dto` (p. ej. `AutenticacionController`, `RfcsService`, `GuardiaRoles`).
2. **Módulos:** Un módulo cohesivo por dominio (`AutenticacionModule`, `ProyectosModule`, `RfcsModule`, `AuditoriaModule`, `SaludModule`), encapsulando sus repositorios y exportando solo los servicios requeridos por otros módulos.
3. **Controladores:** Solo extraen parámetros/headers/usuario actual (`@CurrentUser()`), delegan en el servicio y retornan respuestas JSON uniformes; prohibido escribir SQL o reglas de negocio en controladores.
4. **Servicios:** Contienen las reglas de negocio, máquina de estados `TB-07` / `DG-11`, validación de propiedad (`Ownership`), aislamiento multitenant, verificaciones SoD y emisión obligatoria de auditoría (`AuditoriaService`).
5. **Repositorios:** Único lugar autorizado para SQL; deben usar **exclusivamente consultas parametrizadas (`$1, $2, ...`)**. Prohibido concatenar entradas de usuario en cadenas SQL.
6. **Transacciones:** Toda operación compuesta (p. ej. crear `informe_impacto` + actualizar `solicitud_cambio` + insertar `registro_auditoria`) debe ejecutarse dentro de un bloque transaccional (`BEGIN / COMMIT / ROLLBACK`) sobre un mismo `PoolClient`.
7. **DTOs y validación:** Toda entrada usa clases DTO decoradas con `class-validator` / `class-transformer` bajo `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
8. **Guards, Decoradores y Filtros:**
   - Autenticación obligatoria por defecto mediante `GuardiaAutenticacion` (`AuthGuard`), evaluando expiración por inactividad en PostgreSQL (`sesion_usuario`).
   - Autorización declarativa mediante `@Roles('PU-01')` + `GuardiaRoles` (`RolesGuard`) y validación de SoD dinámica en servicio.
   - `FiltroExcepcionesHttp` global que normaliza errores sin exponer trazas internas ni errores de motor SQL en producción.
   - Conservar nombres de métodos de interfaz exigidos por NestJS (`canActivate`, `onModuleInit`, `onModuleDestroy`, `catch`).
9. **Auditoría:** Toda mutación de negocio exitosa o intento crítico de violación SoD debe invocar `AuditoriaService.registrarEvento(...)` respaldado por `registrar_auditoria()` en PostgreSQL.

---

## 4. Estándares Frontend React (`prototype/`)

1. **Organización por funcionalidades (`src/features/`):** Agrupar vistas y subcomponentes por dominio (`autenticacion/`, `tablero/`, `rfcs/`, `proyectos/`, `scm/`). Componentes compartidos en `src/components/`.
2. **Componentes y Props:** Componentes funcionales tipados con `React.FC<Props>` o interfaz explícita `PropsDetalleRfc`.
3. **Hooks y Stores Zustand:** Conservar obligatoriamente el prefijo técnico **`use`** en todo hook personalizado y tienda Zustand (`useAutenticacionStore`, `useProyectoStore`, `useRfcStore`).
4. **Servicios API y Adaptador Unificado:** Las vistas y stores **nunca** deben llamar `fetch` directamente ni acoplarse a `localStorage` cuando operan en modo API; deben consumir el adaptador unificado (`adaptadorTraceFlow`).
5. **Formularios y validaciones:** Validar longitudes mínimas, campos obligatorios y reglas previas antes de enviar al backend, mostrando mensajes claros de validación y errores HTTP (`400/401/403/409`).
6. **Estados de carga y error:** Toda petición asíncrona debe manejar explícitamente `estaCargando` (`isLoading`) y `mensajeError` (`errorMessage`), evitando dobles envíos con botones deshabilitados durante la petición.
7. **Accesibilidad:** Labels asociados (`htmlFor`/`id`), atributos `aria-label` en botones de icono, contraste conforme y navegación por teclado.
8. **Rutas protegidas y sesión:** Toda ruta privada protegida por `RutaProtegida` y `GuardiaRol`; manejo de sesión basado en cookie `HttpOnly` (`credentials: 'include'`) sin almacenar contraseñas ni tokens secretos en `localStorage`.

---

## 5. Estándares PostgreSQL (`supabase/`)

1. **Convención de nombres:** `snake_case` minúsculo y **singular** para tablas (`usuario`, `proyecto`, `solicitud_cambio`, `orden_cambio`), columnas en español sin tildes (`id_solicitante`, `fecha_creacion`).
2. **Claves y restricciones:**
   - PK: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` (o `SERIAL`/`INTEGER` en catálogos estáticos).
   - FKs: `id_<entidad>` con prefijo `fk_<tabla>_<referencia>` y política explícita `ON DELETE RESTRICT` o `CASCADE` según ciclo de vida.
   - `UNIQUE`: prefijo `uq_<descripcion>`.
   - `CHECK`: prefijo `chk_<columna>_<regla>`.
   - Índices: `idx_<tabla>_<columnas>` (y `uq_*` para índices únicos parciales).
   - Funciones/Triggers: `fn_*` o verbo descriptivo (`registrar_auditoria`, `validar_sod_*`, `prevenir_alteracion_*`) y triggers `trg_<tabla>_<proposito>`.
3. **Fechas y zonas horarias:** Usar exclusivamente `TIMESTAMPTZ` (`TIMESTAMP WITH TIME ZONE`) con `DEFAULT NOW()` en UTC.
4. **Migraciones:** Numeración cronológica inmutable `YYYYMMDDNNNN_descripcion.sql`. **Prohibido editar migraciones ya aplicadas** en Supabase; todo cambio posterior requiere nueva migración incremental.
5. **Mínimo privilegio y auditoría append-only:** El rol de aplicación (`traceflow_app`) jamás recibe `DELETE` ni privilegios DDL, ni `UPDATE` sobre tablas inmutables (`registro_auditoria`, `version_ecs`, `voto_ccb`, `autorizacion_delegada`).
6. **Objetos externos preservados:** No alterar ni renombrar esquemas o roles gestionados por Supabase (`public`, `auth`, `storage`, `supabase_migrations`).

---

## 6. Estándares API REST (`/api/v1`)

1. **Versionamiento obligatorio:** Prefijo global `api/v1` configurado una sola vez en NestJS (`app.setGlobalPrefix('api/v1')`) y sin duplicar en rutas de cliente.
2. **Nomenclatura de recursos en español (objetivo `REF-01.4`):** Sustantivos plurales en `kebab-case` (`/api/v1/autenticacion`, `/api/v1/proyectos`, `/api/v1/rfcs`, `/api/v1/ordenes-cambio`).
3. **Verbos HTTP y códigos de estado:**
   - `GET`: `200 OK` (consulta / listado con `{ total, datos }` o `{ datos }`).
   - `POST`: `201 Created` (creación de recurso) o `200 OK` (acciones de estado/sesión).
   - `PATCH` / `PUT`: `200 OK` (actualización/transición de estado).
   - Errores: `400 Bad Request` (DTO/regla de entrada), `401 Unauthorized` (sin sesión/expirada), `403 Forbidden` (RBAC/SoD/multitenancy), `404 Not Found`, `409 Conflict` (bloqueo activo / transición inválida).
4. **Paginación y filtros estándar:** Parámetros de consulta `?pagina=1&limite=20&idProyecto=...&estado=...`.
5. **Formato uniforme de error:**
   ```json
   {
     "codigoEstado": 403,
     "marcaTiempo": "2026-11-25T23:00:00.000Z",
     "ruta": "/api/v1/rfcs",
     "mensaje": "Violación de SoD (CU-04 / RN-01): Solo el Solicitante (PU-01) está facultado para registrar solicitudes.",
     "error": "Forbidden"
   }
   ```
6. **Compatibilidad durante transición (`REF-01.4`):** No modificar endpoints vigentes durante DOC-02; al ejecutar `REF-01.4`, mantener alias de rutas y adaptadores de payload hasta completar la migración integral del cliente.

---

## 7. Seguridad y Variables de Entorno

- **Variables exigidas por frameworks/herramientas (se conservan):** `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_SSL_REJECT_UNAUTHORIZED`, `DATABASE_SSL_CA_PATH`, `VITE_API_BASE_URL` (obligatorio prefijo `VITE_` en Vite).
- **Variables propias del dominio:** `DATABASE_MODE`, `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAME_SITE`, `SESSION_TTL_MINUTES`, `VITE_SERVICE_MODE` — se recomienda conservar compatibilidad con estos nombres y documentarlos en español en `.env.example` (ver `AMB-05` en [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md)).
- **Reglas de oro:**
  - `.env` y `.env.local` siempre listados en `.gitignore`.
  - `.env.example` actualizado sin credenciales ni URLs con contraseñas.
  - TLS estricto en PostgreSQL (`rejectUnauthorized: true` con `prod-ca-2021.crt`).

---

## 8. Estándares de Pruebas

1. **Nomenclatura descriptiva en español:** Los títulos `describe` / `it` describen comportamiento esperado y regla normativa (`it('debe rechazar que el solicitante evalúe técnicamente su propia RFC (SoD-01)', ...)`).
2. **Patrón obligatorio Arrange–Act–Assert (Preparar–Actuar–Verificar):** Secciones claramente diferenciadas en toda prueba.
3. **Categorías y aislamiento:**
   - **Unitarias y servicios en memoria:** Sin dependencias de red ni PostgreSQL remoto (`DatabaseService('mock')`).
   - **Integración PostgreSQL (`DB-T01`..`DB-T14`):** Ejecutadas en suite separada contra BD real; **conservar intactos los códigos históricos `DB-TXX`**.
   - **Flujo HTTP y E2E (`INT-T01`..`INT-T18`):** Ejecución controlada con limpieza o entorno aislado; **conservar intactos los códigos `INT-TXX`**.
   - **Pruebas negativas RBAC y SoD:** Obligatorio probar explícitamente todos los roles no autorizados, aislamiento multitenant entre proyectos y anti-autoevaluación.

---

## 9. Estándares Git

1. **Ramas permanentes:**
   - `master`: línea base estable de desarrollo principal (protegida; solo integración vía Pull Request revisado).
   - `docs/alineacion-srs-sad-2026-11-12`: rama permanente de alineación y mantenimiento documental.
2. **Ramas temporales de implementación:** `feat/<hito>`, `fix/<alcance>`, `refactor/ref-01-<etapa>` — eliminadas tras merge aprobado.
3. **Commits semánticos (Conventional Commits):**
   - Prefijos técnicos en inglés conservados por compatibilidad con herramientas (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`) + descripción breve y clara (`docs(estandares): formalizar convenciones de programacion`, `refactor(datos): normalizar esquema solicitud_cambio`).
4. **Reglas de integridad:** Prohibido `git push --force` en `master` o en la rama documental; prohibido commitear `.env`, certificados privados o `node_modules`/`dist`; nunca editar migraciones SQL ya aplicadas.

---

## 10. Ejemplos Concretos Antes y Después de la Normalización

### 10.1 TypeScript (Tipos de Dominio)
```typescript
// ANTES
export interface CreateRfcDTO {
  projectId: string;
  affectedEcsId: string;
  title: string;
  justification: string;
  priority: Priority;
}

// DESPUÉS (REF-01.1)
export interface CrearRfcDto {
  idProyecto: string;
  idEcsObjetivo: string;
  titulo: string;
  justificacion: string;
  prioridad: Prioridad;
}
```

### 10.2 NestJS (Servicio y Controlador)
```typescript
// ANTES
@Get(':id')
async getRfc(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
  const rfc = await this.rfcsService.getRfcById(id, user);
  return { data: rfc };
}

// DESPUÉS (REF-01.2)
@Get(':id')
async obtenerRfc(@Param('id') id: string, @UsuarioActual() usuario: UsuarioAutenticado) {
  const solicitud = await this.rfcsService.obtenerRfcPorId(id, usuario);
  return { datos: solicitud };
}
```

### 10.3 React / Zustand
```typescript
// ANTES
export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,
  fetchProjects: async (user) => { ... }
}));

// DESPUÉS (REF-01.3)
export const useProyectoStore = create<EstadoProyectos>((set) => ({
  proyectos: [],
  estaCargando: false,
  cargarProyectos: async (usuario) => { ... }
}));
```

### 10.4 PostgreSQL
```sql
-- ANTES
SELECT r.id, r.code, r.project_id, r.target_ecs_id, r.requested_by, r.status
FROM traceflow.change_request r
WHERE r.code = $1;

-- DESPUÉS (REF-01.5)
SELECT s.id, s.codigo, s.id_proyecto, s.id_ecs_objetivo, s.id_solicitante, s.estado
FROM traceflow.solicitud_cambio s
WHERE s.codigo = $1;
```

### 10.5 Contrato JSON (Respuesta de RFC)
```json
// ANTES
{
  "data": {
    "id": "d0000001-0000-0000-0000-000000000001",
    "code": "RFC-2026-0001",
    "project_id": "PRJ-001",
    "target_ecs_id": "c0000001-0000-0000-0000-000000000001",
    "status": "IMPLEMENTADA"
  }
}

// DESPUÉS (REF-01.4)
{
  "datos": {
    "id": "d0000001-0000-0000-0000-000000000001",
    "codigo": "RFC-2026-0001",
    "idProyecto": "b0000001-0000-0000-0000-000000000001",
    "codigoProyecto": "PRJ-001",
    "idEcsObjetivo": "c0000001-0000-0000-0000-000000000001",
    "estado": "IMPLEMENTADA"
  }
}
```

### 10.6 Pruebas (Vitest / Arrange–Act–Assert)
```typescript
// ANTES
it('should forbid PU-02 from creating RFC', async () => {
  await expect(service.createRfc(dto, managerUser)).rejects.toThrow(ForbiddenException);
});

// DESPUÉS (REF-01.2)
it('debe denegar el registro de RFC cuando el rol efectivo no es PU-01 (SoD-01)', async () => {
  // Preparar (Arrange)
  const usuarioGestor = crearUsuarioPrueba({ rolActivo: 'PU-02' });

  // Actuar y Verificar (Act & Assert)
  await expect(servicioRfcs.crearRfc(dtoValido, usuarioGestor)).rejects.toThrow(ForbiddenException);
});
```

---

*Estándar oficial de programación de TraceFlow SCM — Etapa DOC-02.3 — C-SharkTeam / ÉXODO S.A.C.*
