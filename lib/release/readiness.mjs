export const GATE_STATUSES = Object.freeze(['PASS', 'FAIL', 'PARTIAL', 'UNVERIFIED']);
export const MANDATORY_GATE_IDS = Object.freeze([
  'security', 'tenant-isolation', 'public-projection', 'booking', 'assistant-tools',
  'usage', 'webhooks', 'monitoring', 'backup-restore', 'rollback', 'environment', 'approval',
]);

export function evaluateReleaseGates(gates, mandatoryGateIds = MANDATORY_GATE_IDS) {
  if (!Array.isArray(gates) || gates.length === 0) return { status: 'UNVERIFIED', ready: false, gates: [] };
  const normalized = gates.map((gate) => ({
    id: gate.id,
    status: GATE_STATUSES.includes(gate.status) && !(gate.status === 'PASS' && !gate.evidence) ? gate.status : 'UNVERIFIED',
    evidence: gate.evidence ?? null,
    owner: gate.owner ?? null,
    nextAction: gate.nextAction ?? null,
  }));
  const present = new Set(normalized.map((gate) => gate.id));
  const missing = mandatoryGateIds.filter((id) => !present.has(id)).map((id) => ({
    id, status: 'UNVERIFIED', evidence: null, owner: null, nextAction: 'Provide mandatory release evidence.',
  }));
  const allGates = [...normalized, ...missing];
  const status = allGates.some((gate) => gate.status === 'FAIL') ? 'FAIL'
    : allGates.some((gate) => gate.status === 'UNVERIFIED') ? 'UNVERIFIED'
      : allGates.some((gate) => gate.status === 'PARTIAL') ? 'PARTIAL' : 'PASS';
  return Object.freeze({ status, ready: status === 'PASS', gates: allGates });
}
