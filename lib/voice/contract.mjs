export const VOICE_STATES = Object.freeze(['initiated', 'consented', 'active', 'completed', 'failed']);

export class VoiceContractError extends Error {
  constructor(code) {
    super(code);
    this.name = 'VoiceContractError';
    this.code = code;
  }
}

export function startVoiceSession({ sessionId, businessId, consent }) {
  if (!sessionId || !businessId) throw new VoiceContractError('VOICE_CONTEXT_REQUIRED');
  if (consent !== true) throw new VoiceContractError('VOICE_CONSENT_REQUIRED');
  return Object.freeze({ sessionId, businessId, state: 'consented', recordingAllowed: true });
}

export function authorizeVoiceTool({ session, tool, businessId, eventId, seenEventIds = new Set() }) {
  if (!session || session.state !== 'consented' && session.state !== 'active') throw new VoiceContractError('VOICE_SESSION_INVALID');
  if (session.businessId !== businessId) throw new VoiceContractError('VOICE_TENANT_FORBIDDEN');
  if (!['faq', 'availability', 'booking_request'].includes(tool)) throw new VoiceContractError('VOICE_TOOL_NOT_ALLOWED');
  if (!eventId || typeof eventId !== 'string') throw new VoiceContractError('VOICE_EVENT_REQUIRED');
  if (!(seenEventIds instanceof Set)) throw new VoiceContractError('VOICE_EVENT_INDEX_REQUIRED');
  if (seenEventIds.has(eventId)) throw new VoiceContractError('VOICE_EVENT_DUPLICATE');
  return Object.freeze({ sessionId: session.sessionId, eventId, tool, state: 'authorized' });
}
