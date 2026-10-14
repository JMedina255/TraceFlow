import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitBranch, 
  Bell, 
  LogOut, 
  FolderGit2, 
  Menu, 
  X, 
  ChevronDown, 
  RotateCcw,
  Check,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useRfcStore } from '../../store/useRfcStore';
import { useDemoStore } from '../../store/useDemoStore';
import { CANONICAL_ROLES } from '../../types';

interface TopbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    availableDemoUsers, 
    activeRoleId, 
    switchUser, 
    switchRole, 
    logout 
  } = useAuthStore();

  const { projects, activeProject, setActiveProject } = useProjectStore();
  const { getRfcsByProject } = useRfcStore();
  const { resetAllDemoData } = useDemoStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Derivar notificaciones contextuales del proyecto activo
  const projectRfcs = getRfcsByProject(activeProject.id);
  const pendingRfcs = projectRfcs.filter((r) => 
    ['REGISTRADA', 'EN_ANALISIS_TECNICO', 'EN_EVALUACION', 'EN_PRUEBAS'].includes(r.status)
  );

  const handleResetDemo = () => {
    resetAllDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-upt-institutional border-b border-upt-primary/60 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
      {/* Lado Izquierdo: Menú Hamburguesa + Marca + Selector de Proyecto */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Botón Toggle Sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-upt-bright cursor-pointer"
          title={isSidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Identidad Institucional */}
        <div className="flex items-center gap-2.5">
          <div className="bg-upt-bright text-white p-1.5 rounded-lg shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">TraceFlow SCM</span>
              <span className="hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-upt-primary text-blue-100 border border-white/20">
                ÉXODO S.A.C.
              </span>
            </div>
            <p className="text-[10px] text-blue-200 hidden sm:block">Control de Configuración de Software</p>
          </div>
        </div>

        {/* Separador */}
        <div className="hidden lg:block h-6 w-px bg-white/20 mx-1" />

        {/* Selector Interactivo de Proyecto Activo (Aislamiento Multitenant) */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-upt-primary/70 border border-white/15 hover:border-white/30 text-xs transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-upt-bright text-white"
            title="Cambiar proyecto activo"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-upt-yellow shrink-0" />
            <div className="hidden sm:block">
              <span className="text-blue-200 text-[11px] mr-1">Proyecto:</span>
              <span className="font-medium text-white truncate max-w-[140px] inline-block align-bottom">
                {activeProject.name}
              </span>
            </div>
            <span className="font-mono text-[10px] text-blue-100 bg-upt-institutional px-1 py-0.5 rounded border border-white/10">
              {activeProject.code}
            </span>
            <ChevronDown className="w-3 h-3 text-blue-200" />
          </button>

          {/* Menú Desplegable de Selección de Proyecto */}
          {showProjectMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-upt-surface border border-upt-border rounded-xl shadow-xl p-2 z-50 text-upt-text">
              <div className="px-2 py-1.5 border-b border-upt-border mb-1 text-[11px] font-semibold text-upt-text-secondary uppercase tracking-wider">
                Seleccionar Proyecto Aislado
              </div>
              <div className="space-y-1">
                {projects.map((proj) => {
                  const isSelected = proj.id === activeProject.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj.id);
                        setShowProjectMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-upt-primary border border-upt-bright/40 font-medium'
                          : 'text-upt-text hover:bg-upt-bg'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium text-upt-text flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-upt-bright" />}
                        </div>
                        <div className="text-[10px] text-upt-muted mt-0.5 truncate">
                          Cliente: {proj.client}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-upt-text-secondary bg-upt-bg px-1.5 py-0.5 rounded shrink-0 ml-2">
                        {proj.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lado Derecho: Restablecer Demo + Notificaciones + Selector de Usuario */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Botón de Restablecimiento de Datos Demo */}
        <button
          onClick={handleResetDemo}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
            resetSuccess
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
              : 'bg-upt-primary/70 border border-white/15 text-blue-100 hover:text-white hover:border-white/30'
          }`}
          title="Restablecer todos los datos simulados al estado inicial"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetSuccess ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">
            {resetSuccess ? '¡Datos Reiniciados!' : 'Reset Demo'}
          </span>
        </button>

        {/* Notificaciones Reales del Proyecto */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-upt-bright cursor-pointer"
            title="Alertas de flujo del proyecto activo"
            aria-label="Abrir panel de notificaciones"
          >
            <Bell className="w-4 h-4" />
            {pendingRfcs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-upt-yellow ring-2 ring-upt-institutional" />
            )}
          </button>

          {/* Popover de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-upt-surface border border-upt-border rounded-xl shadow-xl p-4 z-50 text-upt-text">
              <div className="flex items-center justify-between pb-3 border-b border-upt-border mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-upt-text">Alertas del Proyecto</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {pendingRfcs.length} pendientes
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-upt-muted hover:text-upt-text text-xs cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pendingRfcs.length > 0 ? (
                  pendingRfcs.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg border bg-upt-bg/50 border-upt-border text-upt-text text-xs"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-upt-primary font-mono text-[11px] font-bold">{r.code}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-upt-secondary border border-blue-200">
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-1 text-upt-text-secondary leading-snug line-clamp-2">{r.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-upt-muted py-4 text-center">
                    No hay solicitudes pendientes de atención en este proyecto.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-white/20" />

        {/* Selector de Usuario e Identidad Demo (C-SharkTeam) */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-lg hover:bg-white/10 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-upt-bright cursor-pointer"
            aria-label="Menú de usuario"
          >
            <div className="w-8 h-8 rounded-full bg-upt-bright border border-white/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {currentUser?.fullName.charAt(0) || 'U'}
            </div>

            <div className="hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser?.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-upt-yellow font-medium">
                  {activeRoleId}
                </span>
                <span className="text-[10px] text-blue-200 truncate max-w-[130px]">
                  {CANONICAL_ROLES[activeRoleId]?.label || currentUser?.roleLabel}
                </span>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-blue-200 hidden sm:block" />
          </button>

          {/* Menú Desplegable de Conmutación de Usuario y Rol Demo */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-upt-surface border border-upt-border rounded-xl shadow-xl p-3 z-50 text-upt-text">
              <div className="pb-3 border-b border-upt-border mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-upt-muted tracking-wider">
                    Identidad Activa (Demo)
                  </span>
                  <span className="text-[10px] text-upt-primary font-mono font-semibold">C-SharkTeam</span>
                </div>
                <p className="text-xs font-bold text-upt-text mt-1">{currentUser?.fullName}</p>
                <p className="text-[11px] text-upt-muted">{currentUser?.email}</p>
              </div>

              {/* Conmutador de Rol Autorizado para esta Identidad */}
              <div className="py-2 border-b border-upt-border mb-2">
                <span className="text-[10px] font-semibold text-upt-text-secondary block mb-1.5">
                  Cambiar Rol Activo (SoD):
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {currentUser.allowedRoleIds.map((rId) => {
                    const rDef = CANONICAL_ROLES[rId];
                    const isSelected = activeRoleId === rId;
                    return (
                      <button
                        key={rId}
                        onClick={() => switchRole(rId)}
                        className={`px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-upt-primary border-upt-primary text-white font-medium shadow-xs'
                            : 'bg-upt-bg/50 border-upt-border text-upt-text hover:bg-upt-bg'
                        }`}
                      >
                        <div className={`font-mono text-[10px] font-bold ${isSelected ? 'text-upt-yellow' : 'text-upt-secondary'}`}>{rId}</div>
                        <div className="truncate text-[11px]">{rDef.role}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conmutador de Identidad (4 Integrantes) */}
              <div className="py-2 border-b border-upt-border mb-2">
                <span className="text-[10px] font-semibold text-upt-text-secondary flex items-center gap-1 mb-1.5">
                  <Users className="w-3 h-3 text-upt-primary" /> Cambiar Integrante (Demo):
                </span>
                <div className="space-y-1">
                  {availableDemoUsers.map((u) => {
                    const isCurrentUser = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => switchUser(u.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left transition-colors cursor-pointer ${
                          isCurrentUser
                            ? 'bg-blue-50 text-upt-primary border border-upt-bright/30 font-medium'
                            : 'text-upt-text hover:bg-upt-bg'
                        }`}
                      >
                        <span className="truncate">{u.fullName}</span>
                        {isCurrentUser && <Check className="w-3 h-3 text-upt-bright" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cerrar Sesión */}
              <div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-upt-error hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
