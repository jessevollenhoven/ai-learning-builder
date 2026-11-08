// Calls Gemini's structured-output REST API from the server only.
import "server-only";

import type { GenerateRequest } from "./schemas";

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

export type GeminiErrorKind = "not_configured" | "rate_limit" | "timeout" | "unavailable" | "blocked" | "empty";

export class GeminiProviderError extends Error {
  constructor(readonly kind: GeminiErrorKind) {
    super(kind);
    this.name = "GeminiProviderError";
  }
}

type GeminiFailureLog = {
  category: GeminiErrorKind;
  httpStatus: number | null;
  googleStatus: string | null;
  googleMessage: string | null;
  model: string;
};

function collectRequestText(request: GenerateRequest): string[] {
  if (!("mode" in request)) return [request.teacherText];

  const values = [request.instruction];
  function collect(value: unknown) {
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (typeof value === "object" && value !== null) Object.values(value).forEach(collect);
  }
  collect(request.content);
  return values;
}

function safeGoogleMessage(message: unknown, request: GenerateRequest, apiKey: string): string | null {
  if (typeof message !== "string") return null;
  let safeMessage = message.trim();
  if (!safeMessage) return null;

  safeMessage = safeMessage.split(apiKey).join("[redacted]");
  for (const userText of collectRequestText(request)) {
    if (userText) safeMessage = safeMessage.split(userText).join("[redacted]");
  }
  return safeMessage.slice(0, 240);
}

function logGeminiFailure(details: GeminiFailureLog) {
  console.error("Gemini request failed", details);
}

function failGeminiRequest(
  kind: GeminiErrorKind,
  request: GenerateRequest,
  apiKey: string,
  details: { httpStatus?: number | null; googleStatus?: unknown; googleMessage?: unknown } = {},
): never {
  logGeminiFailure({
    category: kind,
    httpStatus: details.httpStatus ?? null,
    googleStatus: typeof details.googleStatus === "string" ? details.googleStatus.slice(0, 120) : null,
    googleMessage: safeGoogleMessage(details.googleMessage, request, apiKey),
    model: GEMINI_MODEL,
  });
  throw new GeminiProviderError(kind);
}

function getGoogleError(payload: unknown): { status?: unknown; message?: unknown } {
  if (typeof payload !== "object" || payload === null) return {};

  const response = payload as { status?: unknown; error?: unknown; errors?: unknown };
  const error = typeof response.error === "object" && response.error !== null
    ? response.error as { status?: unknown; message?: unknown }
    : {};
  const diagnostic = Array.isArray(response.errors) && typeof response.errors[0] === "object" && response.errors[0] !== null
    ? response.errors[0] as { status?: unknown; code?: unknown; message?: unknown }
    : {};

  return {
    status: error.status ?? diagnostic.status ?? response.status ?? diagnostic.code,
    message: error.message ?? diagnostic.message,
  };
}

const multipleChoiceResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["multiple_choice"] },
    title: { type: "string" },
    instructions: { type: "string" },
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 15,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["type", "title", "instructions", "questions"],
} as const;

const trueFalseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["true_false"] },
    title: { type: "string" },
    instructions: { type: "string" },
    statements: {
      type: "array",
      minItems: 5,
      maxItems: 15,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          statement: { type: "string" },
          answer: { type: "boolean" },
          explanation: { type: "string" },
        },
        required: ["statement", "answer", "explanation"],
      },
    },
  },
  required: ["type", "title", "instructions", "statements"],
} as const;

const flashcardsResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["flashcards"] },
    title: { type: "string" },
    instructions: { type: "string" },
    cards: {
      type: "array",
      minItems: 5,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["type", "title", "instructions", "cards"],
} as const;

type GeneratableType = "multiple_choice" | "true_false" | "flashcards";

const responseSchemas = {
  multiple_choice: multipleChoiceResponseSchema,
  true_false: trueFalseResponseSchema,
  flashcards: flashcardsResponseSchema,
} as const;

const commonInstruction =
  "Write quiz content for a non-technical teacher. Return only the content in the required JSON shape, with no markdown or commentary. " +
  "Keep the title, instructions and all text short enough to read on a phone. ";

const systemInstructions: Record<GeneratableType, string> = {
  multiple_choice:
    commonInstruction +
    "Write 5 to 15 multiple-choice questions, each with exactly 4 distinct options and exactly one correct answer identified by correctIndex.",
  true_false:
    commonInstruction +
    "Write 5 to 15 clear true/false statements, each with a boolean answer and a short explanation. Mix true and false answers and avoid tricky wording.",
  flashcards:
    commonInstruction +
    "Write 5 to 20 flashcards. Each has a short front (a term or question) and a clear, brief back (the definition or answer). Do not repeat a front.",
};

const typeLabels: Record<GeneratableType, string> = {
  multiple_choice: "multiple-choice quiz",
  true_false: "true/false quiz",
  flashcards: "deck of flashcards",
};

function makeInput(request: GenerateRequest, repairProblems: string[], type: GeneratableType): string {
  const label = typeLabels[type];
  const task = "mode" in request
    ? `Refine this complete ${label} according to the teacher's instruction. Return the entire updated ${label}.\nCurrent content:\n${JSON.stringify(request.content)}\nTeacher instruction:\n${request.instruction}`
    : `Create a ${label} from these teacher notes:\n${request.teacherText}`;

  if (repairProblems.length === 0) return task;
  return `${task}\n\nThe previous draft failed validation. Fix these problems and return the entire corrected ${label}:\n${repairProblems.map((problem) => `- ${problem}`).join("\n")}`;
}

function extractText(payload: unknown): { status: string; text: string } {
  if (typeof payload !== "object" || payload === null) return { status: "", text: "" };
  const response = payload as { status?: unknown; output_text?: unknown; steps?: unknown };
  if (typeof response.output_text === "string") {
    return { status: typeof response.status === "string" ? response.status : "completed", text: response.output_text };
  }

  const textBlocks: string[] = [];
  if (Array.isArray(response.steps)) {
    for (const step of response.steps) {
      if (typeof step !== "object" || step === null || !("type" in step) || step.type !== "model_output") continue;
      if (!("content" in step) || !Array.isArray(step.content)) continue;
      for (const block of step.content) {
        if (typeof block === "object" && block !== null && "type" in block && block.type === "text" && "text" in block && typeof block.text === "string") {
          textBlocks.push(block.text);
        }
      }
    }
  }

  return {
    status: typeof response.status === "string" ? response.status : "",
    text: textBlocks.join("\n").trim(),
  };
}

export async function generateWithGemini(
  request: GenerateRequest,
  repairProblems: string[] = [],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) failGeminiRequest("not_configured", request, "");
  const type = request.activityType;
    if (type !== "multiple_choice" && type !== "true_false" && type !== "flashcards") {
    failGeminiRequest("unavailable", request, apiKey);
  }

  let response: Response;
  try {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        store: false,
        system_instruction: systemInstructions[type],
        input: makeInput(request, repairProblems, type),
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: responseSchemas[type],
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      failGeminiRequest("timeout", request, apiKey);
    }
    failGeminiRequest("unavailable", request, apiKey);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    failGeminiRequest(response.ok ? "empty" : response.status === 429 ? "rate_limit" : "unavailable", request, apiKey, {
      httpStatus: response.status,
    });
  }

  if (!response.ok) {
    const googleError = getGoogleError(payload);
    failGeminiRequest(response.status === 429 ? "rate_limit" : "unavailable", request, apiKey, {
      httpStatus: response.status,
      googleStatus: googleError.status,
      googleMessage: googleError.message,
    });
  }

  const result = extractText(payload);
  if (result.status !== "completed") {
    const googleError = getGoogleError(payload);
    failGeminiRequest("blocked", request, apiKey, {
      httpStatus: response.status,
      googleStatus: googleError.status ?? result.status,
      googleMessage: googleError.message,
    });
  }
  if (!result.text) {
    const googleError = getGoogleError(payload);
    failGeminiRequest("empty", request, apiKey, {
      httpStatus: response.status,
      googleStatus: googleError.status ?? result.status,
      googleMessage: googleError.message,
    });
  }
  return result.text;
}