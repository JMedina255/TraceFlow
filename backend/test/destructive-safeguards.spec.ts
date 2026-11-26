import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  assertSafeDestructiveDatabaseReset,
  quoteSqlIdentifier,
  isDisposableDatabaseName,
  ALLOWED_DISPOSABLE_DATABASES,
} from '../src/common/guards/test-isolation.guard.js';

describe('Salvaguardas contra Borrado Destructivo de Bases de Datos (INIT-H02-VF)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET;
    delete process.env.ALLOW_REMOTE_TEST_DML;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('debe rechazar la eliminación destructiva si falta autorización explícita', () => {
    expect(() =>
      assertSafeDestructiveDatabaseReset({
        host: '127.0.0.1',
        database: 'traceflow_cert',
      })
    ).toThrow(/sin autorización deliberada.*ALLOW_DESTRUCTIVE_DATABASE_RESET=true/);
  });

  it('debe rechazar la eliminación destructiva aun cuando ALLOW_REMOTE_TEST_DML=true esté activo', () => {
    process.env.ALLOW_REMOTE_TEST_DML = 'true';

    expect(() =>
      assertSafeDestructiveDatabaseReset({
        host: '127.0.0.1',
        database: 'traceflow_cert',
      })
    ).toThrow(/La autorización de pruebas remotas \(ALLOW_REMOTE_TEST_DML=true\) NO autoriza la eliminación destructiva/);
  });

  it('debe rechazar bases de datos no permitidas o de sistema aunque haya autorización', () => {
    process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET = 'true';

    const forbiddenDbs = ['postgres', 'template0', 'template1', 'traceflow', 'production', 'master'];
    for (const db of forbiddenDbs) {
      expect(() =>
        assertSafeDestructiveDatabaseReset({
          host: '127.0.0.1',
          database: db,
        })
      ).toThrow(/no se encuentra en la lista permitida de bases descartables/);
    }
  });

  it('debe rechazar hosts remotos o no identificados aunque haya autorización', () => {
    process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET = 'true';

    const remoteHosts = [
      'db.xmyfqxlvveiawnxgydtz.supabase.co',
      'aws-1-us-west-2.pooler.supabase.com',
      'rds.amazonaws.com',
      '192.168.1.50',
      '10.0.0.1',
    ];

    for (const host of remoteHosts) {
      expect(() =>
        assertSafeDestructiveDatabaseReset({
          host,
          database: 'traceflow_cert',
        })
      ).toThrow(/no es un PostgreSQL local aislado/);
    }
  });

  it('debe rechazar identificadores SQL con caracteres maliciosos o inyección', () => {
    process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET = 'true';

    const maliciousDbs = [
      'traceflow_cert; DROP TABLE users;',
      'db"name',
      'db name',
      'db-name',
      '',
    ];

    for (const db of maliciousDbs) {
      expect(() =>
        assertSafeDestructiveDatabaseReset({
          host: '127.0.0.1',
          database: db,
        })
      ).toThrow(/identificador.*inválido|no se especificó/i);
    }
  });

  it('quoteSqlIdentifier debe validar y entrecomillar identificadores legítimos de PostgreSQL', () => {
    expect(quoteSqlIdentifier('traceflow_cert')).toBe('"traceflow_cert"');
    expect(quoteSqlIdentifier('traceflow_test_disposable')).toBe('"traceflow_test_disposable"');
    expect(() => quoteSqlIdentifier('')).toThrow(/no puede estar vacío/);
    expect(() => quoteSqlIdentifier('1invalid_start')).toThrow(/caracteres no permitidos/);
    expect(() => quoteSqlIdentifier('invalid;injection')).toThrow(/caracteres no permitidos/);
  });

  it('isDisposableDatabaseName debe reconocer exactamente las bases descartables de la lista blanca', () => {
    for (const db of ALLOWED_DISPOSABLE_DATABASES) {
      expect(isDisposableDatabaseName(db)).toBe(true);
      expect(isDisposableDatabaseName(db.toUpperCase())).toBe(true);
    }
    expect(isDisposableDatabaseName('postgres')).toBe(false);
    expect(isDisposableDatabaseName('traceflow')).toBe(false);
    expect(isDisposableDatabaseName('production')).toBe(false);
    expect(isDisposableDatabaseName('')).toBe(false);
  });

  it('debe autorizar exitosamente cuando host es local, base es descartable y existe autorización', () => {
    process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET = 'true';

    expect(() =>
      assertSafeDestructiveDatabaseReset({
        host: '127.0.0.1',
        database: 'traceflow_cert',
      })
    ).not.toThrow();

    expect(() =>
      assertSafeDestructiveDatabaseReset({
        host: 'localhost',
        database: 'traceflow_test_disposable',
        allowDestructiveReset: true,
      })
    ).not.toThrow();
  });
});
