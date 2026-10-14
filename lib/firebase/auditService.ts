import { getAdminDb } from '@/lib/firebase-admin';
import type { AuditReport } from '@/lib/audit/types';
import crypto from 'node:crypto';

const AUDITS_COLLECTION = 'audits';

type StoredAudit = AuditReport & {
  status: 'complete' | 'failed' | 'expired';
  ownerType: 'unresolved';
  visibility: 'legacy-public-pending-policy';
  schemaVersion: 1;
  updatedAt: string;
  shareTokenHash: string;
};

function toStoredAudit(audit: AuditReport, shareTokenHash: string): StoredAudit {
  return {
    ...audit,
    createdAt: audit.createdAt instanceof Date ? audit.createdAt : new Date(audit.createdAt),
    updatedAt: new Date().toISOString(),
    status: 'complete',
    ownerType: 'unresolved',
    visibility: 'legacy-public-pending-policy',
    schemaVersion: 1,
    shareTokenHash,
  };
}

function fromFirestore(data: FirebaseFirestore.DocumentData): AuditReport {
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  } as AuditReport;
}

export async function saveAudit(audit: AuditReport, shareTokenHash: string): Promise<string> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(AUDITS_COLLECTION).doc(audit.id);
    await docRef.set(toStoredAudit(audit, shareTokenHash), { merge: false });
    return docRef.id;
  } catch (error) {
    console.error('Error saving audit:', error instanceof Error ? error.message : 'unknown error');
    throw new Error('Failed to save audit to database');
  }
}

export async function getAuditById(auditId: string, shareToken: string): Promise<AuditReport | null> {
  if (!/^audit_[A-Za-z0-9_-]{8,160}$/.test(auditId)) return null;
  if (!/^[a-f0-9]{64}$/.test(shareToken)) return null;
  try {
    const doc = await getAdminDb().collection(AUDITS_COLLECTION).doc(auditId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data || data.status !== 'complete' || typeof data.shareTokenHash !== 'string') return null;
    const expected = Buffer.from(data.shareTokenHash, 'hex');
    const supplied = Buffer.from(crypto.createHash('sha256').update(shareToken).digest('hex'), 'hex');
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;
    return fromFirestore(data);
  } catch (error) {
    console.error('Error getting audit:', error instanceof Error ? error.message : 'unknown error');
    return null;
  }
}

export async function updateAudit(auditId: string, updates: Partial<AuditReport> & { status?: StoredAudit['status'] }): Promise<void> {
  await getAdminDb().collection(AUDITS_COLLECTION).doc(auditId).update({ ...updates, updatedAt: new Date().toISOString() });
}
