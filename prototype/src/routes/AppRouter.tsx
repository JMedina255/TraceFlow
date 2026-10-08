import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginView } from '../features/auth/LoginView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { RfcCreateView } from '../features/rfcs/RfcCreateView';
import { ScreenPlaceholder } from '../components/common/ScreenPlaceholder';
import { NotFoundView } from '../features/notFound/NotFoundView';
import { ROUTES_METADATA } from './navigation';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública Independiente: Portal de Acceso (SCREEN-01 / WF-01) */}
        <Route path="/login" element={<LoginView />} />

        {/* Rutas con Shell Global Persistente (AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />

          {/* 2. Gestión de Proyectos */}
          <Route
            path="/projects"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/projects']}
                relatedRoutes={[
                  { label: 'Ver Ficha de Proyecto (PRJ-001)', path: '/projects/PRJ-001' },
                ]}
              />
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/projects/:projectId']}
                relatedRoutes={[
                  { label: 'Volver a Directorio de Proyectos', path: '/projects' },
                ]}
              />
            }
          />

          {/* 5. Control de Cambios: Solicitudes (RFC) */}
          <Route
            path="/rfcs"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs']}
                relatedRoutes={[
                  { label: 'Registrar Nueva RFC (WF-07)', path: '/rfcs/new' },
                  { label: 'Ver Expediente RFC-2026-0042 (WF-06)', path: '/rfcs/RFC-2026-0042' },
                ]}
              />
            }
          />
          <Route path="/rfcs/new" element={<RfcCreateView />} />

          <Route
            path="/rfcs/:rfcId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId']}
                relatedRoutes={[
                  { label: 'Subsanación de RFC (WF-07)', path: '/rfcs/RFC-2026-0042/edit' },
                  { label: 'Análisis de Impacto Técnico (WF-08)', path: '/rfcs/RFC-2026-0042/impact-analysis' },
                  { label: 'Sala de Deliberación CCB (WF-09)', path: '/rfcs/RFC-2026-0042/ccb-deliberation' },
                  { label: 'Autorización Cambio Menor (WF-10)', path: '/rfcs/RFC-2026-0042/minor-approval' },
                  { label: 'Suscripción Acta UAT (WF-16)', path: '/rfcs/RFC-2026-0042/uat' },
                  { label: 'Validación QA / No Conformidades (WF-15)', path: '/qa/validation/RFC-2026-0042' },
                ]}
              />
            }
          />
          <Route
            path="/rfcs/:rfcId/edit"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId/edit']}
                relatedRoutes={[
                  { label: 'Volver a Expediente 360°', path: '/rfcs/RFC-2026-0042' },
                ]}
              />
            }
          />
          <Route
            path="/rfcs/:rfcId/impact-analysis"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId/impact-analysis']}
                relatedRoutes={[
                  { label: 'Volver a Expediente 360°', path: '/rfcs/RFC-2026-0042' },
                  { label: 'Pasar a Deliberación CCB', path: '/rfcs/RFC-2026-0042/ccb-deliberation' },
                ]}
              />
            }
          />
          <Route
            path="/rfcs/:rfcId/ccb-deliberation"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId/ccb-deliberation']}
                relatedRoutes={[
                  { label: 'Volver a Expediente 360°', path: '/rfcs/RFC-2026-0042' },
                  { label: 'Ver Orden Emitida (ECN-2026-0015)', path: '/ecns/ECN-2026-0015' },
                ]}
              />
            }
          />
          <Route
            path="/rfcs/:rfcId/minor-approval"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId/minor-approval']}
                relatedRoutes={[
                  { label: 'Volver a Expediente 360°', path: '/rfcs/RFC-2026-0042' },
                ]}
              />
            }
          />
          <Route
            path="/rfcs/:rfcId/uat"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/rfcs/:rfcId/uat']}
                relatedRoutes={[
                  { label: 'Volver a Expediente 360°', path: '/rfcs/RFC-2026-0042' },
                  { label: 'Ir a Operaciones SCM (Check-In)', path: '/scm/operations' },
                ]}
              />
            }
          />

          {/* 5. Control de Cambios: Órdenes (ECN) y Calidad (QA) */}
          <Route
            path="/ecns"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/ecns']}
                relatedRoutes={[
                  { label: 'Ver Ficha de Orden ECN-2026-0015', path: '/ecns/ECN-2026-0015' },
                ]}
              />
            }
          />
          <Route
            path="/ecns/:ecnId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/ecns/:ecnId']}
                relatedRoutes={[
                  { label: 'Volver a Bandeja de Órdenes', path: '/ecns' },
                  { label: 'Ejecutar Check-Out en SCM', path: '/scm/operations' },
                ]}
              />
            }
          />
          <Route
            path="/qa/validation/:rfcId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/qa/validation/:rfcId']}
                relatedRoutes={[
                  { label: 'Expediente RFC-2026-0042', path: '/rfcs/RFC-2026-0042' },
                  { label: 'Centro de Aceptación UAT', path: '/rfcs/RFC-2026-0042/uat' },
                ]}
              />
            }
          />

          {/* 3. Gestión de Configuración (ECS) */}
          <Route
            path="/ecs"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/ecs']}
                relatedRoutes={[
                  { label: 'Ver Ficha de ECS-001', path: '/ecs/ECS-001' },
                  { label: 'Ver Historial y Diff de ECS-001', path: '/ecs/ECS-001/history' },
                ]}
              />
            }
          />
          <Route
            path="/ecs/:ecsId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/ecs/:ecsId']}
                relatedRoutes={[
                  { label: 'Historial de Versiones y Diff', path: '/ecs/ECS-001/history' },
                  { label: 'Volver al Catálogo de ECS', path: '/ecs' },
                ]}
              />
            }
          />
          <Route
            path="/ecs/:ecsId/history"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/ecs/:ecsId/history']}
                relatedRoutes={[
                  { label: 'Volver a Ficha del ECS', path: '/ecs/ECS-001' },
                ]}
              />
            }
          />

          {/* 4. Gestión de Bibliotecas */}
          <Route
            path="/scm/operations"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/scm/operations']}
                relatedRoutes={[
                  { label: 'Ver Catálogo de ECS', path: '/ecs' },
                  { label: 'Ver Líneas Base y Rollback', path: '/baselines' },
                ]}
              />
            }
          />
          <Route
            path="/baselines"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/baselines']}
                relatedRoutes={[
                  { label: 'Operaciones Check-Out / Check-In', path: '/scm/operations' },
                ]}
              />
            }
          />

          {/* 6. Soporte e Incidencias */}
          <Route
            path="/incidents"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/incidents']}
                relatedRoutes={[
                  { label: 'Ver Ficha de Incidencia INC-2026-0008', path: '/incidents/INC-2026-0008' },
                ]}
              />
            }
          />
          <Route
            path="/incidents/:incidentId"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/incidents/:incidentId']}
                relatedRoutes={[
                  { label: 'Volver a Mesa de Incidencias', path: '/incidents' },
                ]}
              />
            }
          />

          {/* 7. Trazabilidad y Auditoría */}
          <Route
            path="/audit"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/audit']}
                relatedRoutes={[
                  { label: 'Generador de Reportes SCM', path: '/reports' },
                ]}
              />
            }
          />

          {/* 8. Reportes */}
          <Route
            path="/reports"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/reports']}
                relatedRoutes={[
                  { label: 'Bitácora Forense SHA-256', path: '/audit' },
                ]}
              />
            }
          />

          {/* 1. Gobernanza y Seguridad: Usuarios y Roles */}
          <Route
            path="/admin/users"
            element={
              <ScreenPlaceholder
                meta={ROUTES_METADATA['/admin/users']}
              />
            }
          />

          {/* Ruta 404 para cualquier ruta no mapeada dentro del Layout */}
          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
