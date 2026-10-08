import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Error HTTP 404 — Ruta No Encontrada
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pantalla No Localizada</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          La ruta solicitada <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{location.pathname}</code> no 
          corresponde a ninguno de los nodos navegacionales registrados en el catálogo de arquitectura de TraceFlow SCM.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar</span>
        </button>
      </div>
    </div>
  );
};
