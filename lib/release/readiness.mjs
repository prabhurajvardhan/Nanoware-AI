export const GATE_STATUSES = Object.freeze(['PASS', 'FAIL', 'PARTIAL', 'UNVERIFIED']);

export function evaluateReleaseGates(gates) {
  if (!Array.isArray(gates) || gates.length === 0) return { status: 'UNVERIFIED', ready: false, gates: [] };
  const normalized = gates.map((gate) => ({
    id: gate.id,
    status: GATE_STATUSES.includes(gate.status) ? gate.status : 'UNVERIFIED',
    evidence: gate.evidence ?? null,
    owner: gate.owner ?? null,
    nextAction: gate.nextAction ?? null,
  }));
  const status = normalized.some((gate) => gate.status === 'FAIL') ? 'FAIL'
    : normalized.some((gate) => gate.status === 'UNVERIFIED') ? 'UNVERIFIED'
      : normalized.some((gate) => gate.status === 'PARTIAL') ? 'PARTIAL' : 'PASS';
  return Object.freeze({ status, ready: status === 'PASS', gates: normalized });
}
