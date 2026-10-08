import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SIDEBAR_NAVIGATION, type SidebarSection } from '../../routes/navigation';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  // Estado para colapsar/expandir secciones individuales
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    governance: false,
    audit: false,
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'
      }`}
    >
      {/* Encabezado del Menú Lateral */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Módulos del Sistema (DG-04)
        </span>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
          8 Paquetes
        </span>
      </div>

      {/* Navegación por Paquetes */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
        {SIDEBAR_NAVIGATION.map((section: SidebarSection) => {
          const Icon = section.icon;
          const isCollapsed = collapsedSections[section.id];

          return (
            <div key={section.id} className="space-y-1">
              {/* Título de la Sección / Paquete Arquitectural */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded text-left group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-semibold tracking-wide text-[11px] truncate">
                    {section.name}
                  </span>
                </div>
                {section.items.length > 1 && (
                  <span className="text-slate-500 group-hover:text-slate-400">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                )}
              </button>

              {/* Items de Navegación */}
              {!isCollapsed && (
                <div className="space-y-0.5 pl-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="truncate">{item.label}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded transition-colors ${
                              isActive
                                ? 'bg-indigo-700 text-white'
                                : 'text-slate-500 bg-slate-900/60'
                            }`}
                          >
                            {item.screenId.replace('SCREEN-', 'S')}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie del Menú Lateral */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Gobernanza SSOT</span>
          <span className="text-indigo-400 font-mono">IEEE 828</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          TraceFlow SCM &copy; 2026 C-SharkTeam
        </div>
      </div>
    </aside>
  );
};
