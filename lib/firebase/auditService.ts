import { getAdminDb } from '@/lib/firebase-admin';
import type { AuditReport } from '@/lib/audit/types';

const AUDITS_COLLECTION = 'audits';

export async function saveAudit(audit: AuditReport): Promise<string> {
  try {
    const db = getAdminDb();
    const auditData = {
      ...audit,
      createdAt: audit.createdAt instanceof Date 
        ? audit.createdAt.toISOString() 
        : audit.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(AUDITS_COLLECTION).add(auditData);
    await docRef.update({ firestoreId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error saving audit:', error);
    throw new Error('Failed to save audit to database');
  }
}

export async function getAuditById(auditId: string): Promise<AuditReport | null> {
  try {
    const db = getAdminDb();
    
    // Try by Firestore ID
    const docRef = db.collection(AUDITS_COLLECTION).doc(auditId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data()!;
      return {
        ...data,
        createdAt: data.createdAt 
          ? new Date(data.createdAt)
          : new Date(),
      } as AuditReport;
    }

    // Try by custom id field
    const querySnapshot = await db.collection(AUDITS_COLLECTION)
      .where('id', '==', auditId)
      .limit(1)
      .get();
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt 
          ? new Date(data.createdAt)
          : new Date(),
      } as AuditReport;
    }

    return null;
  } catch (error) {
    console.error('Error getting audit:', error);
    return null;
  }
}

export async function getAuditsByUrl(url: string): Promise<AuditReport[]> {
  try {
    const db = getAdminDb();
    const querySnapshot = await db.collection(AUDITS_COLLECTION)
      .where('url', '==', url)
      .orderBy('createdAt', 'desc')
      .get();
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt 
          ? new Date(data.createdAt)
          : new Date(),
      } as AuditReport;
    });
  } catch (error) {
    console.error('Error getting audits by URL:', error);
    return [];
  }
}

export async function getRecentAudits(maxCount: number = 20): Promise<AuditReport[]> {
  try {
    const db = getAdminDb();
    const querySnapshot = await db.collection(AUDITS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(maxCount)
      .get();
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt 
          ? new Date(data.createdAt)
          : new Date(),
      } as AuditReport;
    });
  } catch (error) {
    console.error('Error getting recent audits:', error);
    return [];
  }
}

export async function updateAudit(auditId: string, updates: Partial<AuditReport>): Promise<void> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(AUDITS_COLLECTION).doc(auditId);
    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating audit:', error);
    throw new Error('Failed to update audit');
  }
}
