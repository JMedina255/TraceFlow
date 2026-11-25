# TraceFlow SCM — Configuración de Base de Datos PostgreSQL y Supabase (Hito DB-01)

Este directorio contiene las migraciones relacionales, semillas maestras y scripts de verificación de TraceFlow SCM, diseñados en estricto cumplimiento del marco normativo IEEE 828, ISO/IEC/IEEE 12207, el SRS v1.1 (`FD03`), el SAD de Análisis v1.1 (`FD04`), el SAD de Diseño v0.2 (`FD05`) y los ADR-003 a ADR-008.

---

## 1. Estructura de Archivos

```
supabase/
├── migrations/
│   ├── 202611250001_initial_traceflow.sql   # DDL del esquema privado 'traceflow', restricciones, índices y triggers
│   └── 202611250002_structural_seeds.sql    # Semillas estructurales obligatorias (roles PU-01 a PU-07)
├── roles/
│   └── 01_app_role.sql                      # Rol de aplicación 'traceflow_app' con mínimo privilegio (Least Privilege)
├── seeds/
│   └── demo_seeds.sql.example               # Datos de demostración de proyectos, ECS y usuarios para desarrollo
├── verify_migration.sql                     # Script de validación de integridad DDL, índices y permisos
└── README.md                                # Esta guía de operación y seguridad
```

---

## 2. Principios de Seguridad y Arquitectura

1. **Esquema Privado `traceflow`**: Las 21 tablas residen exclusivamente en el esquema `traceflow` y no se exponen a PostgREST (`anon`/`authenticated`). Toda interacción pasa a través del backend NestJS.
2. **Rol de Mínimo Privilegio (`traceflow_app`)**:
   - Concede permisos DML operativos (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) sobre las tablas de trabajo.
   - Revocación estricta de `UPDATE`, `DELETE` y `TRUNCATE` en `traceflow.audit_log` (inmutabilidad absoluta).
   - Revocación estricta de `DELETE` y `TRUNCATE` en `traceflow.ecs_version` (versiones inmutables).
   - Revocación estricta de `TRUNCATE` en `traceflow.sync_lock`.
   - Sin permisos DDL (`CREATE`, `ALTER`, `DROP`).
3. **Índice Único Parcial Condicional (`RN-06`)**:
   ```sql
   CREATE UNIQUE INDEX uq_active_sync_lock_per_ecs
   ON traceflow.sync_lock (ecs_id)
   WHERE status = 'ACTIVE';
   ```
   Garantiza a nivel de motor de datos que un Elemento de Configuración (ECS) jamás tenga más de un bloqueo activo simultáneo.
4. **Inmutabilidad y Cadena Criptográfica en `audit_log` (`RN-02`, `ADR-008`)**:
   - Trigger `trg_audit_log_immutable` que prohíbe `UPDATE` y `DELETE`.
   - Función transaccional `append_audit_log` con bloqueo consultivo `pg_advisory_xact_lock(74291)` para eliminar condiciones de carrera entre múltiples escritores y garantizar la continuidad inquebrantable de los hashes SHA-256.
5. **Separación de Identificadores (UUID vs Código de Negocio)**:
   - Claves primarias: `UUID` nativo generado vía `gen_random_uuid()`.
   - Códigos canónicos: `VARCHAR` únicos indexados (`USR-001`, `PRJ-001`, `RFC-2026-0001`, `ECN-2026-0001`).
6. **Aislamiento Multitenant por Proyecto**:
   - Tabla `user_project_assignment` que restringe el acceso de cada usuario únicamente a los proyectos asignados.
   - Foráneas compuestas para garantizar que ninguna RFC ni ECS cruce proyectos.

---

## 3. Protocolo de Despliegue en Supabase

### Orden Obligatorio de Ejecución:
1. Crear el rol operativo `traceflow_app` ejecutando `roles/01_app_role.sql`.
2. Aplicar la migración DDL `migrations/202611250001_initial_traceflow.sql`.
3. Aplicar las semillas estructurales `migrations/202611250002_structural_seeds.sql`.
4. Aprovisionar usuarios y datos iniciales mediante `backend/src/scripts/provision-users.ts` o `seeds/demo_seeds.sql.example`.
5. Ejecutar `verify_migration.sql` o la suite de certificación física `backend/test/real-postgres-integration.spec.ts`.

---

## 4. Rollback Plan Controlado

En caso de requerirse revertir el despliegue inicial en un entorno de desarrollo aislado:

```sql
-- ROLLBACK SEGURO DE DESARROLLO (NO EJECUTAR EN PRODUCCIÓN)
DROP SCHEMA IF EXISTS traceflow CASCADE;
```
*(Nota: Nunca ejecutar `DROP ... CASCADE` en producción ni sin autorización previa del CCB).*
