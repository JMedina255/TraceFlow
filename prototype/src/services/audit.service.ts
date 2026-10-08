import type { AuditEvent } from '../types';
import { INITIAL_AUDIT_EVENTS } from '../data/initialAudit';
import { storageService } from './storage.service';

const STORAGE_KEY = 'audit_events';

export const auditService = {
  getAll(limit?: number): AuditEvent[] {
    const list = storageService.get<AuditEvent[]>(STORAGE_KEY, INITIAL_AUDIT_EVENTS);
    if (!limit) return list;
    return list.slice(0, limit);
  },

  record(event: Omit<AuditEvent, 'id' | 'timestamp' | 'sha256Hash'>): AuditEvent {
    const current = this.getAll();
    const newId = `EVT-2026-${String(current.length + 1).padStart(4, '0')}`;
    const timestamp = new Date().toISOString();
    
    // Hash simulado determinístico para demo académica
    const sha256Hash = Array.from(
      new TextEncoder().encode(`${newId}:${event.action}:${timestamp}`)
    )
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .padEnd(64, '0')
      .slice(0, 64);

    const newEvent: AuditEvent = {
      ...event,
      id: newId,
      timestamp,
      sha256Hash,
      previousEventHash: current[0]?.sha256Hash,
    };

    const updated = [newEvent, ...current];
    storageService.set(STORAGE_KEY, updated);
    return newEvent;
  },
};
