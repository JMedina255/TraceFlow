import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Topbar Persistente */}
      <Topbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Contenedor Principal: Sidebar + Área de Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Backdrop para dispositivos móviles */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Persistente */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Área Central de Contenido con Scroll Independiente */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
          {/* Barra de Sub-Cabecera con Breadcrumb */}
          <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <Breadcrumb />
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Modo Demostración</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Contenido Inyectado de la Ruta */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
