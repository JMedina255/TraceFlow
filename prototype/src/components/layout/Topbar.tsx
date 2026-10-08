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
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface TopbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Notificaciones simuladas representativas de los flujos de TraceFlow
  const notifications = [
    {
      id: 'notif-1',
      title: 'Nueva RFC Registrada',
      description: 'RFC-2026-0042 pendiente de validación inicial de completitud.',
      time: 'Hace 10 min',
      isUnread: true,
    },
    {
      id: 'notif-2',
      title: 'Dictamen de Análisis Técnico',
      description: 'El Arquitecto clasificó RFC-2026-0041 como Cambio Mayor.',
      time: 'Hace 45 min',
      isUnread: true,
    },
    {
      id: 'notif-3',
      title: 'Certificación QA Emitida',
      description: 'Certificado de Conformidad técnica emitido para ECN-2026-0014.',
      time: 'Hace 2 horas',
      isUnread: false,
    },
  ];

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Lado Izquierdo: Toggle Móvil + Marca + Proyecto Activo */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Botón Toggle Sidebar (Móvil / Escritorio) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <div className="hidden lg:block h-6 w-px bg-slate-800 mx-2" />

        {/* Selector / Indicador de Proyecto Activo */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Proyecto Activo:</span>
          <span className="font-medium text-slate-200">Pasarela de Pagos Core</span>
          <span className="font-mono text-[10px] text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">PRJ-001</span>
        </div>
      </div>

      {/* Lado Derecho: Notificaciones + Perfil de Usuario + Acciones */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Notificaciones del sistema"
            aria-label="Abrir panel de notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
          </button>

          {/* Popover de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-white">Bandeja de Alertas SCM</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">2 nuevas</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors ${
                      n.isUnread
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className={n.isUnread ? 'text-white' : 'text-slate-300'}>{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="mt-1 text-slate-400 leading-snug">{n.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-center">
                <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">
                  Ver todas las alertas de auditoría
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-800" />

        {/* Bloque de Identidad y Rol del Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Menú de usuario"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-700 border border-indigo-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {currentUser?.fullName.charAt(0) || 'U'}
            </div>

            <div className="hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser?.fullName || 'Usuario Demo'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-indigo-400 font-medium">
                  {currentUser?.roleId || 'PU-02'}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                  {currentUser?.roleLabel || 'Gestor'}
                </span>
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Menú Desplegable de Usuario */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="pb-3 border-b border-slate-800 mb-2">
                <p className="text-xs font-bold text-white">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px] text-indigo-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{currentUser?.roleLabel}</span>
                </div>
              </div>

              <div className="py-1 text-xs text-slate-300 space-y-1">
                <div className="px-2 py-1.5 text-[11px] text-slate-400 bg-slate-950/60 rounded">
                  Organización: <strong className="text-slate-200">ÉXODO S.A.C.</strong>
                </div>
                <div className="px-2 py-1 text-[10px] text-slate-500">
                  (El conmutador interactivo de los 4 integrantes se integrará en la Fase IV)
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800">
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
