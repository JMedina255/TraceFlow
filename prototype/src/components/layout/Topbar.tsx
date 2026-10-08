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
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Lado Izquierdo: Menú Hamburguesa + Marca + Selector de Proyecto */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Botón Toggle Sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          title={isSidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Identidad Institucional */}
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">TraceFlow SCM</span>
              <span className="hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                ÉXODO S.A.C.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Control de Configuración de Software</p>
          </div>
        </div>

        {/* Separador */}
        <div className="hidden lg:block h-6 w-px bg-slate-800 mx-1" />

        {/* Selector Interactivo de Proyecto Activo (Aislamiento Multitenant) */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Cambiar proyecto activo"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="hidden sm:block">
              <span className="text-slate-400 text-[11px] mr-1">Proyecto:</span>
              <span className="font-medium text-slate-200 truncate max-w-[140px] inline-block align-bottom">
                {activeProject.name}
              </span>
            </div>
            <span className="font-mono text-[10px] text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">
              {activeProject.code}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Menú Desplegable de Selección de Proyecto */}
          {showProjectMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-2 py-1.5 border-b border-slate-800 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/50'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          Cliente: {proj.client}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0 ml-2">
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
              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            title="Alertas de flujo del proyecto activo"
            aria-label="Abrir panel de notificaciones"
          >
            <Bell className="w-4 h-4" />
            {pendingRfcs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Popover de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-white">Alertas del Proyecto</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-600/80 text-white">
                    {pendingRfcs.length} pendientes
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pendingRfcs.length > 0 ? (
                  pendingRfcs.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg border bg-slate-800/80 border-slate-700 text-slate-200 text-xs"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-white font-mono text-[11px]">{r.code}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300">
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-300 leading-snug line-clamp-2">{r.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No hay solicitudes pendientes de atención en este proyecto.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-800" />

        {/* Selector de Usuario e Identidad Demo (C-SharkTeam) */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Menú de usuario"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-700 border border-indigo-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {currentUser?.fullName.charAt(0) || 'U'}
            </div>

            <div className="hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser?.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-indigo-400 font-medium">
                  {activeRoleId}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {CANONICAL_ROLES[activeRoleId]?.label || currentUser?.roleLabel}
                </span>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Menú Desplegable de Conmutación de Usuario y Rol Demo */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="pb-3 border-b border-slate-800 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Identidad Activa (Demo)
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">C-SharkTeam</span>
                </div>
                <p className="text-xs font-bold text-white mt-1">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
              </div>

              {/* Conmutador de Rol Autorizado para esta Identidad */}
              <div className="py-2 border-b border-slate-800 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
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
                        className={`px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-medium shadow-xs'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-mono text-[10px] text-indigo-300 font-bold">{rId}</div>
                        <div className="truncate text-[11px]">{rDef.role}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conmutador de Identidad (4 Integrantes) */}
              <div className="py-2 border-b border-slate-800 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                  <Users className="w-3 h-3 text-indigo-400" /> Cambiar Integrante (Demo):
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
                            ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{u.fullName}</span>
                        {isCurrentUser && <Check className="w-3 h-3 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cerrar Sesión */}
              <div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
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
