import { getAdminDb } from '@/lib/firebase-admin';
import type { AuditReport } from '@/lib/audit/types';

const AUDITS_COLLECTION = 'audits';

type StoredAudit = AuditReport & {
  status: 'complete' | 'failed' | 'expired';
  ownerType: 'unresolved';
  visibility: 'legacy-public-pending-policy';
  schemaVersion: 1;
  updatedAt: string;
};

function toStoredAudit(audit: AuditReport): StoredAudit {
  return {
    ...audit,
    createdAt: audit.createdAt instanceof Date ? audit.createdAt : new Date(audit.createdAt),
    updatedAt: new Date().toISOString(),
    status: 'complete',
    ownerType: 'unresolved',
    visibility: 'legacy-public-pending-policy',
    schemaVersion: 1,
  };
}

function fromFirestore(data: FirebaseFirestore.DocumentData): AuditReport {
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  } as AuditReport;
}

export async function saveAudit(audit: AuditReport): Promise<string> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(AUDITS_COLLECTION).doc(audit.id);
    await docRef.set(toStoredAudit(audit), { merge: false });
    return docRef.id;
  } catch (error) {
    console.error('Error saving audit:', error instanceof Error ? error.message : 'unknown error');
    throw new Error('Failed to save audit to database');
  }
}

export async function getAuditById(auditId: string): Promise<AuditReport | null> {
  if (!/^audit_[A-Za-z0-9_-]{8,160}$/.test(auditId)) return null;
  try {
    const doc = await getAdminDb().collection(AUDITS_COLLECTION).doc(auditId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data || data.status !== 'complete') return null;
    return fromFirestore(data);
  } catch (error) {
    console.error('Error getting audit:', error instanceof Error ? error.message : 'unknown error');
    return null;
  }
}

export async function getRecentAudits(maxCount = 20): Promise<AuditReport[]> {
  const limit = Math.max(1, Math.min(maxCount, 100));
  try {
    const snapshot = await getAdminDb().collection(AUDITS_COLLECTION).where('status', '==', 'complete').orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map((doc) => fromFirestore(doc.data()));
  } catch (error) {
    console.error('Error getting recent audits:', error instanceof Error ? error.message : 'unknown error');
    return [];
  }
}

export async function updateAudit(auditId: string, updates: Partial<AuditReport> & { status?: StoredAudit['status'] }): Promise<void> {
  await getAdminDb().collection(AUDITS_COLLECTION).doc(auditId).update({ ...updates, updatedAt: new Date().toISOString() });
}
