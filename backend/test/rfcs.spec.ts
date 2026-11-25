import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { RfcsRepository } from '../src/modules/rfcs/rfcs.repository.js';
import { RfcsService } from '../src/modules/rfcs/rfcs.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('Backend RFCs Management (CU-04, SoD, Ownership & Audit)', () => {
  let rfcsService: RfcsService;
  let auditService: AuditService;

  beforeEach(() => {
    const db = new DatabaseService();
    auditService = new AuditService(db);
    const projectsRepo = new ProjectsRepository(db);
    const rfcsRepo = new RfcsRepository(db);
    rfcsService = new RfcsService(rfcsRepo, projectsRepo, auditService);
  });

  const solicitanteUser: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'USR-001',
    username: 'jmedina',
    email: 'jmedina@exodo.pe',
    fullName: 'Joan Cristian Medina Quispe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad',
    activeRoleId: 'PU-01', // Solicitante
    allowedRoleIds: ['PU-01', 'PU-02'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const gestorUser: AuthenticatedUser = {
    ...solicitanteUser,
    activeRoleId: 'PU-02', // Gestor
  };

  it('debe permitir crear una RFC formalmente con PU-01 y emitir auditoría SHA-256', async () => {
    const rfc = await rfcsService.createRfc(
      {
        projectId: 'PRJ-001',
        targetEcsId: 'SRC-AUTH-JWT.ts',
        title: 'Actualización de Algoritmo de Hashing a Argon2id',
        description: 'Reemplazo del mecanismo de derivación de claves para cumplir directiva de seguridad.',
        justification: 'Exigencia SBS para mitigación de ataques de fuerza bruta y GPU.',
        priority: 'ALTA',
      },
      solicitanteUser
    );

    expect(rfc.code).toBeDefined();
    expect(rfc.status).toBe('REGISTRADA');
    expect(rfc.requested_by).toBe('USR-001');

    // Comprobar que se emitió el evento de auditoría
    const chain = auditService.getAuditChain();
    expect(chain.length).toBeGreaterThan(0);
    const lastEvent = chain[chain.length - 1];
    expect(lastEvent.operation).toBe('REGISTRAR_RFC_CU04');
    expect(lastEvent.currLogHash).toBeDefined();
    expect(auditService.verifyChainIntegrity()).toBe(true);
  });

  it('PRUEBA NEGATIVA: Debe bloquear creación de RFC por usuario con rol distinto a PU-01 (SoD CU-04)', async () => {
    await expect(
      rfcsService.createRfc(
        {
          projectId: 'PRJ-001',
          targetEcsId: 'SRC-AUTH-JWT.ts',
          title: 'Intento de registro inválido por Gestor',
          description: 'Descripción de prueba con longitud suficiente para validación.',
          justification: 'Justificación de prueba con longitud suficiente para validación.',
          priority: 'MEDIA',
        },
        gestorUser
      )
    ).rejects.toThrow('Solo el Solicitante (PU-01) está facultado para emitir solicitudes de cambio');
  });

  it('PRUEBA NEGATIVA: Debe rechazar RFC sobre ECS que pertenece a otro proyecto', async () => {
    // SRC-UI-CLAIM-FORM.tsx pertenece a PRJ-002. Si se envía con projectId: 'PRJ-001', debe rechazarse
    await expect(
      rfcsService.createRfc(
        {
          projectId: 'PRJ-001',
          targetEcsId: 'SRC-UI-CLAIM-FORM.tsx',
          title: 'Intento de contaminación cruzada entre proyectos',
          description: 'Descripción técnica válida con longitud superior a 20 caracteres.',
          justification: 'Justificación válida con longitud superior a 20 caracteres.',
          priority: 'BAJA',
        },
        solicitanteUser
      )
    ).rejects.toThrow('pertenece a un proyecto distinto');
  });

  it('PRUEBA NEGATIVA: Restricción de Ownership para PU-01 al consultar expedientes ajenos', async () => {
    // Usuario solicitante USR-999
    const otherSolicitante: AuthenticatedUser = {
      id: 'a0000001-0000-0000-0000-000000000999',
      code: 'USR-999',
      username: 'other',
      email: 'other@exodo.pe',
      fullName: 'Otro Solicitante',
      organization: 'ÉXODO S.A.C.',
      position: 'Operador',
      activeRoleId: 'PU-01',
      allowedRoleIds: ['PU-01'],
      assignedProjectIds: ['PRJ-001'],
    };

    // RFC-2026-0001 fue creada por USR-001. USR-999 debe ser denegado con 403 Forbidden
    await expect(rfcsService.getRfcById('RFC-2026-0001', otherSolicitante)).rejects.toThrow(
      'Ownership SoD'
    );
  });
});
