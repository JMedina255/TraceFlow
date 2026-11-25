-- ============================================================================
-- TRACEFLOW SCM — SEMILLAS ESTRUCTURALES CANÓNICAS (CATÁLOGO DE ROLES)
-- Archivo: 202611250002_structural_seeds.sql
-- Hito: DB-01.1 — Endurecimiento y Separación de Semillas Estructurales (H-02)
-- Marco Normativo: SAD v1.1 Sección 2.2, ADR-003, ADR-006, RBAC Access Matrix
-- ============================================================================

-- CATÁLOGO DE ROLES CANÓNICOS (PU-01 a PU-07)
-- Estos registros representan la taxonomía inmutable de roles de seguridad del sistema.
-- NO contienen credenciales, hashes de contraseña ni datos de usuarios personales.
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
