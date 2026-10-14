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
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-upt-primary border-r border-upt-institutional/80 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-md ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'
      }`}
    >
      {/* Encabezado del Menú Lateral */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 justify-between bg-upt-primary">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
          Módulos del Sistema (DG-04)
        </span>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-upt-institutional text-upt-yellow border border-white/10">
          8 Paquetes
        </span>
      </div>

      {/* Navegación por Paquetes */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/20">
        {SIDEBAR_NAVIGATION.map((section: SidebarSection) => {
          const Icon = section.icon;
          const isCollapsed = collapsedSections[section.id];

          return (
            <div key={section.id} className="space-y-1">
              {/* Título de la Sección / Paquete Arquitectural */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-blue-200 hover:text-white hover:bg-white/10 transition-colors rounded text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-300 group-hover:text-upt-yellow transition-colors" />
                  <span className="font-semibold tracking-wide text-[11px] truncate text-blue-100 group-hover:text-white">
                    {section.name}
                  </span>
                </div>
                {section.items.length > 1 && (
                  <span className="text-blue-300/80 group-hover:text-white">
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
                            ? 'bg-upt-bright text-white font-semibold shadow-sm border-l-4 border-upt-yellow pl-2.5'
                            : 'text-blue-100/90 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="truncate">{item.label}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                              isActive
                                ? 'bg-upt-primary text-white font-bold'
                                : 'text-blue-200/80 bg-white/10'
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
      <div className="p-3 border-t border-white/10 bg-black/15 text-[11px] text-blue-200">
        <div className="flex items-center justify-between">
          <span>Gobernanza SSOT</span>
          <span className="text-upt-yellow font-mono font-semibold">IEEE 828</span>
        </div>
        <div className="text-[10px] text-blue-300/70 mt-1">
          TraceFlow SCM &copy; 2026 C-SharkTeam
        </div>
      </div>
    </aside>
  );
};
