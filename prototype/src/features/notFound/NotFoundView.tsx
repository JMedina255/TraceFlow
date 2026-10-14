import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold text-upt-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          Error HTTP 404 — Ruta No Encontrada
        </span>
        <h1 className="text-2xl font-bold text-upt-primary tracking-tight">Pantalla No Localizada</h1>
        <p className="text-xs text-upt-text-secondary leading-relaxed">
          La ruta solicitada <code className="bg-upt-bg text-upt-secondary border border-upt-border px-1.5 py-0.5 rounded font-mono">{location.pathname}</code> no 
          corresponde a ninguno de los nodos navegacionales registrados en el catálogo de arquitectura de TraceFlow SCM.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-upt-bg text-upt-text border border-upt-border text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar</span>
        </button>
      </div>
    </div>
  );
};
