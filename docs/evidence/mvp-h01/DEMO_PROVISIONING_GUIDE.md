# TraceFlow SCM — Guía de Aprovisionamiento de Cuentas de Demostración (DEMO-01)

> [!NOTE]
> Este documento versionado **no contiene contraseñas ni secretos**. Las credenciales de evaluación se solicitan por entrada local segura o variable de entorno local durante la ejecución.

## 1. Catálogo de cuentas de evaluación (entorno local ÉXODO S.A.C.)

| Perfil | Nombre de demostración | Correo institucional | Rol y alcance |
|---|---|---|---|
| `PU-01` | Solicitante | `usuario@exodo.pe` | Solicitante SCM (membresía `ORG-EXODO`, sin acceso automático a proyectos) |
| `PU-02` | Analista de Requerimientos | `analistarequerimientos@exodo.pe` | Analista / Gestor de Configuración (sin creación de proyectos) |
| `PU-03` | Arquitecto de Software | `arquitecto@exodo.pe` | Arquitecto / Especialista Técnico |
| `PU-04` | Miembro del CCB | `ccb@exodo.pe` | Miembro del Comité de Control de Cambios |
| `PU-05` | Bibliotecario SCM | `bibliotecario@exodo.pe` | Bibliotecario / Administrador SCM |
| `PU-06` | Desarrollador | `desarrollador@exodo.pe` | Desarrollador / Ingeniero de Software |
| `PU-07` | Responsable de Calidad | `qa@exodo.pe` | Responsable de Calidad / Testing (QA) |
| `PU-08` | Administrador del Sistema | `admin@exodo.pe` | Administración global exclusiva (`/admin/users`, organizaciones e invitaciones) |
| `PU-09` | Jefe de Proyecto | `jefeproyecto@exodo.pe` | Jefe de Proyecto con `can_create_projects = true` |

## 2. Procedimiento de aprovisionamiento reproducible

1. Verificar que PostgreSQL local esté en ejecución (`127.0.0.1` o `localhost`), las migraciones hasta `202611260009_mvp_roles_pu08_pu09_and_admin.sql` aplicadas y `DATABASE_URL` configurada apuntando a la base local (ej. `traceflow_mvp_dev`).
2. Ejecutar desde `backend/`:
   ```powershell
   npm run provision:demo
   ```
3. Ingresar la contraseña común de demostración cuando el prompt interactivo oculto lo solicite (o definir temporalmente `DEMO_PROVISION_PASSWORD` en la sesión local de consola).

## 3. Controles de seguridad y preservación
- **Bloqueo remoto:** El comando rechaza `NODE_ENV=production`, hosts de Supabase (`.supabase.co`, `.pooler.supabase.com`), RDS/Neon, direcciones no locales y bases de sistema (`postgres`, `template0`, `template1`).
- **Hashing independiente:** Utiliza `hashPasswordArgon2id` (`@node-rs/argon2`, `memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`) generando una sal criptográfica independiente por cuenta.
- **Idempotencia:** Detecta cuentas existentes por correo o nombre de usuario y omite su modificación sin sobrescribir contraseñas ni perfiles previos.
- **Conservación histórica:** Las cuentas previas (`jmedina@exodo.pe`, `rantayhua@exodo.pe`, `arivera@exodo.pe`, `rloyola@exodo.pe`), proyectos, RFCs y auditoría permanecen intactos.

## 4. Flujo de demostración preparado
1. Iniciar sesión como Administrador del Sistema (`PU-08`, `admin@exodo.pe`).
2. Consultar las cuentas registradas en `/admin/users`.
3. Verificar la autorización `can_create_projects = true` del Jefe de Proyecto (`PU-09`, `jefeproyecto@exodo.pe`).
4. Revocar y volver a conceder dicha autorización desde el panel administrativo.
5. Cerrar sesión e iniciar sesión como Jefe de Proyecto (`PU-09`).
6. Con **MVP-H02** habilitado: registrar un nuevo proyecto, incorporar las 7 cuentas operativas (`PU-01`..`PU-07`) al equipo, asignar responsabilidades SCM, configurar metodología/cronograma y vincular el repositorio GitHub.
