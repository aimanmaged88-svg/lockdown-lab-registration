/**
 * AI abstraction layer.
 *
 * CareOS never talks to a model vendor directly from feature code. Features
 * call this service; providers (Anthropic, OpenAI, Gemini, local models) are
 * swappable adapters behind one interface.
 *
 * Platform rules enforced at this layer, not left to prompts:
 *  1. Grounding  — requests carry only records the caller's role can access.
 *  2. Explainability — every response includes the evidence it drew from.
 *  3. Human review — drafts are returned as `pendingReview`; nothing this
 *     layer produces is ever written to a record directly.
 *  4. No diagnosis — clinical-inference requests are refused by policy.
 */

export interface AiDraftRequest {
  kind: "shift-note" | "family-summary" | "handover" | "goal-suggestion" | "trend-analysis";
  participantId: string;
  context: Record<string, unknown>;
}

export interface AiDraftResponse {
  text: string;
  reasoning: string[];
  sources: string[];
  status: "pendingReview";
}

export interface AiProvider {
  name: string;
  draft(request: AiDraftRequest): Promise<AiDraftResponse>;
}

/**
 * Demo provider — returns deterministic fixture content so the prototype is
 * fully clickable offline. Production registers a real adapter (for example
 * `anthropicProvider`) with the identical interface.
 */
export const demoProvider: AiProvider = {
  name: "demo",
  async draft(request) {
    return {
      text: `Draft ${request.kind} for ${request.participantId} — generated from demo fixtures.`,
      reasoning: ["Demo mode: content is deterministic fixture data."],
      sources: [`local:${request.participantId}`],
      status: "pendingReview",
    };
  },
};

let activeProvider: AiProvider = demoProvider;

export function setAiProvider(provider: AiProvider) {
  activeProvider = provider;
}

export function getAiProvider(): AiProvider {
  return activeProvider;
}
