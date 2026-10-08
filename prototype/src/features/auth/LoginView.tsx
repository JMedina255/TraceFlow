import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('jmedina@exodo.pe');
  const [password, setPassword] = useState('••••••••••••');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor ingrese su usuario o correo institucional.');
      return;
    }

    // Login simulado con identidad canónica aprobada
    login({
      id: 'USR-001',
      username: 'jmedina',
      fullName: 'Joan Cristian Medina Quispe',
      email: email,
      roleId: 'PU-02',
      role: 'GESTOR',
      roleLabel: 'Analista de Requerimientos / Gestor',
      organization: 'ÉXODO S.A.C.',
      isActive: true,
    });

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans antialiased">
      {/* Tarjeta de Inicio de Sesión (WF-01 / SCREEN-01) */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Identidad de Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-indigo-600 text-white shadow-md">
            <GitBranch className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">TraceFlow SCM</h1>
          <p className="text-xs text-slate-400">
            Sistema de Gestión de Configuración de Software y Control de Cambios
          </p>
          <div className="pt-1">
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              Portal Corporativo — ÉXODO S.A.C.
            </span>
          </div>
        </div>

        {/* Alerta de Error (si aplica) */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario (WF-01) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Usuario o Correo Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exodo.pe"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña Institucional
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
          >
            <span>Iniciar Sesión Seguro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Metadatos de Demostración */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Credenciales de prueba preconfiguradas para demostración académica.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-indigo-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autenticación institucional simulada (ADR-006)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-600">
        TraceFlow SCM &copy; 2026 — EPIS / Universidad Privada de Tacna
      </footer>
    </div>
  );
};
