import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import * as crypto from 'node:crypto';

export interface AuditEventInput {
  eventCode: string;
  actorUserId?: string | null;
  actorRole: string;
  operation: string;
  entityName: string;
  entityId: string;
  projectId?: string | null;
  relatedEcnId?: string | null;
  resultStatus: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  payloadDiff?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditRecord {
  id: string;
  sequenceNumber: number;
  eventCode: string;
  timestamp: string;
  actorUserId?: string | null;
  actorRole: string;
  operation: string;
  entityName: string;
  entityId: string;
  projectId?: string | null;
  relatedEcnId?: string | null;
  resultStatus: string;
  payloadDiff: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  prevLogHash: string;
  currLogHash: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private localAuditChain: AuditRecord[] = [];
  private lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  private writeMutex: Promise<void> = Promise.resolve();

  constructor(private readonly db: DatabaseService) {}

  async logEvent(input: AuditEventInput): Promise<string> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query(
        `SELECT traceflow.append_audit_log($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) as id`,
        [
          input.eventCode,
          input.actorUserId || null,
          input.actorRole,
          input.operation,
          input.entityName,
          input.entityId,
          input.projectId || null,
          input.relatedEcnId || null,
          input.resultStatus,
          JSON.stringify(input.payloadDiff || {}),
          input.ipAddress || '127.0.0.1',
          input.userAgent || 'TraceFlow Core Backend',
        ]
      );
      return res.rows[0].id;
    }

    // Serialización en memoria sin condiciones de carrera (ADR-008)
    return new Promise((resolve) => {
      this.writeMutex = this.writeMutex.then(() => {
        const id = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const prevHash = this.lastHash;
        const payloadStr = JSON.stringify(input.payloadDiff || {});
        const hashInput = `${prevHash}${timestamp}${input.actorUserId || 'ANONYMOUS'}${input.operation}${payloadStr}`;
        const currHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        this.lastHash = currHash;

        const record: AuditRecord = {
          id,
          sequenceNumber: this.localAuditChain.length + 1,
          eventCode: input.eventCode,
          timestamp,
          actorUserId: input.actorUserId,
          actorRole: input.actorRole,
          operation: input.operation,
          entityName: input.entityName,
          entityId: input.entityId,
          projectId: input.projectId,
          relatedEcnId: input.relatedEcnId,
          resultStatus: input.resultStatus,
          payloadDiff: input.payloadDiff || {},
          ipAddress: input.ipAddress || '127.0.0.1',
          userAgent: input.userAgent || 'TraceFlow Core Backend',
          prevLogHash: prevHash,
          currLogHash: currHash,
        };

        this.localAuditChain.push(record);
        resolve(id);
      });
    });
  }

  getAuditChain(): AuditRecord[] {
    return [...this.localAuditChain];
  }

  verifyChainIntegrity(): boolean {
    for (let i = 0; i < this.localAuditChain.length; i++) {
      const current = this.localAuditChain[i];
      const prevHash = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : this.localAuditChain[i - 1].currLogHash;
      if (current.prevLogHash !== prevHash) return false;

      const payloadStr = JSON.stringify(current.payloadDiff);
      const hashInput = `${prevHash}${current.timestamp}${current.actorUserId || 'ANONYMOUS'}${current.operation}${payloadStr}`;
      const expectedCurrHash = crypto.createHash('sha256').update(hashInput).digest('hex');
      if (current.currLogHash !== expectedCurrHash) return false;
    }
    return true;
  }
}
