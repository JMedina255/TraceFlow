import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { CANONICAL_ROLES, type CanonicalRoleId } from '../../types';
import { 
  ShieldCheck, 
  Layers, 
  GitBranch, 
  Users, 
  Terminal, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Cpu,
  Lock
} from 'lucide-react';

export const FoundationView: React.FC = () => {
  const { currentUser, activeRoleId, switchRole } = useAuthStore();

  const roleKeys: CanonicalRoleId[] = [
    'PU-01',
    'PU-02',
    'PU-03',
    'PU-04',
    'PU-05',
    'PU-06',
    'PU-07',
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              TraceFlow SCM <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">Fase II</span>
            </h1>
            <p className="text-xs text-slate-400">Sistema de Gestión de Configuración de Software — ÉXODO S.A.C.</p>
          </div>
        </div>

        {/* Current User Badge */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-200">{currentUser?.fullName}</p>
            <p className="text-xs text-indigo-400 font-mono">{currentUser?.roleLabel}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm text-white">
            {currentUser?.fullName.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* Foundation Card */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Arquitectura Base Inicializada
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                React SPA Foundation Operativa
              </h2>
              <p className="text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Se han configurado exitosamente el entorno React 19, TypeScript, Vite, Tailwind CSS, 
                Zustand, Lucide Icons y las definiciones de tipos normativas conforme a las especificaciones 
                de los documentos <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">FD03</code>, 
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">FD04</code> y 
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">FD05</code>.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> Node.js 24 LTS</span>
              <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-indigo-400" /> React 19 + TypeScript</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 7 Roles Canónicos</span>
            </div>
          </div>
        </section>

        {/* Live Role Switcher Test */}
        <section className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Probador de Roles Canónicos (Zustand Store)
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona un rol canónico para verificar la reactividad del estado global.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Actor Activo: <strong className="text-indigo-400">{activeRoleId}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roleKeys.map((key) => {
              const def = CANONICAL_ROLES[key];
              const isSelected = activeRoleId === key;
              return (
                <button
                  key={key}
                  onClick={() => switchRole(key)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                      : 'bg-slate-900/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{def.id}</span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {def.technicalLevel}
                    </span>
                  </div>
                  <div className="font-medium text-sm mt-1 text-slate-100">{def.label}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">{def.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Technical Architecture Modules Verified */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 border border-slate-700/60 rounded-lg p-5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
              <Layers className="w-4 h-4" /> 8 Paquetes de DG-04
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Módulos definidos: Gobernanza, Proyectos, SCM Core (ECS), Bibliotecas, Control de Cambios, Soporte, Trazabilidad/Auditoría y Reportes.
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/60 rounded-lg p-5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
              <Lock className="w-4 h-4" /> 14 Estados de RFC (DG-11)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catálogo estricto desde <span className="text-slate-300">Registrada</span> hasta los 4 estados terminales: <span className="text-slate-300">Implementada, Rechazada, Desestimada y Cancelada</span>.
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/60 rounded-lg p-5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
              <Terminal className="w-4 h-4" /> Siguiente Hito (Fase III)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Construcción del Shell Global corporativo (<span className="text-slate-300">GlobalShell</span>, Sidebar, Topbar, Breadcrumbs) y navegación de rutas.
            </p>
          </div>
        </section>

        {/* Status Footer */}
        <footer className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <span>TraceFlow SCM — C-SharkTeam (Medina, Antayhua, Loyola, Rivera) &copy; 2026</span>
          <span className="flex items-center gap-1 text-slate-400">
            Listo para Fase III <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </span>
        </footer>
      </main>
    </div>
  );
};
