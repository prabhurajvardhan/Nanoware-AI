const TOOLS = Object.freeze({
  faq: Object.freeze({ roles: ['public', 'customer', 'member', 'owner'], mutation: false }),
  availability: Object.freeze({ roles: ['public', 'customer', 'member', 'owner'], mutation: false }),
  booking_request: Object.freeze({ roles: ['public', 'customer'], mutation: true }),
});

export class AssistantToolError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AssistantToolError';
    this.code = code;
  }
}

export function authorizeAssistantTool({ tool, actorRole, businessId, trustedBusinessId, idempotencyKey: key, input = {} }) {
  const definition = TOOLS[tool];
  if (!definition) throw new AssistantToolError('TOOL_NOT_ALLOWED');
  if (!definition.roles.includes(actorRole)) throw new AssistantToolError('TOOL_FORBIDDEN');
  if (typeof businessId !== 'string' || businessId !== trustedBusinessId) throw new AssistantToolError('TENANT_FORBIDDEN');
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.hasOwn(input, 'role') || Object.hasOwn(input, 'plan')) {
    throw new AssistantToolError('TOOL_INPUT_INVALID');
  }
  if (definition.mutation && (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(key))) {
    throw new AssistantToolError('TOOL_IDEMPOTENCY_REQUIRED');
  }
  return Object.freeze({ tool, mutation: definition.mutation });
}

export function isSensitiveAssistantRequest(text) {
  if (typeof text !== 'string') return true;
  return /system prompt|developer message|private notes|password|secret|api key|internal instructions/i.test(text);
}
