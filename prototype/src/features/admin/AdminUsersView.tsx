import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  GitBranch,
  Building2,
  Eye,
  Edit3,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { traceFlowAdapter } from '../../services/api/apiAdapter';
import type {
  AdminUserRecord,
  AdminUsersSummary,
  OrganizationMemberRecord,
  OrganizationRecord,
  UserInvitationRecord,
} from '../../services/api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { CANONICAL_ROLES, type CanonicalRoleId } from '../../types';

const OPERATIONAL_ROLES: CanonicalRoleId[] = [
  'PU-01',
  'PU-02',
  'PU-03',
  'PU-04',
  'PU-05',
  'PU-06',
  'PU-07',
];

const INVITABLE_ROLES: CanonicalRoleId[] = [
  'PU-01',
  'PU-02',
  'PU-03',
  'PU-04',
  'PU-05',
  'PU-06',
  'PU-07',
  'PU-09',
];

export const AdminUsersView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const isApiMode = traceFlowAdapter.isApiMode();

  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'organizations'>('users');
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
    authorizedProjectManagers: 0,
  });
  const [invitations, setInvitations] = useState<UserInvitationRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [selectedOrgCode, setSelectedOrgCode] = useState<string>('');
  const [orgMembers, setOrgMembers] = useState<OrganizationMemberRecord[]>([]);

  // Filtros de tabla de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [authFilter, setAuthFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales de Usuarios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUserRecord | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRecord | null>(null);
  const [rolesUser, setRolesUser] = useState<AdminUserRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone: 'danger' | 'primary';
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Estado formulario Nuevo Usuario
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newOrgId, setNewOrgId] = useState('');
  const [newGithub, setNewGithub] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newRoles, setNewRoles] = useState<CanonicalRoleId[]>(['PU-01']);
  const [newAuthorizePm, setNewAuthorizePm] = useState(false);

  // Estado formulario Edición
  const [editFullName, setEditFullName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editGithub, setEditGithub] = useState('');

  // Estado formulario Gestión de Perfiles
  const [selectedOperationalRoles, setSelectedOperationalRoles] = useState<CanonicalRoleId[]>([]);

  // Estado formulario Invitación
  const [invChannel, setInvChannel] = useState<'EMAIL' | 'GITHUB'>('EMAIL');
  const [invEmail, setInvEmail] = useState('');
  const [invGithub, setInvGithub] = useState('');
  const [invRole, setInvRole] = useState<CanonicalRoleId>('PU-01');
  const [invOrgId, setInvOrgId] = useState('');
  const [invNotes, setInvNotes] = useState('');

  // Estado formularios Organizaciones
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgLegalName, setOrgLegalName] = useState('');
  const [newMemberLookup, setNewMemberLookup] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'ADMIN' | 'AUDITOR' | 'OWNER'>('MEMBER');

  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isApiMode) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await traceFlowAdapter.admin.listUsers({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        canCreateProjects: authFilter || undefined,
      });
      setUsers(res.data);
      setSummary(res.summary);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [isApiMode, searchTerm, statusFilter, roleFilter, authFilter]);

  const loadInvitations = useCallback(async () => {
    if (!isApiMode) return;
    try {
      const res = await traceFlowAdapter.admin.listInvitations();
      setInvitations(res.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudieron cargar las invitaciones.');
    }
  }, [isApiMode]);

  const loadOrganizations = useCallback(async () => {
    if (!isApiMode) return;
    try {
      const res = await traceFlowAdapter.organizations.getOrganizations();
      setOrganizations(res.data);
      if (res.data.length > 0) {
        setSelectedOrgCode((prev) => prev || res.data[0].code);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudieron cargar las organizaciones.');
    }
  }, [isApiMode]);

  const loadOrgMembers = useCallback(async (orgCodeOrId: string) => {
    if (!isApiMode || !orgCodeOrId) return;
    try {
      const res = await traceFlowAdapter.organizations.getMembers(orgCodeOrId);
      setOrgMembers(res.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudieron cargar los miembros de la organización.');
    }
  }, [isApiMode]);

  useEffect(() => {
    loadUsers();
    loadInvitations();
    loadOrganizations();
  }, [loadUsers, loadInvitations, loadOrganizations]);

  useEffect(() => {
    if (selectedOrgCode) {
      loadOrgMembers(selectedOrgCode);
    }
  }, [selectedOrgCode, loadOrgMembers]);

  const resetCreateForm = () => {
    setNewFullName('');
    setNewEmail('');
    setNewUsername('');
    setNewPosition('');
    setNewOrgId(organizations[0]?.id || '');
    setNewGithub('');
    setNewPassword('');
    setNewConfirmPassword('');
    setNewStatus('ACTIVE');
    setNewRoles(['PU-01']);
    setNewAuthorizePm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== newConfirmPassword) {
      setErrorMsg('La contraseña inicial y su confirmación no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('La contraseña inicial debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await traceFlowAdapter.admin.createUser({
        fullName: newFullName,
        email: newEmail,
        username: newUsername || undefined,
        position: newPosition || undefined,
        organizationId: newOrgId || undefined,
        githubUsername: newGithub || undefined,
        password: newPassword,
        status: newStatus,
        roleCodes: newRoles,
        authorizeProjectCreation: newAuthorizePm,
      });
      setShowCreateModal(false);
      resetCreateForm();
      setSuccessMsg(`Usuario ${res.data.code} (${res.data.email}) registrado exitosamente.`);
      await loadUsers();
      if (selectedOrgCode) await loadOrgMembers(selectedOrgCode);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: AdminUserRecord) => {
    setEditUser(u);
    setEditFullName(u.fullName);
    setEditPosition(u.position || '');
    setEditOrganization(u.organization || '');
    setEditGithub(u.githubUsername || '');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await traceFlowAdapter.admin.updateUser(editUser.id, {
        fullName: editFullName,
        position: editPosition,
        organization: editOrganization,
        githubUsername: editGithub,
      });
      setEditUser(null);
      setSuccessMsg(`Información de ${editUser.code} actualizada correctamente.`);
      await loadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRolesModal = (u: AdminUserRecord) => {
    setRolesUser(u);
    const currentOp = (u.assignedRoleCodes || []).filter((r): r is CanonicalRoleId =>
      OPERATIONAL_ROLES.includes(r as CanonicalRoleId)
    );
    setSelectedOperationalRoles(currentOp.length > 0 ? currentOp : ['PU-01']);
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolesUser) return;
    if (selectedOperationalRoles.length === 0) {
      setErrorMsg('Debe seleccionar al menos un perfil operativo (PU-01 a PU-07).');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await traceFlowAdapter.admin.updateUserRoles(rolesUser.id, selectedOperationalRoles);
      setRolesUser(null);
      setSuccessMsg(`Perfiles operativos de ${rolesUser.code} actualizados y auditados.`);
      await loadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar perfiles.');
    } finally {
      setSubmitting(false);
    }
  };

  const requestStatusChange = (u: AdminUserRecord, nextStatus: 'ACTIVE' | 'SUSPENDED') => {
    setConfirmAction({
      title: nextStatus === 'SUSPENDED' ? `Suspender cuenta ${u.code}` : `Reactivar cuenta ${u.code}`,
      description:
        nextStatus === 'SUSPENDED'
          ? `Al suspender a ${u.fullName} (${u.email}), todas sus sesiones activas serán revocadas inmediatamente y no podrá operar en el sistema.`
          : `Al reactivar a ${u.fullName} (${u.email}), la cuenta quedará habilitada nuevamente para iniciar sesión con sus perfiles activos.`,
      confirmLabel: nextStatus === 'SUSPENDED' ? 'Confirmar Suspensión' : 'Confirmar Reactivación',
      tone: nextStatus === 'SUSPENDED' ? 'danger' : 'primary',
      onConfirm: async () => {
        await traceFlowAdapter.admin.updateUserStatus(u.id, nextStatus);
        setSuccessMsg(
          nextStatus === 'SUSPENDED'
            ? `Cuenta ${u.code} suspendida y sesiones revocadas.`
            : `Cuenta ${u.code} reactivada exitosamente.`
        );
        await loadUsers();
      },
    });
  };

  const requestProjectAuthChange = (u: AdminUserRecord, authorize: boolean) => {
    setConfirmAction({
      title: authorize
        ? `Autorizar como Jefe de Proyecto (PU-09)`
        : `Revocar autorización de Jefe de Proyecto`,
      description: authorize
        ? `Se asignará o activará el perfil PU-09 y se habilitará can_create_projects = true para ${u.fullName} (${u.code}), conservando sus perfiles actuales.`
        : `Se revocará can_create_projects y el perfil PU-09 para ${u.fullName} (${u.code}). Sus proyectos existentes e historial no serán eliminados.`,
      confirmLabel: authorize ? 'Autorizar Jefe de Proyecto' : 'Revocar Autorización',
      tone: authorize ? 'primary' : 'danger',
      onConfirm: async () => {
        await traceFlowAdapter.admin.updateProjectCreationAuth(u.id, authorize);
        setSuccessMsg(
          authorize
            ? `${u.code} autorizado como Jefe de Proyecto (PU-09).`
            : `Autorización de creación de proyectos revocada para ${u.code}.`
        );
        await loadUsers();
      },
    });
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await traceFlowAdapter.admin.createInvitation({
        channel: invChannel,
        email: invChannel === 'EMAIL' ? invEmail : undefined,
        githubUsername: invChannel === 'GITHUB' ? invGithub : undefined,
        intendedRoleCode: invRole,
        organizationId: invOrgId || undefined,
        notes: invNotes || undefined,
      });
      setInvEmail('');
      setInvGithub('');
      setInvNotes('');
      setSuccessMsg('Invitación registrada como pendiente con auditoría SHA-256.');
      await loadInvitations();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la invitación.');
    } finally {
      setSubmitting(false);
    }
  };

  const requestCancelInvitation = (inv: UserInvitationRecord) => {
    const target = inv.channel === 'EMAIL' ? inv.email : `@${inv.github_username}`;
    setConfirmAction({
      title: 'Cancelar invitación pendiente',
      description: `La invitación dirigida a ${target} (${inv.intended_role_code}) pasará a estado CANCELLED sin eliminación física.`,
      confirmLabel: 'Cancelar Invitación',
      tone: 'danger',
      onConfirm: async () => {
        await traceFlowAdapter.admin.updateInvitationStatus(inv.id, 'CANCELLED');
        setSuccessMsg(`Invitación para ${target} cancelada lógicamente.`);
        await loadInvitations();
      },
    });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await traceFlowAdapter.organizations.createOrganization({
        code: orgCode.toUpperCase(),
        name: orgName,
        slug: orgSlug.toLowerCase(),
        legalName: orgLegalName || undefined,
      });
      setShowNewOrgForm(false);
      setOrgCode('');
      setOrgName('');
      setOrgSlug('');
      setOrgLegalName('');
      setSelectedOrgCode(res.data.code);
      setSuccessMsg(`Organización ${res.data.code} creada exitosamente.`);
      await loadOrganizations();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al crear organización.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgCode) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await traceFlowAdapter.organizations.addMember(selectedOrgCode, {
        userCodeOrEmailOrId: newMemberLookup,
        roleInOrg: newMemberRole,
      });
      setNewMemberLookup('');
      setSuccessMsg(`Miembro incorporado a ${selectedOrgCode} exitosamente.`);
      await loadOrgMembers(selectedOrgCode);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al incorporar miembro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleOrgMemberStatus = async (member: OrganizationMemberRecord) => {
    if (!selectedOrgCode) return;
    const nextStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await traceFlowAdapter.organizations.updateMemberStatus(selectedOrgCode, member.user_id, nextStatus);
      setSuccessMsg(`Membresía de ${member.user_code || member.user_id} actualizada a ${nextStatus}.`);
      await loadOrgMembers(selectedOrgCode);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cambiar estado de membresía.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isApiMode) {
    return (
      <div className="max-w-4xl mx-auto bg-upt-surface border border-upt-border rounded-2xl p-8 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-upt-primary">Administración del sistema requiere modo API PostgreSQL</h2>
        <p className="text-xs text-upt-muted max-w-xl mx-auto">
          La administración global de cuentas, autorizaciones de Jefe de Proyecto (PU-09) e invitaciones persistentes opera exclusivamente conectado al Backend NestJS y PostgreSQL (`VITE_SERVICE_MODE=api`).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-upt-primary border border-blue-200 mb-2">
            <Shield className="w-3.5 h-3.5 text-upt-bright" />
            <span>PU-08 · Gobernanza Global de Plataforma</span>
          </div>
          <h1 className="text-2xl font-bold text-upt-primary tracking-tight">Administración del sistema</h1>
          <p className="text-xs text-upt-text-secondary mt-1">
            Gestione cuentas institucionales, habilite jefes de proyecto (PU-09), administre organizaciones y registre invitaciones pendientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadUsers();
              loadInvitations();
              loadOrganizations();
            }}
            className="px-3 py-2 rounded-xl border border-upt-border bg-white text-xs font-semibold text-upt-text-secondary hover:bg-upt-bg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      {/* Banners de Retroalimentación */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicadores Dinámicos (Desde PostgreSQL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-upt-surface border border-upt-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-upt-muted font-medium">
            <span>Total de usuarios registrados</span>
            <Users className="w-4 h-4 text-upt-bright" />
          </div>
          <div className="text-2xl font-bold text-upt-primary mt-2">{summary.total}</div>
          <p className="text-[11px] text-upt-muted mt-1">{summary.inactive} inactivos en catálogo</p>
        </div>
        <div className="bg-upt-surface border border-emerald-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-upt-muted font-medium">
            <span>Usuarios activos</span>
            <UserCheck className="w-4 h-4 text-upt-success" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{summary.active}</div>
          <p className="text-[11px] text-upt-muted mt-1">Habilitados para autenticación</p>
        </div>
        <div className="bg-upt-surface border border-red-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-upt-muted font-medium">
            <span>Usuarios suspendidos</span>
            <UserX className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">{summary.suspended}</div>
          <p className="text-[11px] text-upt-muted mt-1">Con sesiones revocadas</p>
        </div>
        <div className="bg-upt-surface border border-blue-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-upt-muted font-medium">
            <span>Jefes de proyecto autorizados</span>
            <ShieldCheck className="w-4 h-4 text-upt-primary" />
          </div>
          <div className="text-2xl font-bold text-upt-primary mt-2">{summary.authorizedProjectManagers}</div>
          <p className="text-[11px] text-upt-muted mt-1">PU-09 y can_create_projects</p>
        </div>
      </div>

      {/* Pestañas del Módulo */}
      <div className="flex flex-wrap gap-2 border-b border-upt-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'bg-upt-institutional text-white'
              : 'bg-upt-surface text-upt-text-secondary border border-upt-border hover:bg-upt-bg'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuarios y Autorizaciones ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'invitations'
              ? 'bg-upt-institutional text-white'
              : 'bg-upt-surface text-upt-text-secondary border border-upt-border hover:bg-upt-bg'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Invitaciones pendientes ({invitations.filter((i) => i.status === 'PENDING').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'organizations'
              ? 'bg-upt-institutional text-white'
              : 'bg-upt-surface text-upt-text-secondary border border-upt-border hover:bg-upt-bg'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organizaciones y Membresías ({organizations.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Herramientas de Consulta */}
          <div className="bg-upt-surface border border-upt-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-upt-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar nombre, correo o GitHub..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-upt-bg border border-upt-border text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por estado"
              className="px-3 py-2 rounded-lg bg-upt-bg border border-upt-border text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="SUSPENDED">Suspendidos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filtrar por perfil"
              className="px-3 py-2 rounded-lg bg-upt-bg border border-upt-border text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright"
            >
              <option value="">Todos los perfiles</option>
              {(Object.keys(CANONICAL_ROLES) as CanonicalRoleId[]).map((r) => (
                <option key={r} value={r}>
                  {r} — {CANONICAL_ROLES[r].label}
                </option>
              ))}
            </select>
            <select
              value={authFilter}
              onChange={(e) => setAuthFilter(e.target.value)}
              aria-label="Filtrar por autorización para crear proyectos"
              className="px-3 py-2 rounded-lg bg-upt-bg border border-upt-border text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright"
            >
              <option value="">Autorización de proyectos (Todas)</option>
              <option value="true">Autorizados (Jefe de Proyecto)</option>
              <option value="false">Sin autorización de proyectos</option>
            </select>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-upt-surface border border-upt-border rounded-xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-10 text-center text-xs text-upt-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-upt-bright" />
                <span>Consultando cuentas en PostgreSQL...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-xs text-upt-muted">
                No se encontraron usuarios con los criterios aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-upt-bg border-b border-upt-border text-[11px] uppercase tracking-wider text-upt-text-secondary">
                      <th className="py-3 px-4 font-bold">Código</th>
                      <th className="py-3 px-4 font-bold">Nombre completo</th>
                      <th className="py-3 px-4 font-bold">Correo institucional</th>
                      <th className="py-3 px-4 font-bold">Usuario GitHub</th>
                      <th className="py-3 px-4 font-bold">Perfiles</th>
                      <th className="py-3 px-4 font-bold">Estado</th>
                      <th className="py-3 px-4 font-bold">Autorización Jefe de Proyecto</th>
                      <th className="py-3 px-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-upt-border/70">
                    {users.map((u) => {
                      const isSelf = currentUser?.code === u.code || currentUser?.id === u.id;
                      const isSysAdmin = u.assignedRoleCodes.includes('PU-08');
                      return (
                        <tr key={u.id} className="hover:bg-upt-bg/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-upt-primary">{u.code}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-upt-text">{u.fullName}</div>
                            <div className="text-[11px] text-upt-muted">{u.position || u.organization}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3 px-4">
                            {u.githubUsername ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
                                <GitBranch className="w-3 h-3" />
                                @{u.githubUsername}
                                <span className="text-[9px] text-slate-500">({u.githubIdentityStatus})</span>
                              </span>
                            ) : (
                              <span className="text-upt-muted text-[11px]">No declarado</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.assignedRoleCodes.map((r) => (
                                <span
                                  key={r}
                                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                    r === 'PU-08'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : r === 'PU-09'
                                        ? 'bg-blue-50 text-upt-primary border-blue-200'
                                        : 'bg-upt-bg text-upt-text-secondary border-upt-border'
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : u.status === 'SUSPENDED'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {u.canCreateProjects ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-upt-primary border border-blue-200">
                                <ShieldCheck className="w-3 h-3" />
                                Autorizado (PU-09)
                              </span>
                            ) : (
                              <span className="text-[11px] text-upt-muted">No autorizado</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setDetailUser(u)}
                                title="Ver detalle"
                                className="p-1.5 rounded-lg border border-upt-border hover:bg-upt-bg text-upt-text-secondary cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                title="Editar usuario"
                                className="p-1.5 rounded-lg border border-upt-border hover:bg-upt-bg text-upt-text-secondary cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!isSelf && !isSysAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openRolesModal(u)}
                                  title="Gestionar perfiles"
                                  className="p-1.5 rounded-lg border border-upt-border hover:bg-upt-bg text-upt-primary cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isSysAdmin && (
                                u.canCreateProjects ? (
                                  <button
                                    type="button"
                                    onClick={() => requestProjectAuthChange(u, false)}
                                    className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold cursor-pointer"
                                  >
                                    Revocar PU-09
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => requestProjectAuthChange(u, true)}
                                    disabled={u.status !== 'ACTIVE'}
                                    className="px-2 py-1 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-upt-primary text-[11px] font-semibold cursor-pointer disabled:opacity-40"
                                  >
                                    Autorizar PU-09
                                  </button>
                                )
                              )}
                              {!isSelf && (
                                u.status === 'ACTIVE' ? (
                                  <button
                                    type="button"
                                    onClick={() => requestStatusChange(u, 'SUSPENDED')}
                                    className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold cursor-pointer"
                                  >
                                    Suspender
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => requestStatusChange(u, 'ACTIVE')}
                                    className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold cursor-pointer"
                                  >
                                    Reactivar
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: INVITACIONES PENDIENTES */}
      {activeTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-upt-primary">Registrar invitación pendiente</h2>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-upt-primary text-[11px] leading-relaxed">
              La invitación será registrada como pendiente. El servicio de envío y aceptación externa todavía no está habilitado en esta versión.
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-upt-text">Canal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInvChannel('EMAIL')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                      invChannel === 'EMAIL'
                        ? 'bg-upt-institutional text-white border-upt-institutional'
                        : 'bg-upt-bg text-upt-text border-upt-border'
                    }`}
                  >
                    Correo electrónico
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvChannel('GITHUB')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                      invChannel === 'GITHUB'
                        ? 'bg-upt-institutional text-white border-upt-institutional'
                        : 'bg-upt-bg text-upt-text border-upt-border'
                    }`}
                  >
                    GitHub
                  </button>
                </div>
              </div>

              {invChannel === 'EMAIL' ? (
                <div className="space-y-1">
                  <label className="font-bold text-upt-text">Correo electrónico destinatario *</label>
                  <input
                    type="email"
                    required
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="colaborador@exodo.pe"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border focus:outline-none focus:ring-2 focus:ring-upt-bright"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-upt-text">Usuario GitHub destinatario *</label>
                  <input
                    type="text"
                    required
                    value={invGithub}
                    onChange={(e) => setInvGithub(e.target.value)}
                    placeholder="octocat-dev"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border focus:outline-none focus:ring-2 focus:ring-upt-bright"
                  />
                  <p className="text-[10px] text-upt-muted">
                    No requiere correo electrónico ni autenticación OAuth.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-upt-text">Perfil propuesto</label>
                <select
                  value={invRole}
                  onChange={(e) => setInvRole(e.target.value as CanonicalRoleId)}
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border focus:outline-none focus:ring-2 focus:ring-upt-bright"
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} — {CANONICAL_ROLES[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-upt-text">Organización (opcional)</label>
                <select
                  value={invOrgId}
                  onChange={(e) => setInvOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border focus:outline-none focus:ring-2 focus:ring-upt-bright"
                >
                  <option value="">Ámbito general</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.code} — {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-upt-text">Notas administrativas</label>
                <textarea
                  rows={2}
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  placeholder="Contexto de incorporación..."
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border focus:outline-none focus:ring-2 focus:ring-upt-bright"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Registrando...' : 'Registrar invitación'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-upt-surface border border-upt-border rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-upt-border bg-upt-bg/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-upt-primary uppercase tracking-wider">
                Historial de Invitaciones Registradas
              </h3>
              <span className="text-[11px] font-mono text-upt-muted">{invitations.length} registros</span>
            </div>
            {invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-upt-muted">
                No existen invitaciones registradas todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-upt-bg border-b border-upt-border text-[11px] uppercase text-upt-text-secondary">
                      <th className="py-2.5 px-4 font-bold">Canal</th>
                      <th className="py-2.5 px-4 font-bold">Destinatario</th>
                      <th className="py-2.5 px-4 font-bold">Perfil</th>
                      <th className="py-2.5 px-4 font-bold">Organización</th>
                      <th className="py-2.5 px-4 font-bold">Estado</th>
                      <th className="py-2.5 px-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-upt-border/70">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-upt-bg/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-[11px]">{inv.channel}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px]">
                          {inv.channel === 'EMAIL' ? inv.email : `@${inv.github_username}`}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-upt-primary border border-blue-200 font-mono text-[10px] font-bold">
                            {inv.intended_role_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[11px]">
                          {inv.organization_code || 'General'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : inv.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {inv.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => requestCancelInvitation(inv)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: ORGANIZACIONES */}
      {activeTab === 'organizations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-upt-primary">Organizaciones</h2>
              <button
                type="button"
                onClick={() => setShowNewOrgForm(!showNewOrgForm)}
                className="px-2.5 py-1 rounded-lg bg-upt-institutional text-white text-[11px] font-bold cursor-pointer"
              >
                {showNewOrgForm ? 'Cerrar' : 'Nueva org'}
              </button>
            </div>

            {showNewOrgForm && (
              <form onSubmit={handleCreateOrganization} className="space-y-2.5 p-3 rounded-xl bg-upt-bg border border-upt-border text-xs">
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  placeholder="Código ej. ORG-CLIENTE"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-upt-border"
                />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nombre comercial"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-upt-border"
                />
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="slug-url"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-upt-border"
                />
                <input
                  type="text"
                  value={orgLegalName}
                  onChange={(e) => setOrgLegalName(e.target.value)}
                  placeholder="Razón social (opcional)"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-upt-border"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 rounded-lg bg-upt-bright text-white font-bold cursor-pointer"
                >
                  Crear organización
                </button>
              </form>
            )}

            <div className="space-y-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrgCode(org.code)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                    selectedOrgCode === org.code
                      ? 'bg-blue-50 border-upt-bright text-upt-primary'
                      : 'bg-upt-bg border-upt-border hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{org.name}</span>
                    <span className="font-mono text-[10px]">{org.code}</span>
                  </div>
                  <div className="text-[11px] text-upt-muted mt-0.5">
                    slug: {org.slug} · {org.status}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-upt-surface border border-upt-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-upt-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-upt-primary">
                  Membresías de {selectedOrgCode || 'Organización'}
                </h3>
                <p className="text-[11px] text-upt-muted">
                  Aislamiento institucional DA-06: solo usuarios registrados pueden vincularse.
                </p>
              </div>
              <form onSubmit={handleAddOrgMember} className="flex gap-2 text-xs">
                <input
                  type="text"
                  required
                  value={newMemberLookup}
                  onChange={(e) => setNewMemberLookup(e.target.value)}
                  placeholder="USR-005 o correo..."
                  className="px-3 py-1.5 rounded-lg bg-upt-bg border border-upt-border"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="px-2 py-1.5 rounded-lg bg-upt-bg border border-upt-border"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="OWNER">OWNER</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting || !selectedOrgCode}
                  className="px-3 py-1.5 rounded-lg bg-upt-institutional text-white font-bold cursor-pointer"
                >
                  Incorporar
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-upt-bg border-b border-upt-border text-[11px] uppercase text-upt-text-secondary">
                    <th className="py-2 px-3 font-bold">Usuario</th>
                    <th className="py-2 px-3 font-bold">Correo</th>
                    <th className="py-2 px-3 font-bold">Rol Org</th>
                    <th className="py-2 px-3 font-bold">Estado</th>
                    <th className="py-2 px-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-upt-border/70">
                  {orgMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-semibold">
                        {m.user_code} · {m.user_full_name}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]">{m.user_email}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[11px]">{m.role_in_org}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleOrgMemberStatus(m)}
                          className="px-2 py-1 rounded border border-upt-border text-[11px] font-semibold hover:bg-upt-bg cursor-pointer"
                        >
                          {m.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO USUARIO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-upt-surface border border-upt-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-upt-border pb-3">
              <div>
                <h2 className="text-base font-bold text-upt-primary">Registrar nuevo usuario</h2>
                <p className="text-[11px] text-upt-muted">
                  Aprovisionamiento seguro con hash Argon2id. El perfil PU-08 no se asigna desde este formulario.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-upt-muted hover:text-upt-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Nombres y apellidos *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="María Elena Torres"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mtorres@exodo.pe"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Nombre de usuario</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="mtorres (opcional)"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Cargo institucional</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="Líder Técnico"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Organización</label>
                  <select
                    value={newOrgId}
                    onChange={(e) => setNewOrgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  >
                    <option value="">Sin vinculación organizacional automática</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.code} — {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Cuenta GitHub opcional (referencia manual)</label>
                  <input
                    type="text"
                    value={newGithub}
                    onChange={(e) => setNewGithub(e.target.value)}
                    placeholder="mtorres-dev"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Contraseña inicial temporal *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Confirmar contraseña *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    placeholder="Repita la contraseña"
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <label className="font-bold">Estado inicial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                  >
                    <option value="ACTIVE">ACTIVE (Activo)</option>
                    <option value="INACTIVE">INACTIVE (Inactivo)</option>
                  </select>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2 mt-4">
                  <input
                    id="chk-create-pm"
                    type="checkbox"
                    checked={newAuthorizePm}
                    onChange={(e) => setNewAuthorizePm(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="chk-create-pm" className="cursor-pointer">
                    <span className="font-bold text-upt-primary block">Autorizar para crear proyectos (PU-09)</span>
                    <span className="text-[10px] text-upt-muted">
                      Habilita can_create_projects y asigna PU-09 de forma atómica.
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">Perfiles operativos iniciales (PU-01 a PU-07)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OPERATIONAL_ROLES.map((r) => {
                    const checked = newRoles.includes(r);
                    return (
                      <label
                        key={r}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                          checked ? 'bg-blue-50 border-upt-bright' : 'bg-upt-bg border-upt-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoles((prev) => [...prev, r]);
                            } else {
                              setNewRoles((prev) => prev.filter((item) => item !== r));
                            }
                          }}
                        />
                        <span className="text-[11px] font-medium">
                          <strong>{r}</strong> · {CANONICAL_ROLES[r].label.split('/')[0]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-upt-muted bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                Aviso: La contraseña temporal se almacena cifrada con Argon2id y no volverá a mostrarse después del registro. En esta versión MVP el cambio obligatorio en el primer ingreso queda documentado como mejora evolutiva.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-upt-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-upt-border text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-bold cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Registrar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE USUARIO */}
      {detailUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-upt-surface border border-upt-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-upt-border pb-3">
              <h3 className="text-base font-bold text-upt-primary">
                Detalle de Cuenta · {detailUser.code}
              </h3>
              <button onClick={() => setDetailUser(null)} className="text-upt-muted hover:text-upt-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-upt-muted block">Nombre completo</span><strong>{detailUser.fullName}</strong></div>
              <div><span className="text-upt-muted block">Usuario</span><strong className="font-mono">{detailUser.username}</strong></div>
              <div><span className="text-upt-muted block">Correo</span><strong className="font-mono">{detailUser.email}</strong></div>
              <div><span className="text-upt-muted block">Estado</span><strong>{detailUser.status}</strong></div>
              <div><span className="text-upt-muted block">Cargo</span><strong>{detailUser.position || '—'}</strong></div>
              <div><span className="text-upt-muted block">Organización</span><strong>{detailUser.organization}</strong></div>
              <div>
                <span className="text-upt-muted block">GitHub (Referencia)</span>
                <strong>{detailUser.githubUsername ? `@${detailUser.githubUsername} (${detailUser.githubIdentityStatus})` : 'No declarado'}</strong>
              </div>
              <div>
                <span className="text-upt-muted block">Creación de Proyectos</span>
                <strong>{detailUser.canCreateProjects ? 'Autorizado (PU-09)' : 'No autorizado'}</strong>
              </div>
            </div>
            <div>
              <span className="text-upt-muted block mb-1">Perfiles activos</span>
              <div className="flex flex-wrap gap-1.5">
                {detailUser.assignedRoleCodes.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded bg-blue-50 text-upt-primary border border-blue-200 font-mono text-[11px] font-bold">
                    {r} — {CANONICAL_ROLES[r as CanonicalRoleId]?.label || r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-upt-surface border border-upt-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-upt-border pb-3">
              <h3 className="text-base font-bold text-upt-primary">Editar usuario · {editUser.code}</h3>
              <button onClick={() => setEditUser(null)} className="text-upt-muted hover:text-upt-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold">Nombres y apellidos</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">Cargo institucional</label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">Organización</label>
                <input
                  type="text"
                  value={editOrganization}
                  onChange={(e) => setEditOrganization(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">Usuario GitHub opcional (referencia manual)</label>
                <input
                  type="text"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="Sin @ inicial"
                  className="w-full px-3 py-2 rounded-lg bg-upt-bg border border-upt-border"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="px-3 py-2 rounded-lg border border-upt-border cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-upt-institutional text-white font-bold cursor-pointer">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR PERFILES */}
      {rolesUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-upt-surface border border-upt-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-upt-border pb-3">
              <h3 className="text-base font-bold text-upt-primary">Perfiles operativos · {rolesUser.code}</h3>
              <button onClick={() => setRolesUser(null)} className="text-upt-muted hover:text-upt-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-upt-muted">
              Seleccione los perfiles SCM permitidos (PU-01 a PU-07). La autorización de Jefe de Proyecto (PU-09) se gestiona mediante la acción dedicada en la tabla.
            </p>
            <form onSubmit={handleSaveRoles} className="space-y-3">
              <div className="space-y-1.5">
                {OPERATIONAL_ROLES.map((r) => {
                  const checked = selectedOperationalRoles.includes(r);
                  return (
                    <label key={r} className="flex items-center gap-2 p-2 rounded-lg border border-upt-border bg-upt-bg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOperationalRoles((prev) => [...prev, r]);
                          } else {
                            setSelectedOperationalRoles((prev) => prev.filter((x) => x !== r));
                          }
                        }}
                      />
                      <span>
                        <strong className="font-mono">{r}</strong> — {CANONICAL_ROLES[r].label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRolesUser(null)} className="px-3 py-2 rounded-lg border border-upt-border cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-upt-institutional text-white font-bold cursor-pointer">
                  Guardar perfiles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE OPERACIÓN CRÍTICA */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-upt-surface border border-upt-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-upt-primary">{confirmAction.title}</h3>
            <p className="text-upt-text-secondary leading-relaxed">{confirmAction.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-upt-border font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  try {
                    await confirmAction.onConfirm();
                    setConfirmAction(null);
                  } catch (err: unknown) {
                    setErrorMsg(err instanceof Error ? err.message : 'Error ejecutando la operación.');
                    setConfirmAction(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-white font-bold cursor-pointer ${
                  confirmAction.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-upt-institutional hover:bg-upt-primary'
                }`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
