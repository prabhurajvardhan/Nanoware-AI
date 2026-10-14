import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseGates, MANDATORY_GATE_IDS } from '../lib/release/readiness.mjs';
import { authorizeVoiceTool, startVoiceSession, VoiceContractError } from '../lib/voice/contract.mjs';

test('release readiness never treats missing evidence as ready', () => {
  assert.deepEqual(evaluateReleaseGates([]), { status: 'UNVERIFIED', ready: false, gates: [] });
  assert.equal(evaluateReleaseGates([{ id: 'build', status: 'PASS' }, { id: 'firebase', status: 'UNVERIFIED' }]).ready, false);
  assert.equal(evaluateReleaseGates([{ id: 'build', status: 'PASS' }, { id: 'security', status: 'PASS' }]).ready, false);
  const complete = MANDATORY_GATE_IDS.map((id) => ({ id, status: 'PASS', evidence: 'test evidence' }));
  assert.equal(evaluateReleaseGates(complete).ready, true);
});

test('voice contract requires consent and independently authorizes tenant-bound tools', () => {
  assert.throws(() => startVoiceSession({ sessionId: 's1', businessId: 'b1', consent: false }), /VOICE_CONSENT_REQUIRED/);
  const session = startVoiceSession({ sessionId: 's1', businessId: 'b1', consent: true });
  assert.deepEqual(authorizeVoiceTool({ session, tool: 'faq', businessId: 'b1', eventId: 'evt-1', seenEventIds: new Set() }).tool, 'faq');
  assert.throws(() => authorizeVoiceTool({ session, tool: 'booking_request', businessId: 'b1', eventId: 'evt-1', seenEventIds: new Set(['evt-1']) }), /VOICE_EVENT_DUPLICATE/);
  assert.throws(() => authorizeVoiceTool({ session, tool: 'booking_request', businessId: 'b2', eventId: 'evt-2' }), VoiceContractError);
  assert.throws(() => authorizeVoiceTool({ session, tool: 'recording', businessId: 'b1', eventId: 'evt-3' }), /VOICE_TOOL_NOT_ALLOWED/);
});
