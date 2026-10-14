const ALLOWED_ROLES = new Set(['owner', 'member', 'operator']);

export class DashboardAuthorizationError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DashboardAuthorizationError';
    this.code = code;
  }
}

export function dashboardProjection(records, { businessId, role }) {
  if (!businessId || !ALLOWED_ROLES.has(role)) throw new DashboardAuthorizationError('DASHBOARD_FORBIDDEN');
  if (!Array.isArray(records)) throw new DashboardAuthorizationError('INVALID_DASHBOARD_DATA');
  return records.filter((record) => record?.businessId === businessId).map((record) => ({
    id: record.id,
    businessId: record.businessId,
    kind: record.kind,
    state: record.state,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

export function dashboardViewState({ loading, forbidden, error, items }) {
  if (loading) return 'loading';
  if (forbidden) return 'forbidden';
  if (error) return 'error';
  if (!items?.length) return 'empty';
  return 'ready';
}
