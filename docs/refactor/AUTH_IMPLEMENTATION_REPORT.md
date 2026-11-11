# Informe de Implementación de Identidad, Autenticación y Seguridad
## TraceFlow SCM — Mecanismo Criptográfico, Ciclo de Sesión y Dependencias de Backend

> **Organización Cliente:** ÉXODO S.A.C.  
> **Sistema:** TraceFlow SCM — Versión Empresarial 2.0  
> **Fecha:** 11 de Noviembre de 2026  
> **Documento:** `docs/refactor/AUTH_IMPLEMENTATION_REPORT.md`  
> **Marco Normativo:** IEEE 828, ISO/IEC/IEEE 12207, SRS (`FD03`), SAD Diseño (`FD05`)

---

## 1. Visión General de la Arquitectura de Autenticación

La refactorización de identidad de **TraceFlow SCM** sustituyó el esquema de acceso demostrativo público (selección de tarjetas sin contraseña) por un subsistema de autenticación institucional basado en credenciales verificables con hash criptográfico, principio de un solo rol efectivo por sesión y almacenamiento estructurado de sesión.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE AUTENTICACIÓN INSTITUCIONAL                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                   [ 1. Usuario ingresa Correo y Contraseña ]
                   [    Ej. jmedina@exodo.pe / [PROTECTED]  ]
                                      │
                                      ▼
                   [ 2. Cálculo Criptográfico en Cliente ]
                   [    Salt: 'traceflow:exodo:scm:auth:v1' ]
                   [    Algoritmo: SHA-256 (Web Crypto / Node) ]
                                      │
                                      ▼
                   [ 3. Cotejo contra Hash Almacenado ]
                   [    Match con Hash Configurado ]
                        ├─── No Coincide ──> Error: Credenciales incorrectas
                        └─── Coincide ─────┐
                                           ▼
                   [ 4. Determinación de Rol Efectivo ]
                   [    ¿Tiene múltiples roles asignados? ]
                        ├─── Sí ─> Valida selección explícita del usuario
                        └─── No ─> Asigna rol único institucional
                                           │
                                           ▼
                   [ 5. Emisión de Sesión Segura ]
                   [    - Token criptográfico de sesión
                   [    - Timestamp de emisión y expiración (8 hrs)
                   [    - Almacenamiento en storage aislado ]
                                           │
                                           ▼
                   [ 6. Redirección Autorizada al Dashboard ]
```

---

## 2. Esquema Criptográfico y Gestión de Contraseñas

### 2.1. Algoritmo de Hashing y Salting
Para evitar almacenar contraseñas en texto claro y prevenir ataques de diccionario o tablas arcoíris en el entorno cliente, el servicio `auth.service.ts` implementa una función de resumen criptográfico asistida por la API estándar `crypto.subtle` (navegadores) y el módulo `node:crypto` (entorno de pruebas Node.js):

* **Algoritmo:** SHA-256
* **Salt del Sistema:** `traceflow:exodo:scm:auth:v1`
* **Entrada de Transformación:** `${salt}:${password}`
* **Salida:** Cadena hexadecimal de 64 caracteres en minúsculas.

```typescript
export async function hashPassword(password: string): Promise<string> {
  const salted = `${AUTH_SALT}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback para Node.js test runner
  const nodeCrypto = await import('node:crypto');
  return nodeCrypto.createHash('sha256').update(salted).digest('hex');
}
```

### 2.2. Aprovisionamiento Seguro de Cuentas Institucionales
El catálogo inicial de cuentas no incluye contraseñas en texto claro dentro del repositorio de git ni en el empaquetado de Vite. Las identidades se validan exclusivamente contra su respectivo hash criptográfico SHA-256 generado con la sal fija del sistema (`AUTH_SALT`).

Para entornos locales o de prueba, las contraseñas se configuran de forma segura en almacenamiento local mediante:
```typescript
await authService.setLocalPassword(userId, newPassword);
```
Este método genera el hash en tiempo de ejecución en el cliente y lo almacena localmente, evitando introducir credenciales o secretos en commits.

---

## 3. Catálogo Canónico de Cuentas y Asignación de Roles

| ID Usuario | Nombre Completo | Correo Corporativo | Rol Principal | Rol Secundario | Proyectos Asignados |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **USR-001** | Joan Cristian Medina Quispe | `jmedina@exodo.pe` | **PU-02** (Gestor) | **PU-01** (Solicitante) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-002** | Renzo Antonio Antayhua Mamani | `rantayhua@exodo.pe` | **PU-03** (Arquitecto) | **PU-06** (Desarrollador) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-003** | Augusto Joaquin Rivera Muñoz | `arivera@exodo.pe` | **PU-05** (Bibliotecario)| **PU-07** (Calidad/QA) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-004** | Renzo Fernando Loyola Vilca Choque | `rloyola@exodo.pe` | **PU-04** (CCB) | *(Ninguno)* | PRJ-001, PRJ-002 *(Veto: PRJ-003)* |

### 3.1. Política de Un Solo Rol Efectivo por Sesión
A fin de erradicar la ambigüedad operacional y las violaciones a la Segregación de Funciones (SoD), TraceFlow SCM aplica la política de **Un Solo Rol Efectivo**:
* Una cuenta con múltiples roles asignados (p. ej., `USR-001` con PU-02 y PU-01) debe elegir explícitamente en qué capacidad operará durante la sesión activa.
* Si el usuario no selecciona rol, se adopta su rol principal por defecto.
* La interfaz, el menú lateral y las guardas de ruta se configuran exclusivamente en función del `activeRoleId` resultante.
* Queda terminantemente prohibido alterar el rol activo en caliente sin re-autenticar o pasar por un flujo formal de conmutación restringido a `assignedRoleIds`.

---

## 4. Gestión del Ciclo de Vida de la Sesión

### 4.1. Estructura de la Sesión Persistida
La sesión se almacena bajo la clave `traceflow_session_v2` con la siguiente firma de metadatos:

```typescript
interface PersistedSessionData {
  userId: string;
  userEmail: string;
  activeRoleId: CanonicalRoleId;
  sessionToken: string;
  issuedAt: string;
  expiresAt: string;
}
```

### 4.2. Validación y Restauración de Sesión
Al recargar la aplicación en el navegador:
1. `validatePersistedSession()` lee el registro en almacenamiento local.
2. Comprueba que el usuario exista en el catálogo corporativo.
3. Comprueba que `expiresAt > new Date().toISOString()`.
4. Comprueba que `activeRoleId` forme parte de los roles asignados a dicho usuario.
5. Si cualquiera de estas validaciones falla, se purga la sesión y se redirige a la pantalla de acceso.

### 4.3. Cierre de Sesión Seguro
La función `logout()` del servicio y del store:
* Invalida los datos de usuario en memoria de Zustand.
* Elimina la clave de sesión del almacenamiento local.
* Registra el evento de auditoría correspondiente con marca temporal e integridad SHA-256.

---

## 5. Declaración de Limitaciones de Seguridad y Dependencias de Backend

> [!WARNING] **AVISO DE SEGURIDAD EMPRESARIAL Y DEPENDENCIAS PENDIENTES DE BACKEND**  
> El presente módulo de autenticación y autorización implementa las mejores prácticas para una aplicación de cliente enriquecido (SPA en React/TypeScript), resolviendo los fallos de diseño del prototipo académico.  
> Sin embargo, **ningún frontend cliente puede ser declarado seguro para producción sin un servicio de backend confiable**.

### 5.1. Limitaciones Inherentes al Entorno Cliente (Frontend SPA):
1. **Validación Criptográfica en Navegador:** La verificación del hash de contraseña se ejecuta en el motor de JavaScript del cliente. Aunque el código no expone contraseñas en texto claro, un atacante con acceso a las herramientas de desarrollo del navegador podría modificar el flujo en memoria (`window` o debugger).
2. **Almacenamiento Local de Sesión (`localStorage`):** El almacenamiento web en navegador es susceptible a ataques de Cross-Site Scripting (XSS) si se introducen vulnerabilidades en paquetes de terceros.
3. **Persistencia de Datos en Mock:** Los estados de proyectos, RFC y auditoría residen en el almacenamiento local del navegador, sin un motor transaccional ACID concurrente.

### 5.2. Requisitos Mandatorios para Entorno de Producción Real:
Para la puesta en producción definitiva de TraceFlow SCM en la infraestructura corporativa de ÉXODO S.A.C., se requiere implementar:
1. **API Backend Confiable (Node.js / Go / Spring Boot / .NET):**
   - Validación de credenciales mediante algoritmos de derivación de claves robustos en servidor (`Argon2id` o `bcrypt` con costo $\ge 12$).
   - Generación de sesiones mediante tokens JWT o identificadores de sesión firmados por servidor.
   - Envío de credenciales y tokens mediante cookies seguras con directivas `HttpOnly`, `Secure` y `SameSite=Strict`.
2. **Políticas de Control de Acceso en API (Server-Side RBAC & SoD):**
   - Toda llamada HTTP (`POST /api/rfcs`, `POST /api/ccb/votes`, etc.) debe verificar en el servidor la identidad del remitente, su rol y su asignación de proyecto antes de ejecutar cualquier transacción en la base de datos PostgreSQL.
3. **Pistas de Auditoría Inmutables en Base de Datos:**
   - La bitácora forense de auditoría debe persistir en una base de datos relacional con tablas de sólo inserción (*append-only*), sellado de tiempo criptográfico y firmas de integridad respaldadas en HSM o KMS empresarial.
