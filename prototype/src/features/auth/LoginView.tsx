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
    <div className="min-h-screen bg-upt-bg flex flex-col items-center justify-center p-4 text-upt-text font-sans antialiased">
      {/* Tarjeta de Inicio de Sesión (WF-01 / SCREEN-01) */}
      <div className="w-full max-w-md bg-upt-surface border border-upt-border rounded-2xl p-8 shadow-xl space-y-6">
        {/* Identidad de Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-upt-institutional text-white shadow-md">
            <GitBranch className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-upt-primary">TraceFlow SCM</h1>
          <p className="text-xs text-upt-muted">
            Sistema de Gestión de Configuración de Software y Control de Cambios
          </p>
          <div className="pt-1">
            <span className="text-[11px] font-mono text-upt-secondary bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
              Portal Corporativo — ÉXODO S.A.C.
            </span>
          </div>
        </div>

        {/* Alerta de Error (si aplica) */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-upt-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario (WF-01) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-upt-text mb-1.5">
              Usuario o Correo Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-upt-muted absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exodo.pe"
                className="w-full pl-9 pr-3 py-2 bg-white border border-upt-border rounded-lg text-sm text-upt-text placeholder-upt-muted/70 focus:outline-none focus:ring-2 focus:ring-upt-bright focus:border-upt-bright transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-upt-text mb-1.5">
              Contraseña Institucional
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-upt-muted absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-upt-border rounded-lg text-sm text-upt-text placeholder-upt-muted/70 focus:outline-none focus:ring-2 focus:ring-upt-bright focus:border-upt-bright transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-upt-institutional hover:bg-upt-primary text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-upt-bright focus:ring-offset-2 cursor-pointer"
          >
            <span>Iniciar Sesión Seguro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Metadatos de Demostración */}
        <div className="pt-2 border-t border-upt-border text-center">
          <p className="text-[11px] text-upt-muted">
            Credenciales de prueba preconfiguradas para demostración académica.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-upt-secondary font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autenticación institucional simulada (ADR-006)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-upt-muted">
        TraceFlow SCM &copy; 2026 — EPIS / Universidad Privada de Tacna
      </footer>
    </div>
  );
};
