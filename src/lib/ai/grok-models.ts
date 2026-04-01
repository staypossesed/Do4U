/**
 * Grok model ids for `https://api.x.ai/v1/chat/completions`.
 * Order: preferred fast Grok 4.1 → reasoning variant → legacy Grok 2 aliases (if still enabled for the team).
 * @see https://docs.x.ai/docs/models
 */
export const GROK_MODELS_WITH_VISION = [
  "grok-4-1-fast-non-reasoning",
  "grok-4-1-fast-reasoning",
  "grok-2-vision-latest",
] as const;

export const GROK_MODELS_TEXT_ONLY = [
  "grok-4-1-fast-non-reasoning",
  "grok-4-1-fast-reasoning",
  "grok-2-latest",
  "grok-2-1212",
] as const;
