-- ============================================================================
-- TRACEFLOW SCM — SEMILLAS INICIALES CANÓNICAS (DEMO EMPRESARIAL ÉXODO S.A.C.)
-- Archivo: 202611250002_initial_seeds.sql
-- Hito: DB-01 — PostgreSQL + Supabase MCP + Backend NestJS + Primer Flujo Real
-- ============================================================================

-- 1. CATÁLOGO DE ROLES CANÓNICOS (PU-01 a PU-07)
INSERT INTO traceflow.app_role (id, code, name, description) VALUES
(1, 'PU-01', 'Solicitante', 'Registra Solicitudes de Cambio (RFC), subsana observaciones y reporta incidencias de software.'),
(2, 'PU-02', 'Analista / Gestor de Configuración', 'Valida completitud, clasifica solicitudes, gestiona proyectos y co-autoriza cambios menores.'),
(3, 'PU-03', 'Arquitecto / Especialista Técnico', 'Emite Informes Técnicos de Impacto y co-autoriza cambios menores (Doble Llave).'),
(4, 'PU-04', 'Comité de Control de Cambios (CCB)', 'Órgano decisional supremo; delibera colegiadamente y emite resoluciones vinculantes (ECN/ECO).'),
(5, 'PU-05', 'Bibliotecario / Administrador SCM', 'Custodio oficial de las tres bibliotecas; ejecuta Check-In a Maestra, bloqueos y congelamientos.'),
(6, 'PU-06', 'Desarrollador / Ingeniero de Software', 'Ejecuta cambios aprobados en la Biblioteca de Trabajo e implementa soluciones técnicas autorizadas.'),
(7, 'PU-07', 'Calidad / Equipo de Testing (QA)', 'Ejecuta pruebas de conformidad, reporta no conformidades y emite Certificados de Conformidad Técnica.')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. USUARIOS INSTITUCIONALES (ÉXODO S.A.C.)
-- Contraseña unificada para entorno de demostración: 'TraceFlow2026!'
-- Hash Argon2id estándar seguro:
-- $argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I
INSERT INTO traceflow.app_user (id, code, username, email, password_hash, full_name, organization, position, status) VALUES
('a0000001-0000-0000-0000-000000000001', 'USR-001', 'jmedina', 'jmedina@exodo.pe', '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I', 'Joan Cristian Medina Quispe', 'ÉXODO S.A.C.', 'Director de Calidad y Procesos', 'ACTIVE'),
('a0000001-0000-0000-0000-000000000002', 'USR-002', 'rantayhua', 'rantayhua@exodo.pe', '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I', 'Renzo Antonio Antayhua Mamani', 'ÉXODO S.A.C.', 'Arquitecto de Software Principal', 'ACTIVE'),
('a0000001-0000-0000-0000-000000000003', 'USR-003', 'arivera', 'arivera@exodo.pe', '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I', 'Augusto Joaquin Rivera Muñoz', 'ÉXODO S.A.C.', 'Jefe de SCM y Aseguramiento', 'ACTIVE'),
('a0000001-0000-0000-0000-000000000004', 'USR-004', 'rloyola', 'rloyola@exodo.pe', '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I', 'Renzo Fernando Loyola Vilca Choque', 'ÉXODO S.A.C.', 'Coordinador de Proyectos y CCB', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;

-- 3. ASIGNACIONES DE ROLES (Matriz SoD canónica)
INSERT INTO traceflow.user_role_assignment (user_id, role_id, is_primary) VALUES
-- USR-001: Gestor (PU-02, primario) y Solicitante (PU-01)
('a0000001-0000-0000-0000-000000000001', 2, TRUE),
('a0000001-0000-0000-0000-000000000001', 1, FALSE),
-- USR-002: Arquitecto (PU-03, primario) y Desarrollador (PU-06)
('a0000001-0000-0000-0000-000000000002', 3, TRUE),
('a0000001-0000-0000-0000-000000000002', 6, FALSE),
-- USR-003: Bibliotecario (PU-05, primario) y Calidad QA (PU-07)
('a0000001-0000-0000-0000-000000000003', 5, TRUE),
('a0000001-0000-0000-0000-000000000003', 7, FALSE),
-- USR-004: Miembro CCB (PU-04, exclusivo)
('a0000001-0000-0000-0000-000000000004', 4, TRUE)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. PROYECTOS CLIENTES
INSERT INTO traceflow.project (id, code, project_key, name, description, client_name, status, active_baseline_version, manager_id, architect_id, librarian_id, created_by) VALUES
('b0000001-0000-0000-0000-000000000001', 'PRJ-001', 'EXO-CORE', 'Pasarela de Pagos Core', 'Plataforma central transaccional, enrutamiento bancario, tokenización y conciliación financiera en tiempo real.', 'Banco Regional del Sur', 'ACTIVE', 'v1.2.0', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001'),
('b0000001-0000-0000-0000-000000000002', 'PRJ-002', 'EXO-PORTAL', 'Portal Autoservicio Clientes', 'Aplicación web interactiva SPA para consulta de pólizas, descarga de estados de cuenta y registro de reclamos.', 'Financiera CrediSur', 'ACTIVE', 'v2.0.1', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001'),
('b0000001-0000-0000-0000-000000000003', 'PRJ-003', 'EXO-SUNAT', 'Módulo de Facturación Electrónica', 'Servicio de integración para emisión de comprobantes de pago electrónicos en formato XML UBL 2.1 con certificación OSE.', 'Corporación Minera Andina', 'ACTIVE', 'v1.0.0', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 5. ASIGNACIONES MULTITENANT DE PROYECTO
-- Nótese: USR-004 tiene acceso exclusivamente a PRJ-001 y PRJ-002; PRJ-003 está expresamente vetado (ADR-006 / RBAC Matrix)
INSERT INTO traceflow.user_project_assignment (user_id, project_id) VALUES
('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002'),
('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003'),
('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002'),
('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003'),
('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002'),
('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003'),
('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002')
ON CONFLICT (user_id, project_id) DO NOTHING;

-- 6. ELEMENTOS DE CONFIGURACIÓN (ECS)
INSERT INTO traceflow.config_item (id, project_id, code, name, description, item_type, current_library, current_version, file_path, sha256_checksum, is_locked, author_id) VALUES
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'SRC-AUTH-JWT.ts', 'Módulo de Autenticación y Firma JWT', 'Controlador y servicio de validación criptográfica de tokens portadores para la API transaccional.', 'CODIGO_FUENTE', 'TRABAJO', '1.2.1', 'src/modules/auth/jwt.service.ts', '8f4c2e6b9a1d3f5e7c8b0a2d4f6e8c0b2a4d6f8e0c2b4a6d8f0e2c4b6a8d0f2e', TRUE, 'a0000001-0000-0000-0000-000000000002'),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'DB-SCHEMA-PAYMENTS.sql', 'Esquema Relacional de Transacciones y Asientos', 'Definición DDL de tablas transaccionales, particiones mensuales e índices condicionales.', 'ESQUEMA_BD', 'SOPORTE', '1.2.0', 'database/migrations/20260901_payments_schema.sql', '4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b', FALSE, 'a0000001-0000-0000-0000-000000000002'),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'DOC-ARCH-INTEGRATION.pdf', 'Especificación de Interoperabilidad con Redes Bancarias', 'Documento normativo de arquitectura de integración con switch interbancario.', 'DOCUMENTO_TECNICO', 'MAESTRA', '1.2.0', 'docs/architecture/interbank_spec_v1.2.pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', FALSE, 'a0000001-0000-0000-0000-000000000002'),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'DEPLOY-DOCKER-CORE.yaml', 'Manifiesto de Despliegue de Contenedores y Red', 'Configuración Docker Compose y parámetros de réplicas de los microservicios core.', 'SCRIPT_DESPLIEGUE', 'MAESTRA', '1.2.0', 'deploy/docker-compose.production.yml', '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', FALSE, 'a0000001-0000-0000-0000-000000000003'),
('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002', 'SRC-UI-CLAIM-FORM.tsx', 'Componente Formulario de Reclamos y Solicitudes', 'Formulario con validación asíncrona y adjuntos de comprobantes para clientes.', 'CODIGO_FUENTE', 'SOPORTE', '2.0.1', 'src/components/claims/ClaimForm.tsx', '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b', FALSE, 'a0000001-0000-0000-0000-000000000004'),
('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000003', 'SRV-UBL-VALIDATOR.ts', 'Servicio de Validación de Esquemas XML SUNAT', 'Motor de verificación sintáctica y firmas digitales XMLDSig para comprobantes.', 'CODIGO_FUENTE', 'MAESTRA', '1.0.0', 'src/services/ubl/validator.ts', '1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e', FALSE, 'a0000001-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 7. SOLICITUDES DE CAMBIO INICIALES (RFC)
INSERT INTO traceflow.change_request (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by) VALUES
('d0000001-0000-0000-0000-000000000001', 'RFC-2026-0001', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Migración del Mecanismo Criptográfico de Credenciales a Argon2id', 'Actualización del algoritmo de hashing de contraseñas de bcrypt a Argon2id con parámetros recomendados OWASP para mitigar ataques GPU.', 'Cumplimiento mandatorio de la circular de seguridad SBS N° G-140-2025 para entidades financieras.', 'ALTA', 'CAMBIO_MAYOR', 'IMPLEMENTADA', 'a0000001-0000-0000-0000-000000000001'),
('d0000001-0000-0000-0000-000000000002', 'RFC-2026-0002', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Rotación Automática y Control de Expiración de Llaves Asimétricas RS256', 'Implementar el servicio de recambio de claves públicas/privadas RSA cada 30 días con caché de revocación instantánea.', 'Evitar interrupciones operativas durante auditorías semestrales de la pasarela.', 'MEDIA', 'CAMBIO_MENOR', 'EN_IMPLEMENTACION', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 8. PISTA DE AUDITORÍA INICIAL (GÉNESIS)
SELECT traceflow.append_audit_log(
    'EVT-2026-0000',
    'a0000001-0000-0000-0000-000000000001',
    'PU-02',
    'SISTEMA_INICIALIZACION_GCSW',
    'traceflow_system',
    '00000000-0000-0000-0000-000000000000',
    'b0000001-0000-0000-0000-000000000001',
    NULL,
    'SUCCESS',
    '{"message": "Génesis del esquema relacional y catálogo maestro TraceFlow SCM", "milestone": "DB-01"}'::jsonb,
    '127.0.0.1',
    'TraceFlow Migration Engine'
);
