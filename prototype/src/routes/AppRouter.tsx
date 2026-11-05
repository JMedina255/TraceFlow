import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleGuard } from '../components/auth/RoleGuard';
import { LoginView } from '../features/auth/LoginView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { RfcCreateView } from '../features/rfcs/RfcCreateView';
import { RfcListView } from '../features/rfcs/RfcListView';
import { RfcDetailView } from '../features/rfcs/RfcDetailView';
import { RfcEditView } from '../features/rfcs/RfcEditView';
import { RfcImpactAnalysisView } from '../features/rfcs/RfcImpactAnalysisView';
import { RfcMinorApprovalView } from '../features/rfcs/RfcMinorApprovalView';
import { ScreenPlaceholder } from '../components/common/ScreenPlaceholder';
import { NotFoundView } from '../features/notFound/NotFoundView';
import { ROUTES_METADATA } from './navigation';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Portal de Acceso y Selección de Rol Efectivo */}
        <Route path="/login" element={<LoginView />} />

        {/* Rutas Privadas: Requieren Sesión Activa */}
        <Route element={<ProtectedRoute />}>
          {/* Shell Global Persistente (AppLayout) */}
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

            {/* 5. Control de Cambios: Bandeja y Expediente de RFCs */}
            <Route path="/rfcs" element={<RfcListView />} />
            <Route path="/rfcs/:rfcId" element={<RfcDetailView />} />

            {/* Rutas Restringidas: Exclusivo Solicitante (PU-01) */}
            <Route element={<RoleGuard allowedRoles={['PU-01']} moduleName="Registro y Subsanación de RFCs" />}>
              <Route path="/rfcs/new" element={<RfcCreateView />} />
              <Route path="/rfcs/:rfcId/edit" element={<RfcEditView />} />
              <Route
                path="/rfcs/:rfcId/uat"
                element={
                  <ScreenPlaceholder
                    meta={ROUTES_METADATA['/rfcs/:rfcId/uat']}
                    relatedRoutes={[
                      { label: 'Volver a Bandeja de RFCs', path: '/rfcs' },
                      { label: 'Ver Expediente RFC-2026-0001', path: '/rfcs/RFC-2026-0001' },
                      { label: 'Ir a Operaciones SCM (Check-In)', path: '/scm/operations' },
                    ]}
                  />
                }
              />
            </Route>

            {/* Rutas Restringidas: Exclusivo Arquitecto / Evaluador Técnico (PU-03) */}
            <Route element={<RoleGuard allowedRoles={['PU-03']} moduleName="Análisis de Impacto Técnico" />}>
              <Route
                path="/rfcs/:rfcId/impact-analysis"
                element={<RfcImpactAnalysisView />}
              />
            </Route>

            {/* Rutas Restringidas: Exclusivo Comité de Control de Cambios CCB (PU-04) */}
            <Route element={<RoleGuard allowedRoles={['PU-04']} moduleName="Deliberación Colegiada del CCB" />}>
              <Route
                path="/rfcs/:rfcId/ccb-deliberation"
                element={
                  <ScreenPlaceholder
                    meta={ROUTES_METADATA['/rfcs/:rfcId/ccb-deliberation']}
                    relatedRoutes={[
                      { label: 'Volver a Bandeja de RFCs', path: '/rfcs' },
                      { label: 'Ver Expediente RFC-2026-0001', path: '/rfcs/RFC-2026-0001' },
                      { label: 'Ver Orden Emitida (ECN-2026-0001)', path: '/ecns/ECN-2026-0001' },
                    ]}
                  />
                }
              />
            </Route>

            {/* Rutas Restringidas: Aprobación de Cambio Menor (PU-02, PU-03) */}
            <Route element={<RoleGuard allowedRoles={['PU-02', 'PU-03']} moduleName="Aprobación de Cambio Menor" />}>
              <Route
                path="/rfcs/:rfcId/minor-approval"
                element={<RfcMinorApprovalView />}
              />
            </Route>

            {/* 5. Control de Cambios: Órdenes (ECN) */}
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

            {/* Rutas Restringidas: Exclusivo Aseguramiento de Calidad QA (PU-07) */}
            <Route element={<RoleGuard allowedRoles={['PU-07']} moduleName="Validación y Pruebas QA" />}>
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
            </Route>

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

            {/* Rutas Restringidas: Exclusivo Bibliotecario SCM (PU-05) */}
            <Route element={<RoleGuard allowedRoles={['PU-05']} moduleName="Operaciones SCM y Líneas Base" />}>
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
              <Route
                path="/admin/users"
                element={
                  <ScreenPlaceholder
                    meta={ROUTES_METADATA['/admin/users']}
                  />
                }
              />
            </Route>

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

            {/* Ruta 404 para cualquier ruta no mapeada dentro del Layout */}
            <Route path="*" element={<NotFoundView />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
