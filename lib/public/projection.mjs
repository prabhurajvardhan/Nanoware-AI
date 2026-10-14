const PROFILE_FIELDS = Object.freeze(['businessId', 'name', 'description', 'contact', 'hours', 'publicationVersion']);
const SERVICE_FIELDS = Object.freeze(['id', 'name', 'description', 'durationMinutes', 'active']);

export class PublicProjectionError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PublicProjectionError';
    this.code = code;
  }
}

function pick(source, fields) {
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

export function publicBusinessProjection(record) {
  if (!record || record.status !== 'published' || record.publicationVersion === undefined) {
    throw new PublicProjectionError('BUSINESS_NOT_PUBLISHED');
  }
  const services = Array.isArray(record.services) ? record.services
    .filter((service) => service && service.active === true)
    .map((service) => pick(service, SERVICE_FIELDS)) : [];
  return Object.freeze({ ...pick(record, PROFILE_FIELDS), services });
}
