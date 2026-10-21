import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type WebsiteProof = {
  token: string;
  dnsRecord: string;
  metaName: string;
};

type WebsiteCheck = {
  status: 'pending' | 'verified' | 'failed';
  method: 'dns' | 'meta' | null;
};

type BuildInitialBusinessWritePayloadsInput = {
  businessExists: boolean;
  businessId: string;
  userId: string;
  tradeName: string;
  slug: string;
  countryCode: string;
  businessEmail: string;
  registrationNumber?: string;
  registrationType?: 'gstin' | 'udyam' | 'other';
  verification: FirebaseFirestore.DocumentData;
  proof: WebsiteProof;
  websiteCheck: WebsiteCheck;
  now: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  registrationExists?: boolean;
  registrationCreatedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
};

export function stripUndefinedFirestoreValues<T>(value: T, insideArray = false): T {
  if (value instanceof FieldValue) {
    if (insideArray) throw new TypeError('Firestore FieldValue transforms cannot be used inside arrays.');
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map((item) => stripUndefinedFirestoreValues(item, true)) as T;
  }
  if (value === null || typeof value !== 'object') return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefinedFirestoreValues(item, insideArray)]),
  ) as T;
}

export function buildInitialBusinessWritePayloads(input: BuildInitialBusinessWritePayloadsInput) {
  const now = input.now;
  const business = stripUndefinedFirestoreValues<FirebaseFirestore.DocumentData>({
    ...(input.businessExists ? {} : {
      name: input.tradeName,
      slug: input.slug,
      ownerId: input.userId,
      status: 'active',
      timezone: input.countryCode === 'IN' ? 'Asia/Kolkata' : 'UTC',
      createdAt: now,
    }),
    verificationStatus: 'pending_verification',
    contactEmail: input.businessEmail,
    verification: {
      ...input.verification,
      submittedBy: input.userId,
      websiteProof: { ...input.proof, status: input.websiteCheck.status, method: input.websiteCheck.method, checkedAt: now },
      checks: {
        accountEmail: 'verified',
        phone: 'pending',
        websiteOwnership: input.websiteCheck.status,
        businessDomainEmail: 'pending',
        googleBusinessProfile: 'not_provided',
      },
      evidence: [{
        evidenceType: 'website_ownership',
        status: input.websiteCheck.status,
        source: input.websiteCheck.method || 'unavailable',
        checkedAt: Timestamp.now(),
      }],
      reviewReason: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    updatedAt: now,
  });

  const membership = input.businessExists ? null : stripUndefinedFirestoreValues({
    businessId: input.businessId,
    userId: input.userId,
    role: 'owner',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  const registration = input.registrationNumber ? stripUndefinedFirestoreValues({
    businessId: input.businessId,
    userId: input.userId,
    country: input.countryCode,
    registrationType: input.registrationType,
    status: 'pending_review',
    createdAt: input.registrationExists ? input.registrationCreatedAt : now,
    updatedAt: now,
  }) : null;

  return { business, membership, registration };
}
